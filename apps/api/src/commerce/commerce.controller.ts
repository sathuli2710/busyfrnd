import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { FULFILLMENT, PAYMENT_MODES, type Fulfillment, type PaymentMode } from '@busyfrnd/shared';
import { CurrentUser, Roles, type AuthUser } from '../common/auth';
import { PrismaService } from '../common/prisma.service';
import { CommerceService } from './commerce.service';

class SetItemDto { @IsString() itemId: string; @IsInt() @Min(0) @Max(99) qty: number }
class QuoteDto { @IsString() storeId: string; @IsIn([...FULFILLMENT]) fulfillment: Fulfillment; @IsIn([...PAYMENT_MODES]) paymentMode: PaymentMode }
class CheckoutDto extends QuoteDto {
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() notes?: string;
  /** Where to send the browser after payment (deep link or web URL on an allowed origin). */
  @IsOptional() @IsString() next?: string;
}
class RetryDto { @IsOptional() @IsString() next?: string }

@Roles('CUSTOMER')
@Controller()
export class CommerceController {
  constructor(private svc: CommerceService, private prisma: PrismaService) {}

  @Get('cart') carts(@CurrentUser() u: AuthUser) { return this.svc.carts(u.id); }
  @Put('cart/:storeId/items') setItem(@CurrentUser() u: AuthUser, @Param('storeId') storeId: string, @Body() b: SetItemDto) { return this.svc.setItem(u.id, storeId, b.itemId, b.qty); }
  @Delete('cart/:storeId') clear(@CurrentUser() u: AuthUser, @Param('storeId') storeId: string) { return this.svc.clear(u.id, storeId); }

  @Post('checkout/quote') quote(@CurrentUser() u: AuthUser, @Body() b: QuoteDto) { return this.svc.quote(u.id, b.storeId, b.fulfillment, b.paymentMode); }
  @Post('checkout') checkout(@CurrentUser() u: AuthUser, @Body() b: CheckoutDto) { return this.svc.checkout(u.id, b); }

  @Get('orders') orders(@CurrentUser() u: AuthUser) { return this.svc.orders(u.id); }
  @Get('orders/:id') order(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.order(u.id, id); }
  @Post('orders/:id/pay') pay(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() b: RetryDto) { return this.svc.startPayment(id, u.id, b.next); }
  @Post('orders/:id/cancel') cancel(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.cancel(u.id, id); }
}

/** Notifications are available to every signed-in role. */
@Controller('notifications')
export class NotificationsController {
  constructor(private prisma: PrismaService) {}
  @Get() list(@CurrentUser() u: AuthUser) { return this.prisma.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  @Post('read-all') async readAll(@CurrentUser() u: AuthUser) { await this.prisma.notification.updateMany({ where: { userId: u.id, readAt: null }, data: { readAt: new Date() } }); return { ok: true }; }
}
