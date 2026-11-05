import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { PlanService } from './plan.service';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  imports: [JwtModule.register({ global: true, secret: process.env.JWT_SECRET ?? 'dev-secret', signOptions: { expiresIn: '30d' } })],
  providers: [PrismaService, PlanService, NotificationsService],
  exports: [PrismaService, PlanService, NotificationsService, JwtModule],
})
export class CoreModule {}
