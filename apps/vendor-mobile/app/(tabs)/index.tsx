import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { categoryMeta, fill, greeting, rupees } from '@busyfrnd/shared';
import type { Dashboard, VendorStore } from '@busyfrnd/api-client';
import { AiBadge, Badge, BarChart, Btn, Card, EmptyState, Enter, Icon, Row, Screen, Skeleton, StoreCover, T, Tap, colors, radius, shadow, useApp } from '@busyfrnd/mobile-core';
import { StatusSteps } from '../../components/StatusSteps';

const TONE: Record<string, 'gray' | 'orange' | 'blue' | 'red' | 'green'> = { DRAFT: 'gray', IN_REVIEW: 'orange', APPROVED: 'blue', REJECTED: 'red', PUBLISHED: 'green', SUSPENDED: 'red' };

export default function Home() {
  const { api, user, t } = useApp();
  const router = useRouter();
  const [d, setD] = useState<Dashboard | null>(null);
  const [stores, setStores] = useState<VendorStore[] | null>(null);
  const [ix, setIx] = useState(0);
  const load = useCallback(async () => { await Promise.all([api.vendor.dashboard().then(setD).catch(() => undefined), api.vendor.overview().then((o) => setStores(o.stores)).catch(() => setStores([]))]); }, [api]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const insights = d?.insights ?? [];
  useEffect(() => { if (insights.length < 2) return; const i = setInterval(() => setIx((n) => (n + 1) % insights.length), 4500); return () => clearInterval(i); }, [insights.length]);
  const cur = insights.length ? insights[ix % insights.length] : null;

  return (
    <Screen onRefresh={load} bottomInset={40}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <View style={{ flex: 1 }}><T variant="label" muted>{t(`hello.${greeting()}`)}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</T><T variant="display">{t('nav.dashboard')}</T></View>
        <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>B</Text></View>
      </Row>

      <Animated.View entering={FadeInDown.springify()}>
        <LinearGradient colors={['#0B0B0F', '#2A2160']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ borderRadius: radius.xl, padding: 20, gap: 12, overflow: 'hidden' }, shadow.lift]}>
          <View style={{ position: 'absolute', right: -40, top: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(108,92,231,0.45)' }} />
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><AiBadge text={t('insight.title')} /><Row gap={5}>{insights.map((_, i) => <View key={i} style={{ width: i === ix ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === ix ? '#fff' : 'rgba(255,255,255,0.3)' }} />)}</Row></Row>
          <View style={{ minHeight: 64, justifyContent: 'center' }}>
            <Animated.Text key={ix + (d ? 'a' : 'b')} entering={FadeIn.duration(350)} exiting={FadeOut.duration(150)} style={{ color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 29, letterSpacing: -0.4 }}>
              {!d ? '…' : cur ? fill(t(cur.key), cur.params ?? {}) : '✨ ' + t('vendor.askBuddy')}
            </Animated.Text>
          </View>
          <Tap onPress={() => router.navigate('/assistant')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 16, height: 40, borderRadius: 20 }}><Icon name="mic" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800' }}>{t('vendor.askBuddy')}</Text></Tap>
        </LinearGradient>
      </Animated.View>

      {!d ? <Row><Skeleton style={{ flex: 1, height: 110, borderRadius: 24 }} /><Skeleton style={{ flex: 1, height: 110, borderRadius: 24 }} /></Row> : (
        <Row style={{ flexWrap: 'nowrap' }}>
          {[['Today’s sales', `₹${d.revenueToday.toLocaleString('en-IN')}`, `${d.ordersToday} order${d.ordersToday === 1 ? '' : 's'}`, 'cash-outline', '#E6F6EC', '#0B6B3A'], ['Needs attention', String(d.pendingOrders), 'Open the board →', 'time-outline', d.pendingOrders ? '#FFF0E8' : '#EEEEF1', d.pendingOrders ? '#C2410C' : '#374151']].map(([l, v, h, ic, bg, fg], i) => (
            <Enter key={l} i={i} style={{ flex: 1 }}>
              <Card onPress={i === 1 ? () => router.navigate('/orders') : undefined} style={{ flex: 1 }}>
                <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon name={ic as 'cash-outline'} size={20} color={fg} /></View>
                <T variant="caption" muted>{l}</T><T variant="title">{v}</T><T small muted>{h}</T>
              </Card>
            </Enter>))}
        </Row>)}

      {d && <Enter i={2}><Card><Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="headline">Last 7 days</T><T bold muted>{rupees(d.revenueLast7Days * 100)}</T></Row><BarChart data={d.series.map((s) => ({ label: new Date(s.date).toLocaleDateString('en-IN', { weekday: 'narrow' }), value: s.revenue }))} /></Card></Enter>}

      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="title">{t('nav.store')}</T><Btn kind="ai" size="sm" icon="mic" title="New (voice)" onPress={() => router.push('/onboarding')} /></Row>
      {!stores ? <Skeleton style={{ height: 180, borderRadius: 28 }} /> : !stores.length ? <EmptyState emoji="🎙️" title="Let’s build your first store" hint="Tell the AI what you sell — it drafts your store, items and prices in your language." action={<Btn kind="ai" size="lg" icon="sparkles" title="Start with your voice" onPress={() => router.push('/onboarding')} />} />
        : stores.map((s, i) => (
          <Enter key={s.id} i={i}>
            <Tap onPress={() => router.push(`/store/${s.id}`)} scale={0.98} style={[{ backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', borderWidth: 0.5, borderColor: colors.line }, shadow.soft]}>
              <StoreCover category={s.category} height={84} radius={0}><View style={{ position: 'absolute', left: 14, top: 14 }}><Badge tone={TONE[s.status]} text={s.status.replace('_', ' ')} /></View></StoreCover>
              <View style={{ padding: 16, gap: 12 }}>
                <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><View style={{ flex: 1 }}><T variant="headline" numberOfLines={1}>{s.name}</T><T small muted>{categoryMeta(s.category).emoji} {categoryMeta(s.category).label} · {s._count?.items ?? 0} items</T></View><Row gap={4}>{s.publishWeb && <Badge tone="blue" text="Web" />}{s.publishApp && <Badge tone="blue" text="App" />}</Row></Row>
                <StatusSteps status={s.status} />
                {s.rejectionReason ? <View style={{ backgroundColor: '#FDE8EC', padding: 12, borderRadius: 14 }}><T small bold color="#BE123C">{s.rejectionReason}</T></View> : null}
              </View>
            </Tap>
          </Enter>))}
    </Screen>
  );
}
