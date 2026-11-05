import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ORDER_STATUSES, type OrderStatus, type PlanId } from '@busyfrnd/shared';
import { CurrentUser, Roles, type AuthUser } from '../common/auth';
import { VendorService } from './vendor.service';

class ChannelsDto { @IsBoolean() web: boolean; @IsBoolean() app: boolean }
class ItemsDto { @IsArray() @ArrayMaxSize(200) items: Array<Record<string, any>> }
class StatusDto { @IsIn([...ORDER_STATUSES]) status: OrderStatus }
class SubscribeDto { @IsIn(['PLUS', 'PRO']) plan: PlanId; @IsOptional() @IsString() next?: string }

// NOTE: with `whitelist: true`, dynamic bodies use `Record` params (validated in the service via pickStoreFields).
@Roles('VENDOR')
@Controller('vendor')
export class VendorController {
  constructor(private v: VendorService) {}

  @Get('overview') overview(@CurrentUser() u: AuthUser) { return this.v.overview(u.id); }
  @Get('dashboard') dashboard(@CurrentUser() u: AuthUser) { return this.v.dashboard(u.id); }
  @Get('layouts') layouts(@CurrentUser() u: AuthUser) { return this.v.layouts(u.id); }

  @Post('stores') create(@CurrentUser() u: AuthUser, @Body() b: Record<string, any>) { return this.v.createStore(u.id, b); }
  @Patch('stores/:id') update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() b: Record<string, any>) { return this.v.updateStore(u.id, id, b); }
  @Get('stores/:id/preview') preview(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.v.preview(u.id, id); }
  @Post('stores/:id/submit') submit(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() b: ChannelsDto) { return this.v.submit(u.id, id, b.web, b.app); }
  @Post('stores/:id/publish') publish(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() b: ChannelsDto) { return this.v.publish(u.id, id, b.web, b.app); }
  @Post('stores/:id/unpublish') unpublish(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.v.unpublish(u.id, id); }

  @Get('stores/:id/items') items(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.v.listItems(u.id, id); }
  @Post('stores/:id/items') addItems(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() b: ItemsDto) { return this.v.addItems(u.id, id, b.items); }
  @Patch('stores/:id/items/:itemId') updateItem(@CurrentUser() u: AuthUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() b: Record<string, any>) { return this.v.updateItem(u.id, id, itemId, b); }
  @Delete('stores/:id/items/:itemId') removeItem(@CurrentUser() u: AuthUser, @Param('id') id: string, @Param('itemId') itemId: string) { return this.v.removeItem(u.id, id, itemId); }

  @Get('orders') orders(@CurrentUser() u: AuthUser, @Query('status') status?: string) { return this.v.orders(u.id, status); }
  @Patch('orders/:id/status') setStatus(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() b: StatusDto) { return this.v.setOrderStatus(u.id, id, b.status); }

  @Post('subscription/checkout') subscribe(@CurrentUser() u: AuthUser, @Body() b: SubscribeDto) { return this.v.subscribe(u.id, b.plan, b.next); }
}
