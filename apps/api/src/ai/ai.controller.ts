import { Body, Controller, Post } from '@nestjs/common';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { LANGUAGES, type Language } from '@busyfrnd/shared';
import { CurrentUser, Roles, type AuthUser } from '../common/auth';
import { AiService } from './ai.service';

class VoiceDto { @IsString() @MaxLength(4000) text: string; @IsIn([...LANGUAGES]) language: Language }

@Roles('VENDOR')
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}
  @Post('onboarding') onboarding(@CurrentUser() u: AuthUser, @Body() b: VoiceDto) { return this.ai.onboard(u.id, b.text, b.language); }
  @Post('assistant') assistant(@CurrentUser() u: AuthUser, @Body() b: VoiceDto) { return this.ai.assistant(u.id, b.text, b.language); }
}
