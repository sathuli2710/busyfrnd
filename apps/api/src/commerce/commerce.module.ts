import { Module } from '@nestjs/common';
import { CommerceController, NotificationsController } from './commerce.controller';
import { CommerceService } from './commerce.service';

@Module({ controllers: [CommerceController, NotificationsController], providers: [CommerceService] })
export class CommerceModule {}
