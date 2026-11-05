import type { Fulfillment, ItemKind, Language, OrderStatus, PaymentMode, Role, StoreStatus } from './constants';
import type { PlanId } from './plans';
import type { FeePolicy, PriceBreakdown } from './money';
import type { Section, Theme } from './layouts';

export interface SessionUser {
  id: string; role: Role; phone: string; email: string | null; name: string | null;
  language: Language; radiusKm: number; lat: number | null; lng: number | null;
}
export interface AuthResult { token: string; user: SessionUser }

export interface StoreSummary {
  id: string; name: string; category: string; description: string | null; logoUrl: string | null;
  village: string | null; lat: number; lng: number; distanceKm?: number;
  offersPickup: boolean; offersDelivery: boolean; templateId: string;
}
export interface Item {
  id: string; storeId: string; name: string; description: string | null; kind: ItemKind; pricePaise: number;
  imageUrl: string | null; category: string | null; inStock: boolean;
}
export interface StorePage extends StoreSummary {
  theme: Theme; sections: Section[]; policy: FeePolicy; items: Item[]; hours: string | null; phone: string | null; address: string | null;
}
export interface CartLine { itemId: string; name: string; pricePaise: number; qty: number; kind: ItemKind }
export interface Cart { storeId: string; store: Pick<StoreSummary, 'id' | 'name'>; lines: CartLine[]; subtotal: number }
export interface Quote extends PriceBreakdown { fulfillment: Fulfillment }
export interface OrderDto {
  id: string; storeId: string; storeName: string; status: OrderStatus; fulfillment: Fulfillment; paymentMode: PaymentMode;
  total: number; paid: number; due: number; createdAt: string; lines: CartLine[]; deliveryAddress: string | null;
  fees: Quote['lines'];
}
export interface Subscription { plan: PlanId; trialEndsAt: string | null; periodEndsAt: string | null; aiTokensUsed: number; aiTokensLimit: number; daysLeft: number | null }
export type { StoreStatus };
