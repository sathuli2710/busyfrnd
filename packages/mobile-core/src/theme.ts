import { BRAND } from '@busyfrnd/shared';

export const colors = {
  bg: BRAND.bg, surface: BRAND.surface, text: BRAND.ink, textSoft: BRAND.inkSoft, muted: BRAND.muted, line: BRAND.line,
  primary: BRAND.ink, brand: BRAND.orange, brandSoft: BRAND.orangeSoft, ai: BRAND.ai, aiPink: BRAND.aiPink, aiSoft: '#F1EEFF',
  ok: BRAND.green, danger: BRAND.red, warn: BRAND.amber, chip: '#EEEEF1',
  // legacy aliases used by older screens
  accent: BRAND.green, border: BRAND.line,
};
export const radius = { sm: 12, md: 18, lg: 24, xl: 32, full: 999 };
export const shadow = {
  soft: { shadowColor: '#0B0B0F', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  lift: { shadowColor: '#0B0B0F', shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  ai: { shadowColor: '#6C5CE7', shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
} as const;
