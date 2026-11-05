import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CATEGORY_META, DEFAULT_RADIUS_KM, categoryMeta, fill, greeting, rupees, type StoreSummary } from '@busyfrnd/shared';
import type { ShopAnswer } from '@busyfrnd/api-client';
import { AiBadge, AiBubble, AiPromptBar, Badge, CategoryTile, EmptyState, Enter, Icon, ProductThumb, Row, Screen, Skeleton, StoreCover, T, Tap, TypingDots, colors, radius, shadow, useApp, useLocation, useToast } from '@busyfrnd/mobile-core';
import { LocationSheet } from '../../components/LocationSheet';

const SUGGESTIONS = ['birthday cake under ₹500', 'phone charger near me', 'haircut and beard trim', 'rice and dal for the week'];

export default function Home() {
  const { api, user, t } = useApp();
  const { loc } = useLocation();
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [stores, setStores] = useState<StoreSummary[] | null>(null);
  const [ai, setAi] = useState<{ q: string; res?: ShopAnswer; busy: boolean } | null>(null);
  const [locOpen, setLocOpen] = useState(false);
  const radiusKm = user?.radiusKm ?? DEFAULT_RADIUS_KM;

  const load = useCallback(async () => { try { setStores(await api.catalog.stores({ ...loc, radius: radiusKm, category: cat || undefined })); } catch (e) { toast.show((e as Error).message, 'error'); setStores([]); } }, [api, loc, radiusKm, cat, toast]);
  useEffect(() => { setStores(null); load(); }, [load]);

  const ask = async (text: string) => {
    setAi({ q: text, busy: true });
    try { const res = await api.ai.shop({ text, ...loc, radius: radiusKm, language: user?.language ?? 'en' }); setAi({ q: text, res, busy: false }); } catch (e) { toast.show((e as Error).message, 'error'); setAi(null); }
  };

  return (
    <Screen onRefresh={load} bottomInset={40}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <Tap onPress={() => setLocOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(11,11,15,0.06)', paddingHorizontal: 14, height: 42, borderRadius: 21, flexShrink: 1 }}>
          <Icon name="location" size={18} color={colors.brand} /><Text numberOfLines={1} style={{ fontWeight: '800', flexShrink: 1 }}>{loc.label ?? 'Set location'}</Text><Text style={{ color: colors.muted, fontWeight: '700' }}>· {radiusKm} km</Text><Icon name="chevron-down" size={14} color={colors.muted} />
        </Tap>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>B</Text></View>
      </Row>

      <Animated.View entering={FadeInDown.springify()} style={{ gap: 6, marginTop: 4 }}>
        <T variant="label" muted>{t(`hello.${greeting()}`)}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</T>
        <T variant="display">{t('home.categories')}</T>
      </Animated.View>

      <AiPromptBar value={q} onChange={setQ} onSubmit={ask} busy={ai?.busy} placeholder={t('ai.askPlaceholder')} suggestions={SUGGESTIONS} onPick={(s) => { setQ(s); ask(s); }} />

      {ai && (
        <Animated.View entering={FadeInDown.springify()} style={{ gap: 10, backgroundColor: colors.aiSoft, borderRadius: radius.xl, padding: 14 }}>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><AiBadge text={t('ai.title')} /><Tap onPress={() => setAi(null)} style={{ padding: 6 }}><Icon name="close" size={18} color={colors.muted} /></Tap></Row>
          <AiBubble who="me">{ai.q}</AiBubble>
          {ai.busy ? <TypingDots /> : ai.res && <>
            <AiBubble who="ai">{ai.res.reply}</AiBubble>
            {ai.res.items.map((i, n) => (
              <Enter key={i.id} i={n}><Tap onPress={() => router.push(`/store/${i.storeId}`)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 22, padding: 10 }, shadow.soft]}>
                <ProductThumb id={i.id} name={i.name} kind={i.kind} size={52} radius={16} /><View style={{ flex: 1 }}><T variant="label" numberOfLines={1}>{i.name}</T><T small muted numberOfLines={1}>{i.storeName} · {i.distanceKm} {t('store.km')}</T></View><T bold>{rupees(i.pricePaise)}</T>
              </Tap></Enter>))}
            {!ai.res.items.length && <T muted small>Try different words, or browse the stores below.</T>}
          </>}
        </Animated.View>)}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4, paddingRight: 8 }} style={{ marginHorizontal: -18, paddingHorizontal: 18 }}>
        <CategoryTile emoji="✨" label="All" gradient={['#0B0B0F', '#3A3A44']} active={!cat} onPress={() => setCat('')} />
        {CATEGORY_META.filter((c) => c.key !== 'other').map((c) => <CategoryTile key={c.key} emoji={c.emoji} label={c.label} gradient={c.gradient} active={cat === c.key} onPress={() => setCat(cat === c.key ? '' : c.key)} />)}
      </ScrollView>

      <Row style={{ justifyContent: 'space-between' }}><T variant="title">{t('home.nearYou')}</T>{stores ? <T small muted>{stores.length} stores</T> : null}</Row>
      {!stores ? [0, 1].map((i) => <View key={i} style={{ gap: 10 }}><Skeleton style={{ height: 150, borderRadius: 26 }} /><Skeleton style={{ width: '60%' }} /></View>)
        : !stores.length ? <EmptyState emoji="🧭" title={t('home.noStores')} hint={`${fill('No stores within {n} km.', { n: radiusKm })} ${t('home.widen')}`} />
        : stores.map((s, i) => (
          <Enter key={s.id} i={i}>
            <Tap onPress={() => router.push(`/store/${s.id}`)} scale={0.975} style={[{ backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', borderWidth: 0.5, borderColor: colors.line }, shadow.soft]}>
              <StoreCover category={s.category} height={140} radius={0}>{s.distanceKm != null ? <View style={{ position: 'absolute', left: 12, top: 12, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 }}><Text style={{ fontWeight: '900', fontSize: 12 }}>{s.distanceKm} {t('store.km')}</Text></View> : null}</StoreCover>
              <View style={{ padding: 16, gap: 6 }}>
                <T variant="headline">{s.name}</T>
                <T muted small>{categoryMeta(s.category).emoji} {categoryMeta(s.category).label}{s.village ? `  ·  📍 ${s.village}` : ''}</T>
                <Row gap={6}>{s.offersPickup && <Badge tone="green" icon="storefront" text="Pickup" />}{s.offersDelivery && <Badge tone="blue" icon="bicycle" text="Delivery" />}</Row>
              </View>
            </Tap>
          </Enter>))}
      <LocationSheet visible={locOpen} onClose={() => setLocOpen(false)} />
    </Screen>
  );
}
