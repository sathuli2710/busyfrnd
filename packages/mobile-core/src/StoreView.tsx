import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { makeT, rupees, type Item, type Section, type StorePage } from '@busyfrnd/shared';
import { ProductThumb, StoreCover } from './art';
import { Badge, Enter, QtyStepper, Tap } from './kit';

export interface StoreViewProps { page: StorePage; qtyOf?: (id: string) => number; onSetQty?: (id: string, qty: number) => void; t?: (k: string) => string; hideHero?: boolean }

/** Native renderer for vendor storefront templates (mirror of the web StoreView). */
export function StoreView({ page, qtyOf, onSetQty, t = makeT('en'), hideHero }: StoreViewProps) {
  const th = page.theme;
  const [cat, setCat] = useState<string | null>(null);
  const items = useMemo(() => page.items.filter((i) => !cat || i.category === cat), [page.items, cat]);
  const categories = useMemo(() => [...new Set(page.items.map((i) => i.category).filter(Boolean) as string[])], [page.items]);
  const hasServices = page.sections.some((x) => x.type === 'services');
  const card = { backgroundColor: th.surface, borderRadius: th.radius + 10, padding: 12, borderWidth: 1, borderColor: th.text + '12' } as const;
  const price = (i: Item) => <Text style={{ color: th.primary, fontWeight: '900', fontSize: 15 }}>{rupees(i.pricePaise)}</Text>;
  const control = (i: Item): ReactNode => (!onSetQty ? null : i.inStock ? <QtyStepper qty={qtyOf?.(i.id) ?? 0} onChange={(n) => onSetQty(i.id, n)} addLabel={t('cart.add')} /> : <Badge tone="red" text="Sold out" />);
  let n = 0;

  const render = (s: Section, idx: number): ReactNode => {
    const p = (s.props ?? {}) as Record<string, any>;
    switch (s.type) {
      case 'hero':
        if (hideHero) return null;
        return (
          <StoreCover key={idx} category={page.category} height={p.compact ? 150 : 220} big>
            <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20, gap: 8 }}>
              <Text style={{ color: '#fff', fontSize: p.compact ? 24 : 32, fontWeight: '900', letterSpacing: -0.8 }}>{page.name}</Text>
              {page.description ? <Text style={{ color: 'rgba(255,255,255,0.92)', fontWeight: '600' }} numberOfLines={2}>{page.description}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {page.village ? <Badge text={page.village} icon="location" /> : null}
                {page.distanceKm != null ? <Badge text={`${page.distanceKm} ${t('store.km')}`} /> : null}
                {page.policy.offersPickup ? <Badge tone="green" icon="storefront" text={t('cart.pickup')} /> : null}
                {page.policy.offersDelivery ? <Badge tone="blue" icon="bicycle" text={t('cart.delivery')} /> : null}
              </View>
            </View>
          </StoreCover>
        );
      case 'banner':
        return hideHero ? null : <LinearGradient key={idx} colors={[p.sale ? th.accent : th.primary, th.primary + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 20 }}><Text style={{ color: '#fff', opacity: 0.8, fontWeight: '800', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>{p.sale ? 'Today’s deals' : 'Welcome to'}</Text><Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>{page.name}</Text></LinearGradient>;
      case 'categories':
        return categories.length ? (
          <ScrollView key={idx} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {['All', ...categories].map((c) => { const active = (c === 'All' && !cat) || cat === c; return <Pressable key={c} onPress={() => setCat(c === 'All' ? null : c)} style={{ paddingHorizontal: 16, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? th.primary : th.text + '0D' }}><Text style={{ fontWeight: '800', color: active ? '#fff' : th.text }}>{c}</Text></Pressable>; })}
          </ScrollView>
        ) : null;
      case 'productGrid': {
        const list = items.filter((i) => i.kind === 'PRODUCT' || !hasServices);
        return (
          <View key={idx} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {list.map((i) => (
              <Enter key={i.id} i={n++} style={{ width: '48.4%' }}>
                <View style={[card, { gap: 10, flex: 1 }]}>
                  <ProductThumb id={i.id} name={i.name} category={i.category} kind={i.kind} imageUrl={i.imageUrl} size={120} radius={th.radius + 4} style={{ width: '100%', height: 118 }} />
                  <Text numberOfLines={2} style={{ fontWeight: '800', color: th.text, minHeight: 36, fontSize: 14.5 }}>{i.name}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{price(i)}{control(i)}</View>
                </View>
              </Enter>))}
          </View>
        );
      }
      case 'productList':
        return (
          <View key={idx} style={{ gap: 10 }}>
            {items.map((i) => (
              <Enter key={i.id} i={n++}>
                <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                  <ProductThumb id={i.id} name={i.name} category={i.category} kind={i.kind} imageUrl={i.imageUrl} size={72} radius={th.radius + 2} />
                  <View style={{ flex: 1, gap: 2 }}><Text style={{ fontWeight: '800', color: th.text, fontSize: 15 }}>{i.name}</Text>{i.description ? <Text numberOfLines={2} style={{ color: th.text, opacity: 0.6, fontSize: 12 }}>{i.description}</Text> : null}{price(i)}</View>
                  {control(i)}
                </View>
              </Enter>))}
          </View>
        );
      case 'services': {
        const svc = items.filter((i) => i.kind === 'SERVICE');
        return svc.length ? (
          <View key={idx} style={{ gap: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: th.text }}>Services</Text>
            {svc.map((i) => <Enter key={i.id} i={n++}><View style={[card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}><ProductThumb id={i.id} name={i.name} kind="SERVICE" size={52} /><View style={{ flex: 1, gap: 2 }}><Text style={{ fontWeight: '800', color: th.text, fontSize: 15 }}>{i.name}</Text>{price(i)}</View>{control(i)}</View></Enter>)}
            {page.policy.visitingFee > 0 ? <Text style={{ color: th.text, opacity: 0.6, fontSize: 12, fontWeight: '600' }}>+ visiting charge {rupees(page.policy.visitingFee)} per booking</Text> : null}
          </View>) : null;
      }
      case 'about': return page.description ? <View key={idx} style={[card, { gap: 4 }]}><Text style={{ fontWeight: '900', color: th.text }}>About</Text><Text style={{ color: th.text, opacity: 0.75, lineHeight: 20 }}>{page.description}</Text></View> : null;
      case 'hours': return page.hours ? <View key={idx} style={card}><Text style={{ color: th.text, fontWeight: '700' }}>🕘  {page.hours}</Text></View> : null;
      case 'contact': return (page.phone || page.address) ? <View key={idx} style={[card, { gap: 6 }]}>{page.address ? <Text style={{ color: th.text, fontWeight: '600' }}>📍  {page.address}</Text> : null}{page.phone ? <Text style={{ color: th.text, fontWeight: '600' }}>📞  {page.phone}</Text> : null}</View> : null;
      default: return null;
    }
  };
  return <View style={{ backgroundColor: th.background, padding: 12, gap: 14, borderRadius: 32 }}>{page.sections.map(render)}</View>;
}
