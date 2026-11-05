export type PlanId = 'TRIAL' | 'FREE' | 'PLUS' | 'PRO';

export interface PlanDef {
  id: PlanId;
  name: string;
  /** monthly price in paise; PLACEHOLDER values — finalise before launch */
  pricePaise: number;
  maxStores: number;
  /** Highest layout tier that may be used */
  layoutTier: 'BASIC' | 'PLUS' | 'PRO';
  aiTokensPerPeriod: number;
  channels: { web: boolean; app: boolean };
  features: string[];
}

export const PLANS: Record<PlanId, PlanDef> = {
  TRIAL: {
    id: 'TRIAL', name: '60-day Free Trial', pricePaise: 0, maxStores: 2, layoutTier: 'PRO',
    aiTokensPerPeriod: 60_000, channels: { web: true, app: true },
    features: ['All layouts', 'Voice assistant (limited tokens)', 'Web + App publishing'],
  },
  FREE: {
    id: 'FREE', name: 'Free (after trial)', pricePaise: 0, maxStores: 1, layoutTier: 'BASIC',
    aiTokensPerPeriod: 5_000, channels: { web: true, app: false },
    features: ['Basic layouts', 'Web publishing only'],
  },
  PLUS: {
    id: 'PLUS', name: 'Plus', pricePaise: 49_900, maxStores: 5, layoutTier: 'PLUS',
    aiTokensPerPeriod: 500_000, channels: { web: true, app: true },
    features: ['20+ layouts', 'Up to 5 stores', 'More AI tokens', 'Web + App publishing'],
  },
  PRO: {
    id: 'PRO', name: 'Pro', pricePaise: 149_900, maxStores: 10, layoutTier: 'PRO',
    aiTokensPerPeriod: 3_000_000, channels: { web: true, app: true },
    features: ['All 60+ layouts', 'Up to 10 stores', 'Highest AI tokens', 'Priority review'],
  },
};

export const PAID_PLANS: PlanId[] = ['PLUS', 'PRO'];
const TIER_RANK = { BASIC: 0, PLUS: 1, PRO: 2 } as const;
export const tierAllowed = (planTier: PlanDef['layoutTier'], layoutTier: PlanDef['layoutTier']) =>
  TIER_RANK[layoutTier] <= TIER_RANK[planTier];
