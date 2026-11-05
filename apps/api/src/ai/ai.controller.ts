import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { LANGUAGES, type Language } from '@busyfrnd/shared';
import { CurrentUser, Roles, type AuthUser } from '../common/auth';
import { AiService } from './ai.service';

class VoiceDto { @IsString() @MaxLength(4000) text: string; @IsIn([...LANGUAGES]) language: Language }

class ShopDto {
  @IsString() @MaxLength(300) text: string;
  @Type(() => Number) @IsNumber() lat: number;
  @Type(() => Number) @IsNumber() lng: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(50) radius?: number;
  @IsIn([...LANGUAGES]) language: Language;
}

@Roles('CUSTOMER')
@Controller('ai')
export class ShopAiController {
  constructor(private ai: AiService) {}
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) @Post('shop')
  shop(@Body() b: ShopDto) { return this.ai.shop(b.text, { lat: b.lat, lng: b.lng, radius: b.radius ?? 20 }, b.language); }
}

@Roles('VENDOR')
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}
  @Post('onboarding') onboarding(@CurrentUser() u: AuthUser, @Body() b: VoiceDto) { return this.ai.onboard(u.id, b.text, b.language); }
  @Post('assistant') assistant(@CurrentUser() u: AuthUser, @Body() b: VoiceDto) { return this.ai.assistant(u.id, b.text, b.language); }
}
