import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { rupees, type OrderDto } from '@busyfrnd/shared';
import { Badge, Card, Loading, Row, STATUS_TONE, Screen, T, fmtDate, shortId, useApp } from '@busyfrnd/mobile-core';

export default function OrdersTab() {
  const { api } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDto[] | null>(null);
  useFocusEffect(useCallback(() => { api.orders.list().then(setOrders).catch(() => setOrders([])); }, [api]));
  if (!orders) return <Screen><Loading /></Screen>;
  if (!orders.length) return <Screen><T muted>No orders yet.</T></Screen>;
  return (
    <Screen>{orders.map((o) => (
      <Card key={o.id} onPress={() => router.push(`/order/${o.id}`)}>
        <Row style={{ justifyContent: 'space-between' }}><T bold>{o.storeName}</T><Badge text={o.status.replace(/_/g, ' ')} tone={STATUS_TONE[o.status]} /></Row>
        <T muted small>{shortId(o.id)} · {fmtDate(o.createdAt)} · {o.fulfillment}</T><T bold>{rupees(o.total)}</T>
      </Card>))}</Screen>
  );
}
