import type { Item, Store } from '@prisma/client';
import { getTemplate, DEFAULT_TEMPLATE_ID, type FeePolicy, type Item as ItemDto, type Section, type StorePage, type StoreSummary, type Theme } from '@busyfrnd/shared';

export const policyOf = (s: Store): FeePolicy => ({
  offersPickup: s.offersPickup, offersDelivery: s.offersDelivery, deliveryFee: s.deliveryFee,
  lowOrderThreshold: s.lowOrderThreshold, lowOrderDeliveryFee: s.lowOrderDeliveryFee, freeDeliveryAbove: s.freeDeliveryAbove,
  platformFee: s.platformFee, handlingFee: s.handlingFee, visitingFee: s.visitingFee,
  partialPaymentEnabled: s.partialPaymentEnabled, partialPercent: s.partialPercent,
});

export const itemDto = (i: Item): ItemDto => ({
  id: i.id, storeId: i.storeId, name: i.name, description: i.description, kind: i.kind, pricePaise: i.pricePaise,
  imageUrl: i.imageUrl, category: i.category, inStock: i.inStock,
});

export const storeSummary = (s: Store, distanceKm?: number): StoreSummary => ({
  id: s.id, name: s.name, category: s.category, description: s.description, logoUrl: s.logoUrl, village: s.village,
  lat: s.lat, lng: s.lng, offersPickup: s.offersPickup, offersDelivery: s.offersDelivery, templateId: s.templateId,
  ...(distanceKm != null ? { distanceKm: Math.round(distanceKm * 10) / 10 } : {}),
});

export function storePage(s: Store & { items: Item[] }, distanceKm?: number): StorePage {
  const tpl = getTemplate(s.templateId) ?? getTemplate(DEFAULT_TEMPLATE_ID)!;
  return {
    ...storeSummary(s, distanceKm),
    theme: { ...tpl.theme, ...((s.themeOverride as Partial<Theme> | null) ?? {}) },
    sections: (s.sections as Section[] | null) ?? tpl.sections,
    policy: policyOf(s), hours: s.hours, phone: s.phone, address: s.address,
    items: s.items.filter((i) => !i.archived).map(itemDto),
  };
}
