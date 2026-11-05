import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LAYOUT_TEMPLATES, LANGUAGES, PLANS } from '@busyfrnd/shared';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { AuthGuard, Public } from './common/auth';
import { CoreModule } from './common/core.module';
import { CommerceModule } from './commerce/commerce.module';
import { PaymentsModule } from './payments/payments.module';
import { VendorModule } from './vendor/vendor.module';

@Controller()
class MetaController {
  @Public() @Get('health') health() { return { ok: true }; }
  @Public() @Get('meta') meta() { return { languages: LANGUAGES, plans: Object.values(PLANS), templates: LAYOUT_TEMPLATES.length, auth: process.env.AUTH_PROVIDER ?? 'mock' }; }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    CoreModule, PaymentsModule, AuthModule, CatalogModule, CommerceModule, VendorModule, AiModule, AdminModule,
  ],
  controllers: [MetaController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
