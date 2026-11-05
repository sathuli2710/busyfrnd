import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SmsProvider { send(phone: string, text: string): Promise<void> }
export interface EmailProvider { send(to: string, subject: string, text: string): Promise<void> }

/**
 * Dummy SMS provider (no DLT account needed). Writes the OTP to the server log.
 * To go live, implement SmsProvider for MSG91/Twilio/etc. with your DLT-registered template
 * and select it via SMS_PROVIDER in AuthService.
 */
@Injectable()
export class MockSmsProvider implements SmsProvider {
  private log = new Logger('MockSMS');
  async send(phone: string, text: string) {
    this.log.log(`SMS to ${phone}: ${text}`);
  }
}

@Injectable()
export class MockEmailProvider implements EmailProvider {
  private log = new Logger('MockEmail');
  async send(to: string, subject: string, text: string) {
    this.log.log(`EMAIL to ${to} [${subject}]: ${text}`);
  }
}

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private transport?: nodemailer.Transporter;
  async send(to: string, subject: string, text: string) {
    this.transport ??= nodemailer.createTransport(process.env.SMTP_URL!);
    await this.transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
  }
}
