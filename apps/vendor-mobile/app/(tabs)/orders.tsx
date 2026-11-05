import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ORDER_TRANSITIONS, rupees, type OrderStatus } from '@busyfrnd/shared';
import type { VendorOrder } from '@busyfrnd/api-client';
import { Badge, Btn, Card, Chip, EmptyState, Enter, Icon, Row, STATUS_LABEL, STATUS_TONE, Screen, Skeleton, T, colors, fmtShort, shortId, useApp, useToast } from '@busyfrnd/mobile-core';

const GROUPS: Array<{ key: string; title: string; statuses: OrderStatus[] }> = [
  { key: 'new', title: 'New', statuses: ['PLACED'] }, { key: 'prep', title: 'In progress', statuses: ['ACCEPTED', 'PREPARING'] },
  { key: 'ready', title: 'Ready', statuses: ['READY', 'OUT_FOR_DELIVERY'] }, { key: 'done', title: 'Done', statuses: ['COMPLETED', 'CANCELLED'] },
];
const NEXT: Partial<Record<OrderStatus, string>> = { PLACED: 'Accept', ACCEPTED: 'Start preparing', PREPARING: 'Mark ready', READY: 'Complete', OUT_FOR_DELIVERY: 'Delivered' };

export default function OrdersTab() {
  const { api, t } = useApp();
  const toast = useToast();
  const [orders, setOrders] = useState<VendorOrder[] | null>(null);
  const [g, setG] = useState('new');
  const load = useCallback(() => api.vendor.orders().then(setOrders).catch(() => setOrders([])), [api]);
  useFocusEffect(useCallback(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [load]));
  const move = async (o: VendorOrder, s: OrderStatus) => { try { await api.vendor.setOrderStatus(o.id, s); toast.show(`${shortId(o.id)} → ${STATUS_LABEL[s]}`, 'ok'); load(); } catch (e) { toast.show((e as Error).message, 'error'); } };
  const primary = (o: VendorOrder): OrderStatus | null => {
    if (o.status === 'READY') return o.fulfillment === 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'COMPLETED';
    return ORDER_TRANSITIONS[o.status].find((s) => s !== 'CANCELLED' && (s !== 'OUT_FOR_DELIVERY' || o.fulfillment === 'DELIVERY')) ?? null;
  };
  const group = GROUPS.find((x) => x.key === g)!;
  const rows = (orders ?? []).filter((o) => group.statuses.includes(o.status));
  return (
    <Screen title={t('nav.orders')} subtitle="Live — refreshes automatically" onRefresh={load} bottomInset={40}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
        {GROUPS.map((x) => <Chip key={x.key} label={`${x.title} · ${(orders ?? []).filter((o) => x.statuses.includes(o.status)).length}`} active={g === x.key} onPress={() => setG(x.key)} />)}
      </ScrollView>
      {!orders ? <Skeleton style={{ height: 180, borderRadius: 24 }} /> : !rows.length ? <EmptyState emoji="🧾" title="Nothing here" hint={!orders.length ? 'When a customer orders, it appears here instantly.' : 'No orders in this stage.'} />
        : rows.map((o, i) => { const nx = primary(o); return (
          <Enter key={o.id} i={i}>
            <Card>
              <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="headline">{shortId(o.id)}</T><Badge tone={STATUS_TONE[o.status]} text={STATUS_LABEL[o.status]} /></Row>
              <Row gap={6}><Icon name={o.fulfillment === 'PICKUP' ? 'storefront-outline' : 'bicycle-outline'} size={14} color={colors.muted} /><T small muted>{o.fulfillment === 'PICKUP' ? 'Pickup' : 'Delivery'} · {fmtShort(o.createdAt)} · {o.customer.phone}</T></Row>
              {o.lines.map((l) => <Row key={l.itemId} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T>{l.qty} × {l.name}</T><T bold>{rupees(l.qty * l.pricePaise)}</T></Row>)}
              {o.deliveryAddress ? <T small muted>📍 {o.deliveryAddress}</T> : null}
              <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', paddingTop: 6 }}><T variant="title">{rupees(o.total)}</T>{o.due > 0 ? <Badge tone="orange" text={`Collect ${rupees(o.due)}`} /> : null}</Row>
              {(nx || ORDER_TRANSITIONS[o.status].includes('CANCELLED')) && <Row style={{ flexWrap: 'nowrap' }}>{nx ? <Btn kind={o.status === 'PLACED' ? 'brand' : 'primary'} style={{ flex: 1 }} full title={NEXT[o.status] ?? 'Next'} onPress={() => move(o, nx)} /> : null}{ORDER_TRANSITIONS[o.status].includes('CANCELLED') ? <Btn kind="soft" title="Cancel" onPress={() => move(o, 'CANCELLED')} /> : null}</Row>}
            </Card>
          </Enter>); })}
    </Screen>
  );
}
