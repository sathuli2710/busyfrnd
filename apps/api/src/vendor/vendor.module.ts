import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({ imports: [AiModule], controllers: [VendorController], providers: [VendorService] })
export class VendorModule {}
