import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { DEFAULT_RADIUS_KM, STORE_CATEGORIES, rupees, type Item, type StoreSummary } from '@busyfrnd/shared';
import { Badge, Btn, Card, Err, Field, Loading, Row, Screen, T, useApp, useLocation } from '@busyfrnd/mobile-core';

export default function Home() {
  const { api, user, t } = useApp();
  const { loc, detect } = useLocation();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [items, setItems] = useState<Array<Item & { storeName: string; distanceKm: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const radius = user?.radiusKm ?? DEFAULT_RADIUS_KM;

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      if (q.trim().length >= 2) { const r = await api.catalog.search({ ...loc, radius, q: q.trim() }); setStores(r.stores); setItems(r.items); }
      else { setItems([]); setStores(await api.catalog.stores({ ...loc, radius, category: cat || undefined })); }
    } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  }, [api, loc, radius, q, cat]);
  useEffect(() => { const id = setTimeout(load, 300); return () => clearTimeout(id); }, [load]);

  return (
    <Screen>
      <Field value={q} onChangeText={setQ} placeholder={t('store.search')} />
      <Row>
        <Btn kind="secondary" title={`📍 ${loc.label ?? 'Set location'}`} onPress={() => detect().catch((e) => setErr(e.message))} />
        <T muted small>{t('settings.radius')}: {radius} km</T>
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {['', ...STORE_CATEGORIES.filter((c) => c !== 'other')].map((c) => (
          <Pressable key={c || 'all'} onPress={() => setCat(c)}><Badge text={c || 'All'} tone={cat === c ? 'orange' : 'gray'} /></Pressable>))}
      </ScrollView>
      <Err msg={err} />
      {loading && <Loading />}
      {items.length > 0 && <T bold size={17}>Products & services</T>}
      {items.map((i) => (
        <Card key={i.id} onPress={() => router.push(`/store/${i.storeId}`)}>
          <T bold>{i.name}</T><T bold color="#F57C00">{rupees(i.pricePaise)}</T><T muted small>{i.storeName} · {i.distanceKm} {t('store.km')}</T>
        </Card>))}
      <T bold size={17}>{t('store.nearby')}</T>
      {!loading && !stores.length && <T muted>No stores within {radius} km yet.</T>}
      {stores.map((s) => (
        <Card key={s.id} onPress={() => router.push(`/store/${s.id}`)}>
          <Row style={{ justifyContent: 'space-between' }}><T bold size={17}>{s.name}</T><Badge text={s.category} /></Row>
          {s.description ? <T muted small>{s.description}</T> : null}
          <Row><T small>📍 {s.village ?? '—'}</T><T small>{s.distanceKm} {t('store.km')}</T>
            {s.offersPickup && <Badge text={t('cart.pickup')} tone="green" />}{s.offersDelivery && <Badge text={t('cart.delivery')} tone="blue" />}</Row>
        </Card>))}
    </Screen>
  );
}
