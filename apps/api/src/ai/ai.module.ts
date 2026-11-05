import { Module } from '@nestjs/common';
import { AiController, ShopAiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({ controllers: [AiController, ShopAiController], providers: [AiService], exports: [AiService] })
export class AiModule {}
