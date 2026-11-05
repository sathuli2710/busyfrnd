import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ORDER_TRANSITIONS, rupees, type OrderStatus } from '@busyfrnd/shared';
import type { VendorOrder } from '@busyfrnd/api-client';
import { Badge, Btn, Card, Err, Loading, Row, STATUS_TONE, Screen, T, colors, fmtDate, shortId, useApp } from '@busyfrnd/mobile-core';

export default function OrdersTab() {
  const { api } = useApp();
  const [orders, setOrders] = useState<VendorOrder[] | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.vendor.orders().then(setOrders).catch(() => setOrders([])), [api]);
  useFocusEffect(useCallback(() => { load(); const i = setInterval(load, 10_000); return () => clearInterval(i); }, [load]));
  if (!orders) return <Screen><Loading /></Screen>;
  const move = async (id: string, s: OrderStatus) => { setErr(''); try { await api.vendor.setOrderStatus(id, s); load(); } catch (e) { setErr((e as Error).message); } };
  return (
    <Screen>
      <Err msg={err} />
      {!orders.length && <T muted>No orders yet.</T>}
      {orders.map((o) => (
        <Card key={o.id}>
          <Row style={{ justifyContent: 'space-between' }}><T bold>{shortId(o.id)} · {o.fulfillment}</T><Badge text={o.status.replace(/_/g, ' ')} tone={STATUS_TONE[o.status]} /></Row>
          <T muted small>{fmtDate(o.createdAt)} · {o.customer.phone}</T>
          {o.lines.map((l) => <T key={l.itemId} small>{l.qty} × {l.name}</T>)}
          {o.deliveryAddress ? <T small>📍 {o.deliveryAddress}</T> : null}
          <T bold>{rupees(o.total)} <T small muted>· paid {rupees(o.paid)}</T>{o.due > 0 ? <T small color={colors.danger}> · collect {rupees(o.due)}</T> : null}</T>
          <Row>{ORDER_TRANSITIONS[o.status].filter((s) => s !== 'OUT_FOR_DELIVERY' || o.fulfillment === 'DELIVERY').map((s) => <Btn key={s} kind={s === 'CANCELLED' ? 'danger' : 'primary'} title={s.replace(/_/g, ' ')} onPress={() => move(o.id, s)} />)}</Row>
        </Card>))}
    </Screen>
  );
}
