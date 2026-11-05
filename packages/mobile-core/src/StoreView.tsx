import { useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { rupees, type Item, type Section, type StorePage } from '@busyfrnd/shared';
import { Badge, Stepper } from './ui';

export interface StoreViewProps { page: StorePage; qtyOf?: (id: string) => number; onSetQty?: (id: string, qty: number) => void; t?: (k: string) => string }

/** Native renderer for vendor storefront templates (mirror of the web StoreView). */
export function StoreView({ page, qtyOf, onSetQty, t = (k) => k }: StoreViewProps) {
  const th = page.theme;
  const [cat, setCat] = useState<string | null>(null);
  const items = useMemo(() => page.items.filter((i) => !cat || i.category === cat), [page.items, cat]);
  const categories = useMemo(() => [...new Set(page.items.map((i) => i.category).filter(Boolean) as string[])], [page.items]);
  const card = { backgroundColor: th.surface, borderRadius: th.radius, padding: 12, borderWidth: 1, borderColor: th.text + '14' } as const;

  const thumb = (i: Item, size = 64) => i.imageUrl
    ? <Image source={{ uri: i.imageUrl }} style={{ width: size, height: size, borderRadius: th.radius }} />
    : <View style={{ width: size, height: size, borderRadius: th.radius, backgroundColor: th.primary + '22', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: th.primary, fontWeight: '800', fontSize: size / 2.4 }}>{i.name.slice(0, 1).toUpperCase()}</Text></View>;
  const control = (i: Item): ReactNode => !onSetQty ? null : i.inStock ? <Stepper qty={qtyOf?.(i.id) ?? 0} onChange={(n) => onSetQty(i.id, n)} addLabel={t('cart.add')} /> : <Badge text="Out of stock" tone="red" />;
  const price = (i: Item) => <Text style={{ color: th.primary, fontWeight: '700' }}>{rupees(i.pricePaise)}</Text>;
  const chip = (label: string, active: boolean, on: () => void) => (
    <Pressable key={label} onPress={on} style={{ backgroundColor: active ? th.primary : '#eee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}><Text style={{ color: active ? '#fff' : '#333', fontWeight: '600', fontSize: 12 }}>{label}</Text></Pressable>
  );

  const render = (s: Section, idx: number): ReactNode => {
    const p = (s.props ?? {}) as Record<string, any>;
    switch (s.type) {
      case 'hero':
        return (
          <View key={idx} style={{ backgroundColor: th.primary, borderRadius: th.radius, padding: p.compact ? 16 : 24, gap: 6 }}>
            <Text style={{ color: '#fff', fontSize: p.compact ? 20 : 26, fontWeight: '800' }}>{page.name}</Text>
            {page.description ? <Text style={{ color: '#fff', opacity: 0.92 }}>{page.description}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {page.village ? <Badge text={`📍 ${page.village}`} /> : null}
              {page.policy.offersPickup ? <Badge text={t('cart.pickup')} tone="green" /> : null}
              {page.policy.offersDelivery ? <Badge text={t('cart.delivery')} tone="blue" /> : null}
            </View>
          </View>
        );
      case 'banner':
        return <View key={idx} style={{ backgroundColor: p.sale ? th.accent : th.primary, borderRadius: th.radius, padding: 16 }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{p.sale ? '🔥 ' : ''}{page.name}</Text></View>;
      case 'categories':
        return categories.length ? <View key={idx} style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>{chip('All', !cat, () => setCat(null))}{categories.map((c) => chip(c, cat === c, () => setCat(c)))}</View> : null;
      case 'productGrid': {
        const list = items.filter((i) => i.kind === 'PRODUCT' || !page.sections.some((x) => x.type === 'services'));
        return (
          <View key={idx} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {list.map((i) => (
              <View key={i.id} style={[card, { width: '48%', gap: 6 }]}>
                {thumb(i, 80)}
                <Text style={{ fontWeight: '700', color: th.text }} numberOfLines={2}>{i.name}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>{price(i)}{control(i)}</View>
              </View>))}
          </View>
        );
      }
      case 'productList':
        return <View key={idx} style={{ gap: 8 }}>{items.map((i) => (
          <View key={i.id} style={[card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            {thumb(i)}<View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: th.text }}>{i.name}</Text>{i.description ? <Text style={{ color: '#666', fontSize: 12 }}>{i.description}</Text> : null}{price(i)}</View>{control(i)}
          </View>))}</View>;
      case 'services': {
        const svc = items.filter((i) => i.kind === 'SERVICE');
        return svc.length ? (
          <View key={idx} style={{ gap: 8 }}>
            <Text style={{ fontWeight: '800', fontSize: 17, color: th.text }}>Services</Text>
            {svc.map((i) => <View key={i.id} style={[card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}><View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: th.text }}>{i.name}</Text></View>{price(i)}{control(i)}</View>)}
            {page.policy.visitingFee > 0 ? <Text style={{ color: '#666', fontSize: 12 }}>+ visiting charge {rupees(page.policy.visitingFee)}</Text> : null}
          </View>) : null;
      }
      case 'about': return page.description ? <View key={idx} style={card}><Text style={{ fontWeight: '700', color: th.text }}>About</Text><Text style={{ color: th.text }}>{page.description}</Text></View> : null;
      case 'hours': return page.hours ? <View key={idx} style={card}><Text style={{ color: th.text }}>🕘 {page.hours}</Text></View> : null;
      case 'contact': return (page.phone || page.address) ? <View key={idx} style={card}><Text style={{ fontWeight: '700', color: th.text }}>Contact</Text>{page.address ? <Text style={{ color: th.text }}>📍 {page.address}</Text> : null}{page.phone ? <Text style={{ color: th.text }}>📞 {page.phone}</Text> : null}</View> : null;
      default: return null;
    }
  };
  return <View style={{ backgroundColor: th.background, padding: 12, gap: 12, borderRadius: th.radius }}>{page.sections.map(render)}</View>;
}
