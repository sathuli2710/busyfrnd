import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Store } from '@prisma/client';
import { LAYOUT_TEMPLATES, ORDER_TRANSITIONS, PLANS, getTemplate, tierAllowed, validFulfillmentConfig, type OrderStatus, type PlanId } from '@busyfrnd/shared';
import { PrismaService } from '../common/prisma.service';
import { PlanService, effectivePlan } from '../common/plan.service';
import { NotificationsService } from '../common/notifications.service';
import { AiService } from '../ai/ai.service';
import { PaymentsService } from '../payments/payments.service';
import { orderDto } from '../commerce/commerce.service';
import { itemDto, storePage } from '../common/mappers';

const IDENTITY_FIELDS = ['name', 'description', 'logoUrl', 'coverUrl'] as const;

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService, private plans: PlanService, private notify: NotificationsService, private ai: AiService, private payments: PaymentsService) {}

  async overview(userId: string) {
    const v = await this.plans.vendorFor(userId);
    const [user, stores] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.store.findMany({ where: { vendorId: v.id }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { items: true } } } }),
    ]);
    return { subscription: this.plans.subscription(v), plan: PLANS[effectivePlan(v)], stores, language: user.language };
  }

  // ---------- stores ----------
  private async ownStore(userId: string, id: string) {
    const v = await this.plans.vendorFor(userId);
    const s = await this.prisma.store.findFirst({ where: { id, vendorId: v.id } });
    if (!s) throw new NotFoundException('Store not found');
    return { v, s };
  }

  async createStore(userId: string, data: Prisma.StoreUncheckedCreateInput | Record<string, any>) {
    const v = await this.plans.vendorFor(userId);
    if ((await this.prisma.store.count({ where: { vendorId: v.id } })) >= 20) throw new BadRequestException('Store limit reached');
    const plan = PLANS[effectivePlan(v)];
    const tpl = getTemplate(data.templateId) ?? LAYOUT_TEMPLATES[0];
    if (!tierAllowed(plan.layoutTier, tpl.tier)) throw new ForbiddenException('Upgrade your plan to use this layout');
    if (!validFulfillmentConfig({ offersPickup: data.offersPickup ?? true, offersDelivery: data.offersDelivery ?? false })) throw new BadRequestException('Enable pickup, delivery or both');
    return this.prisma.store.create({
      data: { ...pickStoreFields(data), vendorId: v.id, templateId: tpl.id, name: data.name, lat: data.lat, lng: data.lng },
    });
  }

  async updateStore(userId: string, id: string, patch: Record<string, any>) {
    const { v, s } = await this.ownStore(userId, id);
    const plan = PLANS[effectivePlan(v)];
    const next = pickStoreFields(patch);
    if (next.templateId) {
      const tpl = getTemplate(next.templateId as string);
      if (!tpl) throw new BadRequestException('Unknown layout');
      if (!tierAllowed(plan.layoutTier, tpl.tier)) throw new ForbiddenException('Upgrade your plan to use this layout');
    }
    const merged = { offersPickup: s.offersPickup, offersDelivery: s.offersDelivery, ...next } as Pick<Store, 'offersPickup' | 'offersDelivery'>;
    if (!validFulfillmentConfig(merged)) throw new BadRequestException('At least one of pickup or delivery must stay enabled');
    const data: Prisma.StoreUpdateInput = { ...next };
    // Changing public identity of a live store sends it back for re-review.
    if (s.status === 'PUBLISHED' && IDENTITY_FIELDS.some((f) => f in next && (next as any)[f] !== (s as any)[f])) {
      data.status = 'IN_REVIEW'; data.submittedAt = new Date(); data.publishWeb = false; data.publishApp = false;
    }
    return this.prisma.store.update({ where: { id }, data });
  }

  async preview(userId: string, id: string) {
    await this.ownStore(userId, id);
    const s = await this.prisma.store.findUniqueOrThrow({ where: { id }, include: { items: { orderBy: { createdAt: 'asc' } } } });
    return { ...storePage(s), status: s.status, rejectionReason: s.rejectionReason, publishWeb: s.publishWeb, publishApp: s.publishApp, wantWeb: s.wantWeb, wantApp: s.wantApp, language: s.language };
  }

  async submit(userId: string, id: string, web: boolean, app: boolean) {
    const { v, s } = await this.ownStore(userId, id);
    const plan = PLANS[effectivePlan(v)];
    if (!web && !app) throw new BadRequestException('Choose web, app or both');
    if (app && !plan.channels.app) throw new ForbiddenException('Your plan does not include app publishing');
    if (!['DRAFT', 'REJECTED'].includes(s.status)) throw new BadRequestException(`Store is already ${s.status.toLowerCase()}`);
    const items = await this.prisma.item.count({ where: { storeId: id, archived: false } });
    if (!items) throw new BadRequestException('Add at least one product or service first');
    return this.prisma.store.update({ where: { id }, data: { status: 'IN_REVIEW', submittedAt: new Date(), wantWeb: web, wantApp: app, rejectionReason: null } });
  }

  async publish(userId: string, id: string, web: boolean, app: boolean) {
    const { v, s } = await this.ownStore(userId, id);
    const plan = PLANS[effectivePlan(v)];
    if (!['APPROVED', 'PUBLISHED'].includes(s.status)) throw new ForbiddenException('Admin approval is required before publishing');
    if (!web && !app) throw new BadRequestException('Choose at least one channel (use unpublish to take it offline)');
    if (app && !plan.channels.app) throw new ForbiddenException('Your plan does not include app publishing');
    const live = await this.prisma.store.count({ where: { vendorId: v.id, status: 'PUBLISHED', id: { not: id } } });
    if (live >= plan.maxStores) throw new ForbiddenException(`Your plan allows ${plan.maxStores} published store(s). Upgrade to publish more.`);
    return this.prisma.store.update({ where: { id }, data: { status: 'PUBLISHED', publishWeb: web, publishApp: app, publishedAt: s.publishedAt ?? new Date() } });
  }

  async unpublish(userId: string, id: string) {
    await this.ownStore(userId, id);
    return this.prisma.store.update({ where: { id }, data: { status: 'APPROVED', publishWeb: false, publishApp: false } });
  }

  // ---------- items ----------
  async listItems(userId: string, storeId: string) {
    await this.ownStore(userId, storeId);
    return (await this.prisma.item.findMany({ where: { storeId, archived: false }, orderBy: { createdAt: 'asc' } })).map(itemDto);
  }
  async addItems(userId: string, storeId: string, items: Array<Record<string, any>>) {
    await this.ownStore(userId, storeId);
    const data = items.slice(0, 200).map((i) => ({ storeId, name: String(i.name).slice(0, 120), description: i.description ?? null, kind: i.kind === 'SERVICE' ? ('SERVICE' as const) : ('PRODUCT' as const), pricePaise: Math.max(0, Math.round(+i.pricePaise || 0)), imageUrl: i.imageUrl ?? null, category: i.category ?? null, inStock: i.inStock !== false }));
    await this.prisma.item.createMany({ data });
    return this.listItems(userId, storeId);
  }
  async updateItem(userId: string, storeId: string, itemId: string, patch: Record<string, any>) {
    await this.ownStore(userId, storeId);
    const item = await this.prisma.item.findFirst({ where: { id: itemId, storeId } });
    if (!item) throw new NotFoundException('Item not found');
    const data: Prisma.ItemUpdateInput = {};
    for (const k of ['name', 'description', 'imageUrl', 'category', 'inStock', 'kind'] as const) if (k in patch) (data as any)[k] = patch[k];
    if ('pricePaise' in patch) data.pricePaise = Math.max(0, Math.round(+patch.pricePaise));
    return itemDto(await this.prisma.item.update({ where: { id: itemId }, data }));
  }
  async removeItem(userId: string, storeId: string, itemId: string) {
    await this.ownStore(userId, storeId);
    await this.prisma.item.updateMany({ where: { id: itemId, storeId }, data: { archived: true } });
    return { ok: true };
  }

  // ---------- orders ----------
  async orders(userId: string, status?: string) {
    const v = await this.plans.vendorFor(userId);
    const rows = await this.prisma.order.findMany({
      where: { store: { vendorId: v.id }, status: status ? (status as OrderStatus) : { not: 'PENDING_PAYMENT' } },
      include: { lines: true, store: true, user: { select: { name: true, phone: true } } }, orderBy: { createdAt: 'desc' }, take: 100,
    });
    return rows.map((o) => ({ ...orderDto(o), customer: { name: o.user.name, phone: o.user.phone } }));
  }

  async setOrderStatus(userId: string, orderId: string, to: OrderStatus) {
    const v = await this.plans.vendorFor(userId);
    const o = await this.prisma.order.findFirst({ where: { id: orderId, store: { vendorId: v.id } }, include: { store: true } });
    if (!o) throw new NotFoundException('Order not found');
    if (!ORDER_TRANSITIONS[o.status].includes(to)) throw new BadRequestException(`Cannot move order from ${o.status} to ${to}`);
    if (to === 'OUT_FOR_DELIVERY' && o.fulfillment !== 'DELIVERY') throw new BadRequestException('Not a delivery order');
    if (to === 'READY' && o.fulfillment === 'DELIVERY') { /* ready to dispatch */ }
    const updated = await this.prisma.order.update({ where: { id: o.id }, data: { status: to, ...(to === 'COMPLETED' ? { paid: o.total } : {}) } });
    const msgs: Partial<Record<OrderStatus, string>> = {
      ACCEPTED: `${o.store.name} accepted your order.`, PREPARING: `${o.store.name} is preparing your order.`,
      READY: o.fulfillment === 'PICKUP' ? `Your order is ready for pickup at ${o.store.name}.` : `Your order is packed and ready to dispatch.`,
      OUT_FOR_DELIVERY: 'Your order is out for delivery.', COMPLETED: 'Order completed. Thank you!', CANCELLED: `${o.store.name} cancelled your order.`,
    };
    if (msgs[to]) await this.notify.notify(o.userId, `Order #${o.id.slice(-6).toUpperCase()}`, msgs[to]!, { orderId: o.id, status: to });
    return { id: updated.id, status: updated.status };
  }

  // ---------- dashboard ----------
  async dashboard(userId: string) {
    const v = await this.plans.vendorFor(userId);
    const facts = await this.ai.facts(v.id);
    const since = new Date(Date.now() - 6 * 86_400_000); since.setHours(0, 0, 0, 0);
    const orders = await this.prisma.order.findMany({ where: { store: { vendorId: v.id }, createdAt: { gte: since }, status: { notIn: ['PENDING_PAYMENT', 'CANCELLED'] } }, select: { total: true, createdAt: true } });
    const series = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(since.getTime() + i * 86_400_000);
      const key = d.toDateString();
      const day = orders.filter((o) => o.createdAt.toDateString() === key);
      return { date: d.toISOString().slice(0, 10), revenue: Math.round(day.reduce((s, o) => s + o.total, 0) / 100), orders: day.length };
    });
    return { ...facts, series, subscription: this.plans.subscription(v) };
  }

  // ---------- plans ----------
  layouts(userId: string) {
    return this.plans.vendorFor(userId).then((v) => {
      const tier = PLANS[effectivePlan(v)].layoutTier;
      return LAYOUT_TEMPLATES.map((t) => ({ ...t, locked: !tierAllowed(tier, t.tier) }));
    });
  }

  async subscribe(userId: string, plan: PlanId, next?: string) {
    if (plan !== 'PLUS' && plan !== 'PRO') throw new BadRequestException('Choose Plus or Pro');
    const v = await this.plans.vendorFor(userId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const pay = await this.prisma.subscriptionPayment.create({ data: { vendorId: v.id, plan, amount: PLANS[plan].pricePaise, gatewayRef: `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` } });
    const s = await this.payments.createSession({ ref: pay.gatewayRef, amountPaise: pay.amount, customerId: userId, phone: user.phone ?? '', email: user.email, next });
    return { plan, amountPaise: pay.amount, ...s };
  }
}

const STORE_FIELDS = [
  'name', 'nameLocal', 'category', 'description', 'logoUrl', 'coverUrl', 'village', 'address', 'phone', 'hours', 'lat', 'lng', 'language', 'templateId',
  'sections', 'themeOverride', 'offersPickup', 'offersDelivery', 'deliveryFee', 'lowOrderThreshold', 'lowOrderDeliveryFee', 'freeDeliveryAbove',
  'platformFee', 'handlingFee', 'visitingFee', 'partialPaymentEnabled', 'partialPercent',
] as const;
function pickStoreFields(src: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const k of STORE_FIELDS) if (src[k] !== undefined) out[k] = src[k];
  for (const k of ['deliveryFee', 'platformFee', 'handlingFee', 'visitingFee']) if (k in out) out[k] = Math.max(0, Math.round(+out[k] || 0));
  if ('partialPercent' in out) out.partialPercent = Math.min(99, Math.max(1, Math.round(+out.partialPercent || 30)));
  return out;
}
