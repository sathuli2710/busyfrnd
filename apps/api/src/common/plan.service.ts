import { ForbiddenException, Injectable } from '@nestjs/common';
import { PLANS, type PlanId, type Subscription } from '@busyfrnd/shared';
import type { Vendor } from '@prisma/client';
import { PrismaService } from './prisma.service';

const DAY = 86_400_000;

/** Resolve the plan actually in force (trial/period expiry downgrades to FREE). */
export function effectivePlan(v: Pick<Vendor, 'plan' | 'trialEndsAt' | 'periodEndsAt'>, now = new Date()): PlanId {
  if (v.plan === 'TRIAL') return v.trialEndsAt > now ? 'TRIAL' : 'FREE';
  if ((v.plan === 'PLUS' || v.plan === 'PRO') && (!v.periodEndsAt || v.periodEndsAt < now)) return 'FREE';
  return v.plan;
}

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  async vendorFor(userId: string) {
    const v = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!v) throw new ForbiddenException('Vendor profile not found');
    return v;
  }

  subscription(v: Vendor): Subscription {
    const plan = effectivePlan(v);
    return {
      plan,
      trialEndsAt: v.trialEndsAt.toISOString(),
      periodEndsAt: v.periodEndsAt?.toISOString() ?? null,
      aiTokensUsed: v.aiTokensUsed,
      aiTokensLimit: PLANS[plan].aiTokensPerPeriod,
      daysLeft: plan === 'TRIAL' ? Math.max(0, Math.ceil((v.trialEndsAt.getTime() - Date.now()) / DAY)) : null,
    };
  }
}
