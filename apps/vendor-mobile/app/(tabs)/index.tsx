import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { rupees } from '@busyfrnd/shared';
import type { Dashboard, VendorStore } from '@busyfrnd/api-client';
import { Badge, Btn, Card, Loading, Row, Screen, T, colors, useApp } from '@busyfrnd/mobile-core';

const TONE: Record<string, 'gray' | 'orange' | 'blue' | 'red' | 'green'> = { DRAFT: 'gray', IN_REVIEW: 'orange', APPROVED: 'blue', REJECTED: 'red', PUBLISHED: 'green', SUSPENDED: 'red' };

export default function Home() {
  const { api, t } = useApp();
  const router = useRouter();
  const [d, setD] = useState<Dashboard | null>(null);
  const [stores, setStores] = useState<VendorStore[] | null>(null);
  useFocusEffect(useCallback(() => { api.vendor.dashboard().then(setD).catch(() => undefined); api.vendor.overview().then((o) => setStores(o.stores)).catch(() => setStores([])); }, [api]));
  if (!stores) return <Screen><Loading /></Screen>;
  const max = Math.max(1, ...(d?.series.map((s) => s.revenue) ?? [1]));
  return (
    <Screen>
      {d?.subscription.plan === 'TRIAL' && <Card style={{ backgroundColor: '#FFF7E6' }}><T>🎁 <T bold>{d.subscription.daysLeft}</T> {t('vendor.trialLeft')}</T><T muted small>AI tokens {d.subscription.aiTokensUsed.toLocaleString()} / {d.subscription.aiTokensLimit.toLocaleString()}</T></Card>}
      {d && <Row>
        <Card style={{ flex: 1 }}><T muted small>Today</T><T bold size={24}>₹{d.revenueToday.toLocaleString('en-IN')}</T><T small muted>{d.ordersToday} orders</T></Card>
        <Card style={{ flex: 1 }}><T muted small>Pending</T><T bold size={24}>{d.pendingOrders}</T><T small muted>orders</T></Card>
      </Row>}
      {d && <Card>
        <T bold>Last 7 days · {rupees(d.revenueLast7Days * 100)}</T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90, marginTop: 8 }}>
          {d.series.map((s) => <View key={s.date} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 4, height: `${Math.max(2, (s.revenue / max) * 100)}%` }} />)}
        </View>
      </Card>}
      <Row style={{ justifyContent: 'space-between' }}><T bold size={18}>{t('nav.store')}</T><Btn title="＋ New (voice)" onPress={() => router.push('/onboarding')} /></Row>
      {!stores.length && <T muted>No stores yet. Tap “New (voice)” and just tell the AI about your shop.</T>}
      {stores.map((s) => (
        <Card key={s.id} onPress={() => router.push(`/store/${s.id}`)}>
          <T bold size={16}>{s.name}</T>
          <Row><Badge text={s.status.replace('_', ' ')} tone={TONE[s.status]} />{s.publishWeb && <Badge text="Web" tone="blue" />}{s.publishApp && <Badge text="App" tone="blue" />}<T muted small>{s._count?.items ?? 0} items</T></Row>
          {s.rejectionReason ? <T small color={colors.danger}>{s.rejectionReason}</T> : null}
        </Card>))}
    </Screen>
  );
}
