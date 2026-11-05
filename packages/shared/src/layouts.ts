import type { PlanDef } from './plans';

export type SectionType =
  | 'hero' | 'banner' | 'categories' | 'productGrid' | 'productList'
  | 'services' | 'about' | 'hours' | 'contact';

export interface Section { type: SectionType; props?: Record<string, unknown> }
export interface Theme { primary: string; background: string; surface: string; text: string; accent: string; radius: number }

export interface LayoutTemplate {
  id: string;
  name: string;
  tier: PlanDef['layoutTier'];
  archetype: string;
  theme: Theme;
  sections: Section[];
}

const ARCHETYPES: Record<string, { name: string; sections: Section[] }> = {
  classic: { name: 'Classic', sections: [{ type: 'hero' }, { type: 'categories' }, { type: 'productGrid' }, { type: 'about' }, { type: 'contact' }] },
  catalog: { name: 'Catalog', sections: [{ type: 'hero', props: { compact: true } }, { type: 'productGrid', props: { columns: 3 } }, { type: 'hours' }, { type: 'contact' }] },
  menu: { name: 'Menu List', sections: [{ type: 'banner' }, { type: 'categories' }, { type: 'productList' }, { type: 'hours' }] },
  service: { name: 'Service Desk', sections: [{ type: 'hero' }, { type: 'services' }, { type: 'about' }, { type: 'hours' }, { type: 'contact' }] },
  showcase: { name: 'Showcase', sections: [{ type: 'banner' }, { type: 'productGrid', props: { columns: 2, featured: true } }, { type: 'categories' }, { type: 'productList' }, { type: 'about' }] },
  minimal: { name: 'Minimal', sections: [{ type: 'productList' }, { type: 'contact' }] },
  hybrid: { name: 'Shop + Services', sections: [{ type: 'hero' }, { type: 'services' }, { type: 'productGrid' }, { type: 'hours' }, { type: 'contact' }] },
  deals: { name: 'Deals', sections: [{ type: 'banner', props: { sale: true } }, { type: 'productGrid', props: { columns: 2 } }, { type: 'productList' }, { type: 'contact' }] },
};

const PALETTES: Array<[string, Theme]> = [
  ['Saffron', { primary: '#F57C00', background: '#FFFBF5', surface: '#FFFFFF', text: '#1F1F1F', accent: '#2E7D32', radius: 12 }],
  ['Ocean', { primary: '#0277BD', background: '#F4FAFE', surface: '#FFFFFF', text: '#10212B', accent: '#FF6F00', radius: 10 }],
  ['Forest', { primary: '#2E7D32', background: '#F6FBF6', surface: '#FFFFFF', text: '#14241A', accent: '#F9A825', radius: 14 }],
  ['Berry', { primary: '#AD1457', background: '#FFF7FA', surface: '#FFFFFF', text: '#2A1520', accent: '#00897B', radius: 16 }],
  ['Slate', { primary: '#37474F', background: '#F5F7F8', surface: '#FFFFFF', text: '#1B2327', accent: '#00ACC1', radius: 6 }],
  ['Royal', { primary: '#4527A0', background: '#F8F6FD', surface: '#FFFFFF', text: '#1E1535', accent: '#FFB300', radius: 12 }],
  ['Midnight', { primary: '#FFB300', background: '#121212', surface: '#1E1E1E', text: '#F2F2F2', accent: '#26C6DA', radius: 12 }],
  ['Rose', { primary: '#D81B60', background: '#FFF5F8', surface: '#FFFFFF', text: '#2B1119', accent: '#3949AB', radius: 20 }],
];

function build(): LayoutTemplate[] {
  const out: LayoutTemplate[] = [];
  let i = 0;
  // Interleave so each tier gets a variety: first 3 BASIC, next 20 PLUS (23 total), rest PRO.
  for (const [pName, theme] of PALETTES) {
    for (const [aKey, a] of Object.entries(ARCHETYPES)) {
      const tier: LayoutTemplate['tier'] = i < 3 ? 'BASIC' : i < 23 ? 'PLUS' : 'PRO';
      out.push({ id: `${aKey}-${pName.toLowerCase()}`, name: `${a.name} · ${pName}`, tier, archetype: aKey, theme, sections: a.sections });
      i++;
    }
  }
  return out;
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = build();
export const getTemplate = (id: string) => LAYOUT_TEMPLATES.find((t) => t.id === id);
export const DEFAULT_TEMPLATE_ID = LAYOUT_TEMPLATES[0].id;

/** A few diverse templates to show vendors on the fly during onboarding. */
export function suggestTemplates(category: string, n = 4): LayoutTemplate[] {
  const prefs: Record<string, string[]> = {
    restaurant: ['menu', 'classic'], bakery: ['menu', 'showcase'], salon: ['service', 'hybrid'],
    repair: ['service', 'hybrid'], mobile: ['catalog', 'showcase', 'deals'], electronics: ['catalog', 'deals'],
    grocery: ['classic', 'deals', 'menu'], clothing: ['showcase', 'catalog'], pharmacy: ['classic', 'minimal'],
  };
  const want = prefs[category] ?? ['classic', 'catalog', 'minimal'];
  const picks: LayoutTemplate[] = [];
  for (const a of want) {
    const t = LAYOUT_TEMPLATES.find((x) => x.archetype === a && x.tier === 'BASIC') ?? LAYOUT_TEMPLATES.find((x) => x.archetype === a);
    if (t && !picks.includes(t)) picks.push(t);
  }
  for (const t of LAYOUT_TEMPLATES) { if (picks.length >= n) break; if (!picks.includes(t)) picks.push(t); }
  return picks.slice(0, n);
}
