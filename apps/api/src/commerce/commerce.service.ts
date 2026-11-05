import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { computePrice, type Cart, type CartLine, type Fulfillment, type OrderDto, type PaymentMode, type Quote } from '@busyfrnd/shared';
import { PrismaService } from '../common/prisma.service';
import { policyOf } from '../common/mappers';
import { PaymentsService } from '../payments/payments.service';

type CartRow = Prisma.CartGetPayload<{ include: { store: true; lines: { include: { item: true } } } }>;

export const orderDto = (o: Prisma.OrderGetPayload<{ include: { lines: true; store: true } }>): OrderDto => ({
  id: o.id, storeId: o.storeId, storeName: o.store.name, status: o.status, fulfillment: o.fulfillment, paymentMode: o.paymentMode,
  total: o.total, paid: o.paid, due: Math.max(0, o.total - o.paid), createdAt: o.createdAt.toISOString(), deliveryAddress: o.deliveryAddress,
  lines: o.lines.map((l) => ({ itemId: l.itemId, name: l.name, pricePaise: l.price, qty: l.qty, kind: l.kind })),
  fees: o.fees as unknown as OrderDto["fees"],
});

@Injectable()
export class CommerceService {
  constructor(private prisma: PrismaService, private payments: PaymentsService) {}

  private cartDto(c: CartRow): Cart {
    const lines: CartLine[] = c.lines.map((l) => ({ itemId: l.itemId, name: l.item.name, pricePaise: l.item.pricePaise, qty: l.qty, kind: l.item.kind }));
    return { storeId: c.storeId, store: { id: c.store.id, name: c.store.name }, lines, subtotal: lines.reduce((s, l) => s + l.pricePaise * l.qty, 0) };
  }

  async carts(userId: string): Promise<Cart[]> {
    const rows = await this.prisma.cart.findMany({ where: { userId, lines: { some: {} } }, include: { store: true, lines: { include: { item: true } } }, orderBy: { updatedAt: 'desc' } });
    return rows.map((c) => this.cartDto(c));
  }

  private async cartFor(userId: string, storeId: string): Promise<CartRow> {
    const c = await this.prisma.cart.findUnique({ where: { userId_storeId: { userId, storeId } }, include: { store: true, lines: { include: { item: true } } } });
    if (!c || !c.lines.length) throw new BadRequestException('Cart is empty');
    return c;
  }

  /** One cart per store: setting qty on an item of store X only touches X's cart. */
  async setItem(userId: string, storeId: string, itemId: string, qty: number): Promise<Cart | null> {
    const item = await this.prisma.item.findFirst({ where: { id: itemId, storeId, archived: false }, include: { store: true } });
    if (!item || item.store.status !== 'PUBLISHED') throw new NotFoundException('Item not available');
    if (qty > 0 && !item.inStock) throw new BadRequestException('Item is out of stock');
    const cart = await this.prisma.cart.upsert({ where: { userId_storeId: { userId, storeId } }, update: {}, create: { userId, storeId } });
    if (qty <= 0) await this.prisma.cartLine.deleteMany({ where: { cartId: cart.id, itemId } });
    else await this.prisma.cartLine.upsert({ where: { cartId_itemId: { cartId: cart.id, itemId } }, update: { qty: Math.min(qty, 99) }, create: { cartId: cart.id, itemId, qty: Math.min(qty, 99) } });
    const row = await this.prisma.cart.findUnique({ where: { id: cart.id }, include: { store: true, lines: { include: { item: true } } } });
    if (!row || !row.lines.length) { await this.prisma.cart.delete({ where: { id: cart.id } }).catch(() => undefined); return null; }
    await this.prisma.cart.update({ where: { id: cart.id }, data: {} });
    return this.cartDto(row);
  }

  async clear(userId: string, storeId: string) {
    await this.prisma.cart.deleteMany({ where: { userId, storeId } });
    return { ok: true };
  }

  async quote(userId: string, storeId: string, fulfillment: Fulfillment, paymentMode: PaymentMode): Promise<Quote> {
    const cart = await this.cartFor(userId, storeId);
    if (cart.store.status !== 'PUBLISHED') throw new BadRequestException('Store is not accepting orders');
    if (cart.lines.some((l) => !l.item.inStock || l.item.archived)) throw new BadRequestException('Some items are no longer available');
    const subtotal = cart.lines.reduce((s, l) => s + l.item.pricePaise * l.qty, 0);
    try {
      const p = computePrice({ subtotal, hasService: cart.lines.some((l) => l.item.kind === 'SERVICE'), fulfillment, paymentMode, policy: policyOf(cart.store) });
      return { ...p, fulfillment };
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  async checkout(userId: string, input: { storeId: string; fulfillment: Fulfillment; paymentMode: PaymentMode; address?: string; lat?: number; lng?: number; notes?: string; next?: string }) {
    if (input.fulfillment === 'DELIVERY' && !input.address?.trim()) throw new BadRequestException('Delivery address is required');
    const cart = await this.cartFor(userId, input.storeId);
    const q = await this.quote(userId, input.storeId, input.fulfillment, input.paymentMode);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const order = await this.prisma.order.create({
      data: {
        userId, storeId: input.storeId, fulfillment: input.fulfillment, paymentMode: input.paymentMode, subtotal: q.subtotal,
        fees: q.lines as unknown as Prisma.InputJsonValue, total: q.total, payNow: q.payNow, notes: input.notes,
        deliveryAddress: input.fulfillment === 'DELIVERY' ? input.address : null, deliveryLat: input.lat, deliveryLng: input.lng,
        lines: { create: cart.lines.map((l) => ({ itemId: l.itemId, name: l.item.name, kind: l.item.kind, price: l.item.pricePaise, qty: l.qty })) },
      },
    });
    return this.startPayment(order.id, userId, input.next);
  }

  async startPayment(orderId: string, userId: string, next?: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING_PAYMENT') throw new BadRequestException('Order is already paid or closed');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const payment = await this.prisma.payment.create({ data: { orderId, amount: order.payNow, gatewayRef: `o_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` } });
    const s = await this.payments.createSession({ ref: payment.gatewayRef, amountPaise: order.payNow, customerId: userId, phone: user.phone ?? '', email: user.email, next });
    return { orderId, amountPaise: order.payNow, ...s };
  }

  async orders(userId: string) {
    const rows = await this.prisma.order.findMany({ where: { userId, status: { not: 'PENDING_PAYMENT' } }, include: { lines: true, store: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    return rows.map(orderDto);
  }

  async order(userId: string, id: string) {
    const o = await this.prisma.order.findFirst({ where: { id, userId }, include: { lines: true, store: true } });
    if (!o) throw new NotFoundException('Order not found');
    // Opportunistically reconcile with the gateway (covers a missed webhook).
    if (o.status === 'PENDING_PAYMENT') {
      const p = await this.prisma.payment.findFirst({ where: { orderId: id, status: 'CREATED' }, orderBy: { createdAt: 'desc' } });
      if (p) { await this.payments.reconcile(p.gatewayRef); return this.order2(userId, id); }
    }
    return orderDto(o);
  }
  private async order2(userId: string, id: string) {
    return orderDto(await this.prisma.order.findFirstOrThrow({ where: { id, userId }, include: { lines: true, store: true } }));
  }

  async cancel(userId: string, id: string) {
    const o = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!o) throw new NotFoundException('Order not found');
    if (o.status !== 'PENDING_PAYMENT') throw new ForbiddenException('Paid orders can be cancelled by the store only');
    await this.prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    return { ok: true };
  }
}
