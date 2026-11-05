import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PLANS } from '@busyfrnd/shared';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../common/notifications.service';

export interface GatewaySession { paymentSessionId: string; mock: boolean }
type GatewayStatus = 'PAID' | 'FAILED' | 'PENDING';

@Injectable()
export class PaymentsService {
  private log = new Logger('Payments');
  constructor(private prisma: PrismaService, private notify: NotificationsService) {}

  get live() { return !!(process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET); }
  private get base() { return process.env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'; }
  private get headers() {
    return { 'content-type': 'application/json', 'x-api-version': '2023-08-01', 'x-client-id': process.env.CASHFREE_CLIENT_ID!, 'x-client-secret': process.env.CASHFREE_CLIENT_SECRET! };
  }
  publicUrl() { return (process.env.PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, ''); }

  /** Only allow redirects back into our own apps/sites. */
  safeNext(next?: string): string | undefined {
    if (!next) return undefined;
    const origins = (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (/^busyfrnd-(customer|vendor):\/\//.test(next) || origins.some((o) => next.startsWith(o + '/') || next === o)) return next;
    return undefined;
  }

  async createSession(a: { ref: string; amountPaise: number; customerId: string; phone: string; email?: string | null; next?: string }): Promise<GatewaySession & { checkoutUrl: string }> {
    const next = this.safeNext(a.next);
    const q = new URLSearchParams({ ref: a.ref, ...(next ? { next } : {}) });
    if (!this.live) {
      const session = `mock_${a.ref}`;
      return { paymentSessionId: session, mock: true, checkoutUrl: `${this.publicUrl()}/pay/checkout?${q}&session=${session}&amt=${a.amountPaise}&mock=1` };
    }
    const res = await fetch(`${this.base}/orders`, {
      method: 'POST', headers: this.headers,
      body: JSON.stringify({
        order_id: a.ref, order_amount: +(a.amountPaise / 100).toFixed(2), order_currency: 'INR',
        customer_details: { customer_id: a.customerId, customer_phone: a.phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10), ...(a.email ? { customer_email: a.email } : {}) },
        order_meta: { return_url: `${this.publicUrl()}/pay/return?${q}`, notify_url: `${this.publicUrl()}/api/payments/cashfree/webhook` },
      }),
    });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok || !body.payment_session_id) {
      this.log.error(`Cashfree create order failed: ${res.status} ${JSON.stringify(body)}`);
      throw new BadRequestException('Could not start payment. Please try again.');
    }
    return { paymentSessionId: body.payment_session_id, mock: false, checkoutUrl: `${this.publicUrl()}/pay/checkout?${q}&session=${encodeURIComponent(body.payment_session_id)}` };
  }

  async fetchStatus(ref: string): Promise<GatewayStatus> {
    if (!this.live) return 'PENDING'; // mock gateway only settles via explicit confirm
    const res = await fetch(`${this.base}/orders/${encodeURIComponent(ref)}`, { headers: this.headers });
    const body: any = await res.json().catch(() => ({}));
    if (body.order_status === 'PAID') return 'PAID';
    if (body.order_status === 'EXPIRED' || body.order_status === 'TERMINATED') return 'FAILED';
    return 'PENDING';
  }

  verifyWebhook(rawBody: Buffer | undefined, signature?: string, timestamp?: string): boolean {
    if (!this.live || !rawBody || !signature || !timestamp) return false;
    const expected = createHmac('sha256', process.env.CASHFREE_CLIENT_SECRET!).update(timestamp + rawBody.toString('utf8')).digest('base64');
    const a = Buffer.from(expected); const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Idempotently apply a gateway outcome to the order / subscription behind `ref`. */
  async settle(ref: string, status: GatewayStatus) {
    if (status === 'PENDING') return;
    if (ref.startsWith('o_')) return this.settleOrder(ref, status);
    if (ref.startsWith('s_')) return this.settleSubscription(ref, status);
  }

  private async settleOrder(ref: string, status: Exclude<GatewayStatus, 'PENDING'>) {
    const pay = await this.prisma.payment.findUnique({ where: { gatewayRef: ref }, include: { order: { include: { store: { include: { vendor: true } } } } } });
    if (!pay || pay.status !== 'CREATED') return;
    if (status === 'FAILED') { await this.prisma.payment.update({ where: { id: pay.id }, data: { status: 'FAILED' } }); return; }
    const o = pay.order;
    await this.prisma.$transaction([
      this.prisma.payment.update({ where: { id: pay.id }, data: { status: 'PAID' } }),
      this.prisma.order.update({ where: { id: o.id }, data: { paid: { increment: pay.amount }, status: o.status === 'PENDING_PAYMENT' ? 'PLACED' : o.status } }),
      this.prisma.cartLine.deleteMany({ where: { cart: { userId: o.userId, storeId: o.storeId } } }),
      this.prisma.cart.deleteMany({ where: { userId: o.userId, storeId: o.storeId } }),
    ]);
    await this.notify.notify(o.store.vendor.userId, 'New order', `Order #${o.id.slice(-6).toUpperCase()} — ₹${(o.total / 100).toFixed(0)} (${o.fulfillment.toLowerCase()})`, { orderId: o.id });
    await this.notify.notify(o.userId, 'Order placed', `${o.store.name} received your order.`, { orderId: o.id });
  }

  private async settleSubscription(ref: string, status: Exclude<GatewayStatus, 'PENDING'>) {
    const pay = await this.prisma.subscriptionPayment.findUnique({ where: { gatewayRef: ref }, include: { vendor: true } });
    if (!pay || pay.status !== 'CREATED') return;
    if (status === 'FAILED') { await this.prisma.subscriptionPayment.update({ where: { id: pay.id }, data: { status: 'FAILED' } }); return; }
    const start = pay.vendor.periodEndsAt && pay.vendor.periodEndsAt > new Date() && pay.vendor.plan === pay.plan ? pay.vendor.periodEndsAt : new Date();
    await this.prisma.$transaction([
      this.prisma.subscriptionPayment.update({ where: { id: pay.id }, data: { status: 'PAID' } }),
      this.prisma.vendor.update({ where: { id: pay.vendorId }, data: { plan: pay.plan, periodEndsAt: new Date(start.getTime() + 30 * 86_400_000), aiTokensUsed: 0, aiPeriodStart: new Date() } }),
    ]);
    await this.notify.notify(pay.vendor.userId, 'Plan activated', `${PLANS[pay.plan].name} is now active.`);
  }

  /** Called after the customer returns from checkout: ask the gateway, then settle. */
  async reconcile(ref: string) {
    await this.settle(ref, await this.fetchStatus(ref));
  }
}
