import { Module } from '@nestjs/common';
import { AuthController, MeController } from './auth.controller';
import { AuthService } from './auth.service';
import { MockEmailProvider, MockSmsProvider, SmtpEmailProvider } from './providers';

@Module({
  controllers: [AuthController, MeController],
  providers: [AuthService, MockSmsProvider, MockEmailProvider, SmtpEmailProvider],
  exports: [AuthService],
})
export class AuthModule {}
