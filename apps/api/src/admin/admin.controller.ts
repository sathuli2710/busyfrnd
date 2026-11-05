import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CurrentUser, Roles, type AuthUser } from '../common/auth';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../common/notifications.service';
import { storePage } from '../common/mappers';
import { effectivePlan } from '../common/plan.service';

class ReviewDto {
  @IsIn(['APPROVE', 'REJECT', 'SUSPEND', 'REINSTATE']) decision: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REINSTATE';
  @IsOptional() @IsString() notes?: string;
}

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService, private notify: NotificationsService) {}

  @Get('stats')
  async stats() {
    const [customers, vendors, stores, inReview, published, orders, gmv] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }), this.prisma.vendor.count(), this.prisma.store.count(),
      this.prisma.store.count({ where: { status: 'IN_REVIEW' } }), this.prisma.store.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.order.count({ where: { status: { notIn: ['PENDING_PAYMENT', 'CANCELLED'] } } }),
      this.prisma.order.aggregate({ where: { status: { notIn: ['PENDING_PAYMENT', 'CANCELLED'] } }, _sum: { total: true } }),
    ]);
    const subs = await this.prisma.subscriptionPayment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } });
    return { customers, vendors, stores, inReview, published, orders, gmvPaise: gmv._sum.total ?? 0, subscriptionRevenuePaise: subs._sum.amount ?? 0 };
  }

  @Get('stores')
  stores(@Query('status') status?: string) {
    return this.prisma.store.findMany({
      where: status ? { status: status as never } : {}, orderBy: [{ submittedAt: 'asc' }, { createdAt: 'desc' }], take: 200,
      include: { vendor: { include: { user: { select: { phone: true, email: true, name: true } } } }, _count: { select: { items: true } } },
    });
  }

  /** Full render-ready store (every page/section) + review history, for the review screen. */
  @Get('stores/:id')
  async store(@Param('id') id: string) {
    const s = await this.prisma.store.findUnique({ where: { id }, include: { items: true, reviews: { orderBy: { createdAt: 'desc' } }, vendor: { include: { user: { select: { phone: true, email: true, name: true } } } } } });
    if (!s) throw new NotFoundException('Store not found');
    return { page: storePage(s), status: s.status, wantWeb: s.wantWeb, wantApp: s.wantApp, rejectionReason: s.rejectionReason, reviews: s.reviews, vendor: { phone: s.vendor.user.phone, email: s.vendor.user.email, name: s.vendor.user.name, plan: effectivePlan(s.vendor) } };
  }

  @Post('stores/:id/review')
  async review(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Body() b: ReviewDto) {
    const s = await this.prisma.store.findUnique({ where: { id }, include: { vendor: true } });
    if (!s) throw new NotFoundException('Store not found');
    const allowed: Record<string, string[]> = { APPROVE: ['IN_REVIEW'], REJECT: ['IN_REVIEW'], SUSPEND: ['PUBLISHED', 'APPROVED'], REINSTATE: ['SUSPENDED'] };
    if (!allowed[b.decision].includes(s.status)) throw new BadRequestException(`Cannot ${b.decision.toLowerCase()} a store that is ${s.status}`);
    if (b.decision === 'REJECT' && !b.notes?.trim()) throw new BadRequestException('Please tell the vendor what to fix');
    const next = { APPROVE: 'APPROVED', REJECT: 'REJECTED', SUSPEND: 'SUSPENDED', REINSTATE: 'APPROVED' }[b.decision] as 'APPROVED';
    await this.prisma.$transaction([
      this.prisma.store.update({ where: { id }, data: { status: next, rejectionReason: b.decision === 'REJECT' || b.decision === 'SUSPEND' ? b.notes : null, ...(b.decision === 'SUSPEND' ? { publishWeb: false, publishApp: false } : {}) } }),
      this.prisma.reviewLog.create({ data: { storeId: id, adminId: admin.id, decision: next, notes: b.notes } }),
    ]);
    const msg = { APPROVE: 'Your store was approved! You can publish it now.', REJECT: `Your store needs changes: ${b.notes}`, SUSPEND: `Your store was suspended: ${b.notes ?? ''}`, REINSTATE: 'Your store was reinstated. You can publish it again.' }[b.decision];
    await this.notify.notify(s.vendor.userId, `Review: ${s.name}`, msg, { storeId: id });
    return { id, status: next };
  }

  @Get('vendors')
  vendors() {
    return this.prisma.vendor.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { user: { select: { phone: true, email: true, name: true } }, _count: { select: { stores: true } } } });
  }

  @Get('customers')
  customers() {
    return this.prisma.user.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, phone: true, email: true, name: true, createdAt: true, _count: { select: { orders: true } } } });
  }

  @Get('orders')
  orders() {
    return this.prisma.order.findMany({ where: { status: { not: 'PENDING_PAYMENT' } }, orderBy: { createdAt: 'desc' }, take: 200, include: { store: { select: { name: true } }, user: { select: { phone: true } } } });
  }

  @Patch('vendors/:id/plan')
  async setPlan(@Param('id') id: string, @Body() b: { plan: 'TRIAL' | 'FREE' | 'PLUS' | 'PRO'; days?: number }) {
    if (!['TRIAL', 'FREE', 'PLUS', 'PRO'].includes(b.plan)) throw new BadRequestException('Bad plan');
    return this.prisma.vendor.update({ where: { id }, data: { plan: b.plan, ...(b.plan === 'PLUS' || b.plan === 'PRO' ? { periodEndsAt: new Date(Date.now() + (b.days ?? 30) * 86_400_000) } : {}), ...(b.plan === 'TRIAL' ? { trialEndsAt: new Date(Date.now() + (b.days ?? 60) * 86_400_000) } : {}) } });
  }
}
