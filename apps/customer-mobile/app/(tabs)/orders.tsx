import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { rupees, type OrderDto } from '@busyfrnd/shared';
import { Badge, Btn, Card, EmptyState, Enter, Icon, Row, STATUS_LABEL, STATUS_TONE, Screen, Skeleton, T, colors, fmtShort, shortId, useApp } from '@busyfrnd/mobile-core';

export default function OrdersTab() {
  const { api, t } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDto[] | null>(null);
  const load = useCallback(() => api.orders.list().then(setOrders).catch(() => setOrders([])), [api]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return (
    <Screen title={t('nav.orders')} onRefresh={load} bottomInset={40}>
      {!orders ? <><Skeleton style={{ height: 96, borderRadius: 24 }} /><Skeleton style={{ height: 96, borderRadius: 24 }} /></> : !orders.length
        ? <EmptyState emoji="📦" title="No orders yet" hint="Your orders will show up here." action={<Btn title="Start shopping" onPress={() => router.navigate('/')} />} />
        : orders.map((o, i) => (
          <Enter key={o.id} i={i}>
            <Card onPress={() => router.push(`/order/${o.id}`)}>
              <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="headline" numberOfLines={1} style={{ flex: 1 }}>{o.storeName}</T><Badge tone={STATUS_TONE[o.status]} text={STATUS_LABEL[o.status]} /></Row>
              <T small muted numberOfLines={1}>{shortId(o.id)} · {fmtShort(o.createdAt)} · {o.lines.map((l) => l.name).join(', ')}</T>
              <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="label">{rupees(o.total)}</T><Row gap={4}><T small bold color={colors.brand}>{t('order.track')}</T><Icon name="chevron-forward" size={14} color={colors.brand} /></Row></Row>
            </Card>
          </Enter>))}
      <View />
    </Screen>
  );
}
