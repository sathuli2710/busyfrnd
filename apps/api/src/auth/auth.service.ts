import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import type { OtpChannel, Role, User } from '@prisma/client';
import { TRIAL_DAYS, type AuthResult, type Language, type SessionUser } from '@busyfrnd/shared';
import { PrismaService } from '../common/prisma.service';
import { MockEmailProvider, MockSmsProvider, SmtpEmailProvider, type EmailProvider, type SmsProvider } from './providers';

const OTP_TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;
const hash = (s: string) => createHash('sha256').update(s).digest('hex');

export function normalizePhone(raw: string): string {
  const d = raw.replace(/[^\d+]/g, '');
  if (/^\+\d{11,14}$/.test(d)) return d;
  if (/^\d{10}$/.test(d)) return `+91${d}`;
  if (/^0\d{10}$/.test(d)) return `+91${d.slice(1)}`;
  if (/^91\d{10}$/.test(d)) return `+${d}`;
  throw new BadRequestException('Enter a valid mobile number');
}

export function toSessionUser(u: User): SessionUser {
  return {
    id: u.id, role: u.role, phone: u.phone ?? '', email: u.email, name: u.name,
    language: (u.language as Language) ?? 'en', radiusKm: u.radiusKm, lat: u.lat, lng: u.lng,
  };
}

@Injectable()
export class AuthService {
  private sms: SmsProvider;
  private email: EmailProvider;

  constructor(private prisma: PrismaService, private jwt: JwtService, mockSms: MockSmsProvider, mockEmail: MockEmailProvider, smtp: SmtpEmailProvider) {
    this.sms = mockSms; // swap here for a real DLT provider
    this.email = process.env.EMAIL_PROVIDER === 'smtp' && process.env.SMTP_URL ? smtp : mockEmail;
  }

  private get mock() {
    return (process.env.SMS_PROVIDER ?? 'mock') === 'mock';
  }

  private async issue(target: string, channel: OtpChannel) {
    const code = this.mock ? (process.env.MOCK_OTP_CODE ?? '123456') : String(randomInt(100000, 1000000));
    await this.prisma.otpCode.updateMany({ where: { target, channel, consumed: false }, data: { consumed: true } });
    await this.prisma.otpCode.create({ data: { target, channel, codeHash: hash(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
    return code;
  }

  private async check(target: string, channel: OtpChannel, code: string) {
    const rec = await this.prisma.otpCode.findFirst({ where: { target, channel, consumed: false }, orderBy: { createdAt: 'desc' } });
    if (!rec || rec.expiresAt < new Date()) throw new UnauthorizedException(`${channel === 'PHONE' ? 'SMS' : 'Email'} OTP expired — request a new one`);
    if (rec.attempts >= MAX_ATTEMPTS) throw new UnauthorizedException('Too many attempts — request a new OTP');
    if (rec.codeHash !== hash(code)) {
      await this.prisma.otpCode.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
      throw new UnauthorizedException('Incorrect OTP');
    }
    await this.prisma.otpCode.update({ where: { id: rec.id }, data: { consumed: true } });
  }

  async requestOtp(input: { phone: string; role: Role; email?: string }) {
    if (input.role === 'ADMIN') throw new BadRequestException('Use admin login');
    const phone = normalizePhone(input.phone);
    if (input.role === 'VENDOR' && !input.email) throw new BadRequestException('Vendors must provide an email');
    const phoneCode = await this.issue(phone, 'PHONE');
    await this.sms.send(phone, `Your BusyFrnd OTP is ${phoneCode}. Valid for 5 minutes.`);
    let emailSent = false;
    if (input.role === 'VENDOR' && input.email) {
      const email = input.email.trim().toLowerCase();
      const emailCode = await this.issue(email, 'EMAIL');
      await this.email.send(email, 'Your BusyFrnd verification code', `Your verification code is ${emailCode}. Valid for 5 minutes.`);
      emailSent = true;
    }
    return { phone, emailSent, ...(this.mock ? { devHint: `Mock provider: OTP is ${process.env.MOCK_OTP_CODE ?? '123456'}` } : {}) };
  }

  async verifyOtp(input: { phone: string; code: string; role: Role; email?: string; emailCode?: string; name?: string; language?: Language }): Promise<AuthResult> {
    if (input.role === 'ADMIN') throw new BadRequestException('Use admin login');
    const phone = normalizePhone(input.phone);
    const email = input.email?.trim().toLowerCase();
    await this.check(phone, 'PHONE', input.code);
    if (input.role === 'VENDOR') {
      if (!email || !input.emailCode) throw new BadRequestException('Vendors must verify both mobile and email');
      await this.check(email, 'EMAIL', input.emailCode);
    }

    let user = await this.prisma.user.findUnique({ where: { phone_role: { phone, role: input.role } } });
    if (!user) {
      if (email) {
        const taken = await this.prisma.user.findUnique({ where: { email_role: { email, role: input.role } } });
        if (taken) throw new ConflictException('That email is already linked to another account');
      }
      user = await this.prisma.user.create({
        data: {
          phone, role: input.role, phoneVerified: true, name: input.name, language: input.language ?? 'en',
          email: email ?? null, emailVerified: input.role === 'VENDOR',
        },
      });
    } else {
      const data: Partial<User> = { phoneVerified: true };
      if (email && email !== user.email) {
        const taken = await this.prisma.user.findUnique({ where: { email_role: { email, role: input.role } } });
        if (!taken) { data.email = email; data.emailVerified = input.role === 'VENDOR'; }
      } else if (input.role === 'VENDOR') data.emailVerified = true;
      user = await this.prisma.user.update({ where: { id: user.id }, data });
    }
    if (input.role === 'VENDOR') {
      await this.prisma.vendor.upsert({
        where: { userId: user.id }, update: {},
        create: { userId: user.id, plan: 'TRIAL', trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000) },
      });
    }
    return this.session(user);
  }

  async adminLogin(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email_role: { email: email.trim().toLowerCase(), role: 'ADMIN' } } });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.session(user);
  }

  /**
   * AUTH_PROVIDER=clerk: exchange a Clerk session token (from the Clerk SDK in the app) for our API token.
   * Clerk owns the phone/SMS verification in that mode.
   */
  async clerkExchange(sessionToken: string, role: Role): Promise<AuthResult> {
    if (process.env.AUTH_PROVIDER !== 'clerk' || !process.env.CLERK_SECRET_KEY) throw new BadRequestException('Clerk auth is not enabled');
    if (role === 'ADMIN') throw new BadRequestException('Not allowed');
    const { verifyToken, createClerkClient } = await import('@clerk/backend');
    const claims = await verifyToken(sessionToken, { secretKey: process.env.CLERK_SECRET_KEY }).catch(() => null);
    if (!claims?.sub) throw new UnauthorizedException('Invalid Clerk token');
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const cu = await clerk.users.getUser(claims.sub);
    const phoneRec = cu.phoneNumbers.find((p) => p.verification?.status === 'verified');
    const emailRec = cu.emailAddresses.find((e) => e.verification?.status === 'verified');
    if (!phoneRec) throw new UnauthorizedException('Verified mobile number required');
    if (role === 'VENDOR' && !emailRec) throw new UnauthorizedException('Vendors need a verified email too');
    const phone = normalizePhone(phoneRec.phoneNumber);
    let user = await this.prisma.user.findUnique({ where: { phone_role: { phone, role } } });
    user ??= await this.prisma.user.create({
      data: { phone, role, phoneVerified: true, clerkId: role === 'CUSTOMER' ? claims.sub : null, email: emailRec?.emailAddress.toLowerCase() ?? null, emailVerified: !!emailRec, name: [cu.firstName, cu.lastName].filter(Boolean).join(' ') || null },
    });
    if (role === 'VENDOR') {
      await this.prisma.vendor.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000) } });
    }
    return this.session(user);
  }

  session(user: User): AuthResult {
    return { token: this.jwt.sign({ sub: user.id, role: user.role }), user: toSessionUser(user) };
  }
}
