import type { Fulfillment, PaymentMode } from './constants';

/** All amounts are integer paise. */
export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export interface FeePolicy {
  offersPickup: boolean;
  offersDelivery: boolean;
  /** Standard delivery fee (paise) */
  deliveryFee: number;
  /** If set, orders with subtotal below this use `lowOrderDeliveryFee` (e.g. ₹50 below ₹199) */
  lowOrderThreshold: number | null;
  lowOrderDeliveryFee: number | null;
  /** Subtotal at/above which delivery is free */
  freeDeliveryAbove: number | null;
  platformFee: number;
  handlingFee: number;
  /** Charged once if the cart has any SERVICE item */
  visitingFee: number;
  partialPaymentEnabled: boolean;
  /** % of total payable upfront when PARTIAL (1-99) */
  partialPercent: number;
}

export interface PriceLine { key: 'subtotal' | 'delivery' | 'platform' | 'handling' | 'visiting'; amount: number }
export interface PriceBreakdown {
  lines: PriceLine[];
  subtotal: number;
  total: number;
  payNow: number;
  payLater: number;
  paymentMode: PaymentMode;
}

export function deliveryFeeFor(policy: FeePolicy, subtotal: number): number {
  if (policy.freeDeliveryAbove != null && subtotal >= policy.freeDeliveryAbove) return 0;
  if (policy.lowOrderThreshold != null && policy.lowOrderDeliveryFee != null && subtotal < policy.lowOrderThreshold) {
    return policy.lowOrderDeliveryFee;
  }
  return policy.deliveryFee;
}

export function computePrice(args: {
  subtotal: number;
  hasService: boolean;
  fulfillment: Fulfillment;
  paymentMode: PaymentMode;
  policy: FeePolicy;
}): PriceBreakdown {
  const { subtotal, hasService, fulfillment, policy } = args;
  if (fulfillment === 'PICKUP' && !policy.offersPickup) throw new Error('Store does not offer pickup');
  if (fulfillment === 'DELIVERY' && !policy.offersDelivery) throw new Error('Store does not offer delivery');
  if (args.paymentMode === 'PARTIAL' && !policy.partialPaymentEnabled) throw new Error('Partial payment not enabled');

  const lines: PriceLine[] = [{ key: 'subtotal', amount: subtotal }];
  // Pickup customers never pay a delivery fee.
  if (fulfillment === 'DELIVERY') lines.push({ key: 'delivery', amount: deliveryFeeFor(policy, subtotal) });
  if (policy.platformFee > 0) lines.push({ key: 'platform', amount: policy.platformFee });
  if (policy.handlingFee > 0) lines.push({ key: 'handling', amount: policy.handlingFee });
  if (hasService && policy.visitingFee > 0) lines.push({ key: 'visiting', amount: policy.visitingFee });

  const total = lines.reduce((s, l) => s + l.amount, 0);
  const payNow = args.paymentMode === 'PARTIAL' ? Math.max(100, Math.round((total * policy.partialPercent) / 100)) : total;
  const clamped = Math.min(payNow, total);
  return { lines, subtotal, total, payNow: clamped, payLater: total - clamped, paymentMode: args.paymentMode };
}

/** A store must offer at least one fulfillment method. */
export const validFulfillmentConfig = (p: Pick<FeePolicy, 'offersPickup' | 'offersDelivery'>) => p.offersPickup || p.offersDelivery;
