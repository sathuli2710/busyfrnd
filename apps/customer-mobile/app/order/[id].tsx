import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { rupees, type OrderDto } from '@busyfrnd/shared';
import { Badge, Btn, Card, Loading, Row, STATUS_TONE, Screen, T, fmtDate, openCheckout, shortId, useApp } from '@busyfrnd/mobile-core';

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, t } = useApp();
  const [o, setO] = useState<OrderDto | null>(null);
  const load = () => api.orders.get(id).then(setO).catch(() => undefined);
  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); /* eslint-disable-next-line */ }, [id]);
  if (!o) return <Screen><Loading /></Screen>;
  return (
    <Screen>
      <Stack.Screen options={{ title: `${o.storeName} ${shortId(o.id)}` }} />
      <Card>
        <Row style={{ justifyContent: 'space-between' }}><T bold size={17}>{o.storeName}</T><Badge text={o.status.replace(/_/g, ' ')} tone={STATUS_TONE[o.status]} /></Row>
        <T muted small>{fmtDate(o.createdAt)} · {o.fulfillment === 'PICKUP' ? t('cart.pickup') : t('cart.delivery')}</T>
        {o.status === 'READY' && o.fulfillment === 'PICKUP' && <T bold color="#2E7D32">✅ {t('order.ready')}</T>}
        {o.status === 'PENDING_PAYMENT' && <Btn title={t('cart.payNow')} onPress={async () => { const r = await api.orders.pay(o.id, 'busyfrnd-customer://pay-result'); await openCheckout(r.checkoutUrl, 'busyfrnd-customer://pay-result'); load(); }} />}
      </Card>
      <Card>
        {o.lines.map((l) => <Row key={l.itemId} style={{ justifyContent: 'space-between' }}><T>{l.qty} × {l.name}</T><T>{rupees(l.qty * l.pricePaise)}</T></Row>)}
        {o.fees.filter((x) => x.key !== 'subtotal').map((x) => <Row key={x.key} style={{ justifyContent: 'space-between' }}><T muted small>{t('fee.' + x.key)}</T><T muted small>{rupees(x.amount)}</T></Row>)}
        <Row style={{ justifyContent: 'space-between' }}><T bold>{t('cart.total')}</T><T bold>{rupees(o.total)}</T></Row>
        <Row style={{ justifyContent: 'space-between' }}><T small>Paid</T><T small>{rupees(o.paid)}</T></Row>
        {o.due > 0 && <Row style={{ justifyContent: 'space-between' }}><T small>{t('cart.payLater')}</T><T bold small>{rupees(o.due)}</T></Row>}
        {o.deliveryAddress ? <T small>📍 {o.deliveryAddress}</T> : null}
      </Card>
    </Screen>
  );
}
