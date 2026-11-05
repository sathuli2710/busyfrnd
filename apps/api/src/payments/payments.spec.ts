import { createHmac } from 'crypto';
import { PaymentsService } from './payments.service';

describe('PaymentsService webhook signature', () => {
  const svc = new PaymentsService({} as never, {} as never);
  beforeAll(() => { process.env.CASHFREE_CLIENT_ID = 'id'; process.env.CASHFREE_CLIENT_SECRET = 'secret'; process.env.CORS_ORIGINS = 'https://shop.example.com'; });
  const body = Buffer.from('{"data":{"order":{"order_id":"o_1"}}}');
  const ts = '1700000000';
  const sig = () => createHmac('sha256', 'secret').update(ts + body.toString()).digest('base64');

  it('accepts a valid signature', () => expect(svc.verifyWebhook(body, sig(), ts)).toBe(true));
  it('rejects a tampered body', () => expect(svc.verifyWebhook(Buffer.from('{}'), sig(), ts)).toBe(false));
  it('rejects missing headers', () => expect(svc.verifyWebhook(body, undefined, undefined)).toBe(false));
  it('only allows redirects into our apps/sites', () => {
    expect(svc.safeNext('busyfrnd-customer://orders')).toBeDefined();
    expect(svc.safeNext('https://shop.example.com/orders')).toBeDefined();
    expect(svc.safeNext('https://evil.example.org/phish')).toBeUndefined();
  });
});
