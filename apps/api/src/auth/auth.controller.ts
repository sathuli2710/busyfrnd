import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { LANGUAGES, MAX_RADIUS_KM, MIN_RADIUS_KM, type Language } from '@busyfrnd/shared';
import { CurrentUser, Public, type AuthUser } from '../common/auth';
import { PrismaService } from '../common/prisma.service';
import { AuthService, toSessionUser } from './auth.service';

class RequestOtpDto {
  @IsString() phone: string;
  @IsIn(['CUSTOMER', 'VENDOR']) role: 'CUSTOMER' | 'VENDOR';
  @IsOptional() @IsEmail() email?: string;
}
class VerifyOtpDto extends RequestOtpDto {
  @IsString() @Length(4, 8) code: string;
  @IsOptional() @IsString() @Length(4, 8) emailCode?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsIn([...LANGUAGES]) language?: Language;
}
class AdminLoginDto { @IsEmail() email: string; @IsString() password: string }
class ClerkDto { @IsString() token: string; @IsIn(['CUSTOMER', 'VENDOR']) role: 'CUSTOMER' | 'VENDOR' }
class UpdateMeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsIn([...LANGUAGES]) language?: Language;
  @IsOptional() @IsInt() @Min(MIN_RADIUS_KM) @Max(MAX_RADIUS_KM) radiusKm?: number;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() pushToken?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public() @Throttle({ default: { limit: 5, ttl: 60_000 } }) @Post('otp/request')
  request(@Body() dto: RequestOtpDto) { return this.auth.requestOtp(dto); }

  @Public() @Throttle({ default: { limit: 10, ttl: 60_000 } }) @Post('otp/verify')
  verify(@Body() dto: VerifyOtpDto) { return this.auth.verifyOtp(dto); }

  @Public() @Throttle({ default: { limit: 10, ttl: 60_000 } }) @Post('admin/login')
  admin(@Body() dto: AdminLoginDto) { return this.auth.adminLogin(dto.email, dto.password); }

  @Public() @Post('clerk/exchange')
  clerk(@Body() dto: ClerkDto) { return this.auth.clerkExchange(dto.token, dto.role); }
}

@Controller('me')
export class MeController {
  constructor(private prisma: PrismaService) {}

  @Get() async get(@CurrentUser() u: AuthUser) {
    return toSessionUser(await this.prisma.user.findUniqueOrThrow({ where: { id: u.id } }));
  }

  @Patch() async update(@CurrentUser() u: AuthUser, @Body() dto: UpdateMeDto) {
    return toSessionUser(await this.prisma.user.update({ where: { id: u.id }, data: dto }));
  }
}
