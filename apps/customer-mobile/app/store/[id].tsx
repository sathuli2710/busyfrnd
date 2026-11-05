import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StorePage } from '@busyfrnd/shared';
import { EmptyState, IconBtn, Screen, Skeleton, StoreView, useApp, useLocation } from '@busyfrnd/mobile-core';
import { CartBar } from '../../components/CartBar';
import { useCart } from '../../lib/cart';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, t } = useApp();
  const { loc } = useLocation();
  const { qtyOf, setQty } = useCart();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<StorePage | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.catalog.store(id, loc).then(setPage).catch((e) => setErr(e.message)); }, [api, id, loc]);
  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F8' }}>
      <Screen edges={[]} pad={false} bottomInset={40}>
        <View style={{ paddingTop: insets.top + 56, paddingHorizontal: 10, gap: 12 }}>
          {err ? <EmptyState emoji="🏪" title="Store unavailable" hint={err} /> : !page ? <><Skeleton style={{ height: 220, borderRadius: 28 }} /><Skeleton style={{ height: 90, borderRadius: 24 }} /><Skeleton style={{ height: 90, borderRadius: 24 }} /></>
            : <StoreView page={page} t={t} qtyOf={(i) => qtyOf(id, i)} onSetQty={(i, n) => setQty(id, i, n)} />}
        </View>
      </Screen>
      <View style={{ position: 'absolute', top: insets.top + 6, left: 14 }}><IconBtn name="arrow-back" onPress={() => router.back()} bg="rgba(255,255,255,0.95)" label="Back" /></View>
      <CartBar storeId={id} />
    </View>
  );
}
