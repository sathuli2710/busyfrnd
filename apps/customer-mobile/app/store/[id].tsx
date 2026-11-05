import { useCallback, useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { rupees, type Cart, type StorePage } from '@busyfrnd/shared';
import { Btn, Err, Loading, Row, Screen, StoreView, T, useApp, useLocation } from '@busyfrnd/mobile-core';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, t } = useApp();
  const { loc } = useLocation();
  const router = useRouter();
  const [page, setPage] = useState<StorePage | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.catalog.store(id, loc).then(setPage).catch((e) => setErr(e.message)); api.cart.list().then((cs) => setCart(cs.find((c) => c.storeId === id) ?? null)).catch(() => undefined); }, [api, id, loc]);
  const setQty = useCallback(async (itemId: string, qty: number) => { try { setCart(await api.cart.setItem(id, itemId, qty)); } catch (e) { setErr((e as Error).message); } }, [api, id]);
  const count = cart?.lines.reduce((s, l) => s + l.qty, 0) ?? 0;
  return (
    <Screen footer={count > 0 ? (
      <Row style={{ padding: 12, justifyContent: 'space-between', backgroundColor: '#fff' }}><T bold>{count} item{count > 1 ? 's' : ''} · {rupees(cart!.subtotal)}</T><Btn title={t('cart.checkout')} onPress={() => router.push(`/checkout/${id}`)} /></Row>) : undefined}>
      <Stack.Screen options={{ title: page?.name ?? 'Store' }} />
      <Err msg={err} />
      {!page ? <Loading /> : <StoreView page={page} t={t} qtyOf={(i) => cart?.lines.find((l) => l.itemId === i)?.qty ?? 0} onSetQty={setQty} />}
    </Screen>
  );
}
