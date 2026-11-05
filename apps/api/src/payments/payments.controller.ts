import { Controller, Get, Headers, HttpCode, Post, Query, RawBodyRequest, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../common/auth';
import { PaymentsService } from './payments.service';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const SAFE_ID = /^[\w\-=.]+$/;

/** Webhook lives under /api; the hosted checkout/return pages live under /pay (excluded from the api prefix). */
@Controller()
export class PaymentsController {
  constructor(private pay: PaymentsService) {}

  @Public() @Post('payments/cashfree/webhook') @HttpCode(200)
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('x-webhook-signature') sig?: string, @Headers('x-webhook-timestamp') ts?: string) {
    if (!this.pay.verifyWebhook(req.rawBody, sig, ts)) throw new UnauthorizedException('Bad signature');
    const body = req.body as any;
    const ref: string | undefined = body?.data?.order?.order_id;
    const status = body?.data?.payment?.payment_status;
    if (ref) await this.pay.settle(ref, status === 'SUCCESS' ? 'PAID' : status === 'FAILED' || status === 'USER_DROPPED' ? 'FAILED' : 'PENDING');
    return { ok: true };
  }

  /** Hosted checkout page (opened in an in-app browser / web redirect). */
  @Public() @Get('pay/checkout')
  checkout(@Query() q: Record<string, string>, @Res() res: Response) {
    const { ref = '', session = '', next = '', mock, amt = '0' } = q;
    if (!SAFE_ID.test(ref) || !SAFE_ID.test(session)) return res.status(400).send('Bad request');
    const nextParam = next ? `&next=${encodeURIComponent(next)}` : '';
    const sandbox = process.env.CASHFREE_ENV !== 'production';
    res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Secure payment</title><style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#f6f7f9}
.c{background:#fff;padding:28px;border-radius:16px;max-width:360px;width:90%;text-align:center;box-shadow:0 4px 24px #0001}button{background:#F57C00;color:#fff;border:0;border-radius:10px;padding:14px 20px;font-size:16px;width:100%;margin-top:12px}
.s{background:#eee;color:#333}</style></head><body><div class="c">
${mock
  ? `<h2>Mock payment gateway</h2><p>Cashfree keys are not configured. Amount: <b>₹${esc(String((+amt / 100).toFixed(2)))}</b></p>
<button onclick="location.href='/pay/mock-confirm?ref=${esc(ref)}&ok=1${esc(nextParam)}'">Simulate successful payment</button>
<button class="s" onclick="location.href='/pay/mock-confirm?ref=${esc(ref)}&ok=0${esc(nextParam)}'">Simulate failure</button>`
  : `<h2>Redirecting to payment…</h2><div id="m"></div>
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
<script>const cf=Cashfree({mode:${sandbox ? '"sandbox"' : '"production"'}});cf.checkout({paymentSessionId:${JSON.stringify(session)},redirectTarget:"_self"});</script>`}
</div></body></html>`);
  }

  @Public() @Get('pay/mock-confirm')
  async mockConfirm(@Query('ref') ref: string, @Query('ok') ok: string, @Query('next') next: string | undefined, @Res() res: Response) {
    if (this.pay.live) return res.status(404).send('Not found');
    await this.pay.settle(ref, ok === '1' ? 'PAID' : 'FAILED');
    return res.redirect(this.pay.safeNext(next) ?? '/pay/done');
  }

  @Public() @Get('pay/return')
  async ret(@Query('ref') ref: string, @Query('next') next: string | undefined, @Res() res: Response) {
    if (SAFE_ID.test(ref ?? '')) await this.pay.reconcile(ref);
    return res.redirect(this.pay.safeNext(next) ?? '/pay/done');
  }

  @Public() @Get('pay/done')
  done(@Res() res: Response) {
    res.type('html').send('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;text-align:center;padding:48px"><h2>Thanks!</h2><p>You can close this window and return to the app.</p>');
  }
}
