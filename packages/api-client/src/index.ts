import type {
  AuthResult, Cart, Fulfillment, Item, Language, OrderDto, PaymentMode, PlanDef, PlanId, Quote, SessionUser, StorePage,
  StoreSummary, Subscription, LayoutTemplate, OrderStatus,
} from '@busyfrnd/shared';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export interface ClientOptions {
  baseUrl: string;
  /** 'app' | 'web' — lets the server only show stores published to this channel */
  channel: 'app' | 'web';
  getToken: () => string | null | undefined | Promise<string | null | undefined>;
  onUnauthorized?: () => void;
}

export interface CheckoutResult { orderId: string; amountPaise: number; paymentSessionId: string; mock: boolean; checkoutUrl: string }
export interface OnboardingDraft {
  name: string; category: string; description: string; village?: string; phone?: string; offersPickup: boolean; offersDelivery: boolean;
  deliveryFeePaise?: number; items: Array<{ name: string; pricePaise: number; kind: 'PRODUCT' | 'SERVICE' }>; templateIds: string[]; reply: string;
}
export interface VendorOrder extends OrderDto { customer: { name: string | null; phone: string | null } }
export interface VendorStore {
  id: string; name: string; category: string; status: string; templateId: string; publishWeb: boolean; publishApp: boolean;
  rejectionReason: string | null; offersPickup: boolean; offersDelivery: boolean; _count?: { items: number };
}
export interface Dashboard {
  revenueToday: number; ordersToday: number; revenueLast7Days: number; ordersLast7Days: number; pendingOrders: number;
  topItemsToday: Array<{ name: string; qty: number }>; series: Array<{ date: string; revenue: number; orders: number }>; subscription: Subscription;
}
export type VendorStorePage = StorePage & { status: string; rejectionReason: string | null; publishWeb: boolean; publishApp: boolean; wantWeb: boolean; wantApp: boolean };
export interface AppNotification { id: string; title: string; body: string; createdAt: string; readAt: string | null; data?: { orderId?: string } }

export function createApi(opts: ClientOptions) {
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await opts.getToken();
    const res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/api${path}`, {
      method,
      headers: { 'content-type': 'application/json', 'x-channel': opts.channel, ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      if (res.status === 401) opts.onUnauthorized?.();
      const m = data?.message;
      throw new ApiError(res.status, Array.isArray(m) ? m.join(', ') : (m ?? res.statusText));
    }
    return data as T;
  }
  const get = <T>(p: string) => call<T>('GET', p);
  const qs = (o: Record<string, string | number | undefined>) =>
    '?' + Object.entries(o).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
  type Near = { lat: number; lng: number; radius?: number };

  return {
    auth: {
      requestOtp: (b: { phone: string; role: 'CUSTOMER' | 'VENDOR'; email?: string }) => call<{ phone: string; emailSent: boolean; devHint?: string }>('POST', '/auth/otp/request', b),
      verifyOtp: (b: { phone: string; code: string; role: 'CUSTOMER' | 'VENDOR'; email?: string; emailCode?: string; name?: string; language?: Language }) => call<AuthResult>('POST', '/auth/otp/verify', b),
      adminLogin: (email: string, password: string) => call<AuthResult>('POST', '/auth/admin/login', { email, password }),
      clerkExchange: (token: string, role: 'CUSTOMER' | 'VENDOR') => call<AuthResult>('POST', '/auth/clerk/exchange', { token, role }),
    },
    me: {
      get: () => get<SessionUser>('/me'),
      update: (b: Partial<Pick<SessionUser, 'name' | 'email' | 'language' | 'radiusKm' | 'lat' | 'lng'>> & { pushToken?: string }) => call<SessionUser>('PATCH', '/me', b),
    },
    catalog: {
      stores: (n: Near & { q?: string; category?: string }) => get<StoreSummary[]>('/catalog/stores' + qs(n)),
      search: (n: Near & { q: string }) => get<{ stores: StoreSummary[]; items: Array<Item & { storeName: string; distanceKm: number }> }>('/catalog/search' + qs(n)),
      store: (id: string, at?: { lat: number; lng: number }) => get<StorePage>(`/catalog/stores/${id}` + (at ? qs(at) : '')),
    },
    cart: {
      list: () => get<Cart[]>('/cart'),
      setItem: (storeId: string, itemId: string, qty: number) => call<Cart | null>('PUT', `/cart/${storeId}/items`, { itemId, qty }),
      clear: (storeId: string) => call<{ ok: true }>('DELETE', `/cart/${storeId}`),
      quote: (b: { storeId: string; fulfillment: Fulfillment; paymentMode: PaymentMode }) => call<Quote>('POST', '/checkout/quote', b),
      checkout: (b: { storeId: string; fulfillment: Fulfillment; paymentMode: PaymentMode; address?: string; lat?: number; lng?: number; notes?: string; next?: string }) => call<CheckoutResult>('POST', '/checkout', b),
    },
    orders: {
      list: () => get<OrderDto[]>('/orders'),
      get: (id: string) => get<OrderDto>(`/orders/${id}`),
      pay: (id: string, next?: string) => call<CheckoutResult>('POST', `/orders/${id}/pay`, { next }),
      cancel: (id: string) => call<{ ok: true }>('POST', `/orders/${id}/cancel`),
    },
    notifications: {
      list: () => get<AppNotification[]>('/notifications'),
      readAll: () => call<{ ok: true }>('POST', '/notifications/read-all'),
    },
    vendor: {
      overview: () => get<{ subscription: Subscription; plan: PlanDef; stores: VendorStore[]; language: Language }>('/vendor/overview'),
      dashboard: () => get<Dashboard>('/vendor/dashboard'),
      layouts: () => get<Array<LayoutTemplate & { locked: boolean }>>('/vendor/layouts'),
      createStore: (b: Record<string, unknown>) => call<VendorStore>('POST', '/vendor/stores', b),
      updateStore: (id: string, b: Record<string, unknown>) => call<VendorStore>('PATCH', `/vendor/stores/${id}`, b),
      preview: (id: string) => get<VendorStorePage>(`/vendor/stores/${id}/preview`),
      submit: (id: string, web: boolean, app: boolean) => call<VendorStore>('POST', `/vendor/stores/${id}/submit`, { web, app }),
      publish: (id: string, web: boolean, app: boolean) => call<VendorStore>('POST', `/vendor/stores/${id}/publish`, { web, app }),
      unpublish: (id: string) => call<VendorStore>('POST', `/vendor/stores/${id}/unpublish`),
      items: (id: string) => get<Item[]>(`/vendor/stores/${id}/items`),
      addItems: (id: string, items: Array<Partial<Item>>) => call<Item[]>('POST', `/vendor/stores/${id}/items`, { items }),
      updateItem: (id: string, itemId: string, b: Partial<Item>) => call<Item>('PATCH', `/vendor/stores/${id}/items/${itemId}`, b),
      removeItem: (id: string, itemId: string) => call<{ ok: true }>('DELETE', `/vendor/stores/${id}/items/${itemId}`),
      orders: (status?: string) => get<VendorOrder[]>('/vendor/orders' + (status ? `?status=${status}` : '')),
      setOrderStatus: (id: string, status: OrderStatus) => call<{ id: string; status: OrderStatus }>('PATCH', `/vendor/orders/${id}/status`, { status }),
      subscribe: (plan: Exclude<PlanId, 'TRIAL' | 'FREE'>, next?: string) => call<CheckoutResult & { plan: PlanId }>('POST', '/vendor/subscription/checkout', { plan, next }),
    },
    ai: {
      onboarding: (text: string, language: Language) => call<OnboardingDraft>('POST', '/ai/onboarding', { text, language }),
      assistant: (text: string, language: Language) => call<{ reply: string; live: boolean }>('POST', '/ai/assistant', { text, language }),
    },
    admin: {
      stats: () => get<{ customers: number; vendors: number; stores: number; inReview: number; published: number; orders: number; gmvPaise: number; subscriptionRevenuePaise: number }>('/admin/stats'),
      stores: (status?: string) => get<any[]>('/admin/stores' + (status ? `?status=${status}` : '')),
      store: (id: string) => get<{ page: StorePage; status: string; wantWeb: boolean; wantApp: boolean; rejectionReason: string | null; reviews: any[]; vendor: { phone: string; email: string; name: string | null; plan: PlanId } }>(`/admin/stores/${id}`),
      review: (id: string, decision: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REINSTATE', notes?: string) => call<{ id: string; status: string }>('POST', `/admin/stores/${id}/review`, { decision, notes }),
      vendors: () => get<any[]>('/admin/vendors'),
      customers: () => get<any[]>('/admin/customers'),
      orders: () => get<any[]>('/admin/orders'),
      setPlan: (vendorId: string, plan: PlanId, days?: number) => call<any>('PATCH', `/admin/vendors/${vendorId}/plan`, { plan, days }),
    },
  };
}
export type Api = ReturnType<typeof createApi>;
