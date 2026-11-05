import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { rupees, type OrderDto } from '@busyfrnd/shared';
import { Badge, Btn, Card, Enter, OrderTimeline, ProductThumb, Row, STATUS_LABEL, STATUS_TONE, Screen, Skeleton, T, fmtDate, openCheckout, shortId, useApp } from '@busyfrnd/mobile-core';

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, t } = useApp();
  const [o, setO] = useState<OrderDto | null>(null);
  const load = () => api.orders.get(id).then(setO).catch(() => undefined);
  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); /* eslint-disable-next-line */ }, [id]);
  if (!o) return <Screen><Skeleton style={{ height: 160, borderRadius: 24 }} /></Screen>;
  return (
    <Screen onRefresh={load} bottomInset={30}>
      <Stack.Screen options={{ title: shortId(o.id) }} />
      <Enter><Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><View style={{ flex: 1 }}><T variant="caption" muted>{fmtDate(o.createdAt)}</T><T variant="display">{o.storeName}</T></View><Badge tone={STATUS_TONE[o.status]} text={STATUS_LABEL[o.status]} /></Row></Enter>
      {o.status === 'READY' && o.fulfillment === 'PICKUP' && <Enter i={1}><View style={{ backgroundColor: '#E6F6EC', padding: 18, borderRadius: 24, gap: 2 }}><T variant="headline" color="#0B6B3A">✅ {t('order.ready')}</T><T color="#0B6B3A">Show order {shortId(o.id)} at the counter.</T></View></Enter>}
      {o.status === 'PENDING_PAYMENT' && <Card><T variant="label">Payment not completed</T><Btn title={t('cart.payNow')} kind="brand" onPress={async () => { const ret = 'busyfrnd-customer://pay-result'; const r = await api.orders.pay(o.id, ret); await openCheckout(r.checkoutUrl, ret); load(); }} /></Card>}
      {o.status !== 'PENDING_PAYMENT' && <Enter i={2}><Card><T variant="headline">{t('order.track')}</T><OrderTimeline status={o.status} fulfillment={o.fulfillment} /></Card></Enter>}
      <Enter i={3}>
        <Card>
          <T variant="headline">Items</T>
          {o.lines.map((l) => <Row key={l.itemId} style={{ flexWrap: 'nowrap' }}><ProductThumb id={l.itemId} name={l.name} kind={l.kind} size={44} radius={12} /><T variant="label" numberOfLines={1} style={{ flex: 1 }}>{l.qty} × {l.name}</T><T variant="label">{rupees(l.qty * l.pricePaise)}</T></Row>)}
          {o.fees.filter((x) => x.key !== 'subtotal').map((x) => <Row key={x.key} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T small muted>{t('fee.' + x.key)}</T><T small muted>{rupees(x.amount)}</T></Row>)}
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', paddingTop: 6 }}><T variant="headline">{t('cart.total')}</T><T variant="headline">{rupees(o.total)}</T></Row>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T small muted>Paid</T><T small bold>{rupees(o.paid)}</T></Row>
          {o.due > 0 && <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', backgroundColor: '#FFF0E8', padding: 12, borderRadius: 14 }}><T bold color="#C2410C">{t('cart.payLater')}</T><T bold color="#C2410C">{rupees(o.due)}</T></Row>}
        </Card>
      </Enter>
      {o.deliveryAddress ? <Card><T variant="label">📍 Delivering to</T><T muted>{o.deliveryAddress}</T></Card> : null}
    </Screen>
  );
}
