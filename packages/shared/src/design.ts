/** Brand + art-direction helpers shared by web and mobile. */
export const BRAND = {
  ink: '#0B0B0F',
  inkSoft: '#26262D',
  orange: '#FF5A1F',
  orangeSoft: '#FFF0E8',
  ai: '#6C5CE7',
  aiPink: '#C55CFF',
  green: '#05944F',
  red: '#E11D48',
  amber: '#F59E0B',
  bg: '#F7F7F8',
  surface: '#FFFFFF',
  line: '#ECECEF',
  muted: '#6B6B76',
} as const;

export const AI_GRADIENT: [string, string] = ['#6C5CE7', '#C55CFF'];

export interface CategoryMeta { key: string; label: string; emoji: string; gradient: [string, string] }

export const CATEGORY_META: CategoryMeta[] = [
  { key: 'grocery', label: 'Grocery', emoji: '🛒', gradient: ['#34D399', '#059669'] },
  { key: 'restaurant', label: 'Food', emoji: '🍛', gradient: ['#FB923C', '#EA580C'] },
  { key: 'bakery', label: 'Bakery', emoji: '🎂', gradient: ['#F9A8D4', '#EC4899'] },
  { key: 'mobile', label: 'Mobiles', emoji: '📱', gradient: ['#60A5FA', '#2563EB'] },
  { key: 'electronics', label: 'Electronics', emoji: '🔌', gradient: ['#A78BFA', '#7C3AED'] },
  { key: 'clothing', label: 'Fashion', emoji: '👕', gradient: ['#F472B6', '#DB2777'] },
  { key: 'pharmacy', label: 'Pharmacy', emoji: '💊', gradient: ['#2DD4BF', '#0D9488'] },
  { key: 'salon', label: 'Salon', emoji: '💇', gradient: ['#FBBF24', '#D97706'] },
  { key: 'repair', label: 'Repairs', emoji: '🔧', gradient: ['#94A3B8', '#475569'] },
  { key: 'hardware', label: 'Hardware', emoji: '🔨', gradient: ['#FCA5A5', '#DC2626'] },
  { key: 'stationery', label: 'Stationery', emoji: '✏️', gradient: ['#FDE047', '#CA8A04'] },
  { key: 'furniture', label: 'Furniture', emoji: '🛋️', gradient: ['#D6B38A', '#92400E'] },
  { key: 'other', label: 'Local', emoji: '🏪', gradient: ['#818CF8', '#4F46E5'] },
];
export const categoryMeta = (key?: string | null): CategoryMeta => CATEGORY_META.find((c) => c.key === key) ?? CATEGORY_META[CATEGORY_META.length - 1];

const KEYWORD_EMOJI: Array<[RegExp, string]> = [
  [/cake|pastry|brownie/i, '🎂'], [/bread|bun|loaf/i, '🍞'], [/biscuit|cookie/i, '🍪'], [/rice|biryani|pulao/i, '🍚'], [/dal|dhal|lentil|toor/i, '🫘'],
  [/oil|ghee/i, '🛢️'], [/tea|chai/i, '🍵'], [/coffee/i, '☕'], [/milk|curd|paneer|butter/i, '🥛'], [/egg/i, '🥚'], [/fruit|apple|banana|mango/i, '🍎'],
  [/vegetable|tomato|onion|potato/i, '🥦'], [/chicken|mutton|meat|fish/i, '🍗'], [/dosa|idli|vada|sambar/i, '🥞'], [/pizza|burger|sandwich/i, '🍔'],
  [/phone|mobile|iphone|android/i, '📱'], [/cover|case/i, '📲'], [/glass|screen guard|tempered/i, '🛡️'], [/charger|cable|adapter|adaptor/i, '🔌'], [/earphone|headphone|earbud/i, '🎧'],
  [/battery|power bank/i, '🔋'], [/screen|display|replace|repair/i, '🔧'], [/haircut|hair|trim/i, '💇'], [/beard|shave/i, '🧔'], [/facial|massage|spa/i, '💆'],
  [/shirt|t-?shirt|saree|dress|kurta|jeans/i, '👕'], [/shoe|sandal|chappal/i, '👟'], [/medicine|tablet|syrup|paracetamol/i, '💊'], [/book|notebook|copy/i, '📚'],
  [/pen|pencil/i, '✏️'], [/soap|shampoo|detergent|powder/i, '🧴'], [/paint|brush/i, '🎨'], [/pipe|tap|bulb|wire/i, '💡'],
];
export function emojiFor(name: string, category?: string | null, kind?: string): string {
  for (const [re, e] of KEYWORD_EMOJI) if (re.test(name)) return e;
  if (kind === 'SERVICE') return '🛠️';
  return categoryMeta(category).emoji;
}

const PALETTE: Array<[string, string]> = [
  ['#FFE4D6', '#FFB38A'], ['#E0F2FE', '#7DD3FC'], ['#DCFCE7', '#86EFAC'], ['#FCE7F3', '#F9A8D4'], ['#EDE9FE', '#C4B5FD'], ['#FEF3C7', '#FCD34D'],
];
/** Stable soft gradient from any string (item/store id) for thumbnails. */
export function softGradient(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export const greeting = (d = new Date()): 'morning' | 'afternoon' | 'evening' => (d.getHours() < 12 ? 'morning' : d.getHours() < 17 ? 'afternoon' : 'evening');
