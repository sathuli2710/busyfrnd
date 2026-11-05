import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { rupees } from '@busyfrnd/shared';
import { Btn, Card, EmptyState, Enter, IconBtn, ProductThumb, QtyStepper, Row, Screen, Skeleton, T, haptic, useApp } from '@busyfrnd/mobile-core';
import { useCart } from '../../lib/cart';

export default function CartTab() {
  const { t } = useApp();
  const router = useRouter();
  const { carts, loaded, setQty, clear, refresh } = useCart();
  return (
    <Screen title={t('nav.cart')} subtitle="One cart per store" onRefresh={refresh} bottomInset={40}>
      {!loaded ? <Skeleton style={{ height: 180, borderRadius: 24 }} /> : !carts.length ? (
        <EmptyState emoji="🛒" title={t('cart.empty')} hint="Browse nearby stores and add something you like." action={<Btn title="Explore stores" onPress={() => router.navigate('/')} />} />
      ) : carts.map((c, i) => (
        <Enter key={c.storeId} i={i}>
          <Card>
            <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="headline" numberOfLines={1} style={{ flex: 1 }}>{c.store.name}</T><IconBtn name="trash-outline" size={36} onPress={() => { haptic.light(); clear(c.storeId); }} label="Clear cart" /></Row>
            <View style={{ gap: 12, marginVertical: 6 }}>
              {c.lines.map((l) => (
                <Row key={l.itemId} style={{ flexWrap: 'nowrap' }}>
                  <ProductThumb id={l.itemId} name={l.name} kind={l.kind} size={48} radius={14} />
                  <View style={{ flex: 1 }}><T variant="label" numberOfLines={1}>{l.name}</T><T small muted>{rupees(l.pricePaise)}</T></View>
                  <QtyStepper qty={l.qty} onChange={(n) => setQty(c.storeId, l.itemId, n)} />
                </Row>))}
            </View>
            <Btn full size="lg" title={`${t('cart.checkout')} · ${rupees(c.subtotal)}`} onPress={() => router.push(`/checkout/${c.storeId}`)} />
          </Card>
        </Enter>))}
    </Screen>
  );
}
