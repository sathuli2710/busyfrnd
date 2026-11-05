import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { rupees, type Cart } from '@busyfrnd/shared';
import { Btn, Card, Loading, Row, Screen, T, useApp } from '@busyfrnd/mobile-core';

export default function CartTab() {
  const { api, t } = useApp();
  const router = useRouter();
  const [carts, setCarts] = useState<Cart[] | null>(null);
  useFocusEffect(useCallback(() => { api.cart.list().then(setCarts).catch(() => setCarts([])); }, [api]));
  if (!carts) return <Screen><Loading /></Screen>;
  if (!carts.length) return <Screen><T muted>{t('cart.empty')}</T></Screen>;
  return (
    <Screen>
      <T muted small>One cart per store — check out each store separately.</T>
      {carts.map((c) => (
        <Card key={c.storeId}>
          <Row style={{ justifyContent: 'space-between' }}><T bold size={17}>{c.store.name}</T><T bold>{rupees(c.subtotal)}</T></Row>
          {c.lines.map((l) => <Row key={l.itemId} style={{ justifyContent: 'space-between' }}><T small>{l.qty} × {l.name}</T><T small>{rupees(l.qty * l.pricePaise)}</T></Row>)}
          <Row><Btn title={t('cart.checkout')} onPress={() => router.push(`/checkout/${c.storeId}`)} />
            <Btn kind="secondary" title="Clear" onPress={async () => { await api.cart.clear(c.storeId); setCarts(carts.filter((x) => x.storeId !== c.storeId)); }} /></Row>
        </Card>))}
    </Screen>
  );
}
