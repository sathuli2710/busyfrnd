import { effectivePlan } from './plan.service';

const day = 86_400_000;
const v = (o: Partial<Parameters<typeof effectivePlan>[0]>) => ({ plan: 'TRIAL' as const, trialEndsAt: new Date(Date.now() + 10 * day), periodEndsAt: null, ...o });

describe('effectivePlan', () => {
  it('trial is active until trialEndsAt', () => expect(effectivePlan(v({}))).toBe('TRIAL'));
  it('expired trial falls back to FREE', () => expect(effectivePlan(v({ trialEndsAt: new Date(Date.now() - day) }))).toBe('FREE'));
  it('paid plan active within period', () => expect(effectivePlan(v({ plan: 'PLUS', periodEndsAt: new Date(Date.now() + day) }))).toBe('PLUS'));
  it('lapsed paid plan falls back to FREE', () => expect(effectivePlan(v({ plan: 'PRO', periodEndsAt: new Date(Date.now() - day) }))).toBe('FREE'));
});
