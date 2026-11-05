export const LANGUAGES = ['en', 'hi', 'ta'] as const;
export type Language = (typeof LANGUAGES)[number];
export const LANGUAGE_LABELS: Record<Language, string> = { en: 'English', hi: 'हिन्दी', ta: 'தமிழ்' };
/** BCP-47 locales for speech recognition / synthesis */
export const SPEECH_LOCALES: Record<Language, string> = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN' };

export const ROLES = ['CUSTOMER', 'VENDOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const FULFILLMENT = ['PICKUP', 'DELIVERY'] as const;
export type Fulfillment = (typeof FULFILLMENT)[number];

export const PAYMENT_MODES = ['FULL', 'PARTIAL'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Allowed vendor-driven status transitions. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['CANCELLED'],
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'COMPLETED'],
  OUT_FOR_DELIVERY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const STORE_STATUSES = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'SUSPENDED'] as const;
export type StoreStatus = (typeof STORE_STATUSES)[number];

export const PUBLISH_TARGETS = ['WEB', 'APP'] as const;
export type PublishTarget = (typeof PUBLISH_TARGETS)[number];

export const ITEM_KINDS = ['PRODUCT', 'SERVICE'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const STORE_CATEGORIES = [
  'grocery', 'mobile', 'electronics', 'clothing', 'pharmacy', 'bakery', 'restaurant',
  'salon', 'repair', 'hardware', 'stationery', 'furniture', 'other',
] as const;

export const DEFAULT_RADIUS_KM = 20;
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 50;
export const TRIAL_DAYS = 60;
