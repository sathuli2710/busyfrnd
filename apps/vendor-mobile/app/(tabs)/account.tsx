import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { LANGUAGES, LANGUAGE_LABELS, PLANS, rupees, type Language, type PlanId, type Subscription } from '@busyfrnd/shared';
import { Badge, Btn, Card, Enter, Icon, Row, Screen, Segmented, T, colors, openCheckout, shadow, useApp, useToast } from '@busyfrnd/mobile-core';

function Usage({ used, limit }: { used: number; limit: number }) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withSpring(Math.min(1, used / Math.max(1, limit)), { damping: 18 }); }, [used, limit, w]);
  const s = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.chip, overflow: 'hidden' }}><Animated.View style={[{ height: '100%' }, s]}><LinearGradient colors={['#6C5CE7', '#C55CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} /></Animated.View></View>;
}

export default function Account() {
  const { api, user, lang, setLang, logout, t } = useApp();
  const toast = useToast();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const load = useCallback(() => api.vendor.overview().then((o) => setSub(o.subscription)).catch(() => undefined), [api]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const buy = async (plan: 'PLUS' | 'PRO') => {
    try { const ret = 'busyfrnd-vendor://pay-result'; const r = await api.vendor.subscribe(plan, ret); await openCheckout(r.checkoutUrl, ret); await load(); } catch (e) { toast.show((e as Error).message, 'error'); }
  };
  return (
    <Screen title={t('nav.plans')} onRefresh={load} bottomInset={40}>
      <Card><Row gap={12} style={{ flexWrap: 'nowrap' }}><View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>{(user?.name ?? user?.phone ?? '?').slice(0, 1).toUpperCase()}</Text></View><View><T variant="headline">{user?.name ?? 'Vendor'}</T><T small muted>{user?.phone} · {user?.email}</T></View></Row></Card>
      <Card><T variant="headline">{t('settings.language')}</T><Segmented value={lang} onChange={(l) => setLang(l as Language)} options={LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))} /></Card>
      {sub && <Enter><Card><T variant="caption" muted>Current plan</T><T variant="title">{PLANS[sub.plan].name}</T>{sub.daysLeft != null && <T bold color={colors.brand}>{sub.daysLeft} days left in your free trial</T>}<Usage used={sub.aiTokensUsed} limit={sub.aiTokensLimit} /><T small muted>AI tokens {sub.aiTokensUsed.toLocaleString()} / {sub.aiTokensLimit.toLocaleString()}</T></Card></Enter>}
      {(['PLUS', 'PRO'] as PlanId[]).map((id, i) => { const p = PLANS[id], pro = id === 'PRO', cur = sub?.plan === id; return (
        <Enter key={id} i={i + 1}>
          <View style={[{ borderRadius: 28, overflow: 'hidden' }, pro && shadow.ai]}>
            <LinearGradient colors={pro ? ['#0B0B0F', '#2A2160'] : ['#fff', '#fff']} style={{ padding: 20, gap: 10, borderWidth: pro ? 0 : 1, borderColor: colors.line, borderRadius: 28 }}>
              <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="headline" color={pro ? '#fff' : colors.text}>{p.name}</T>{pro ? <Badge tone="violet" icon="sparkles" text="Best value" /> : null}</Row>
              <T variant="display" color={pro ? '#fff' : colors.text}>{rupees(p.pricePaise)}<Text style={{ fontSize: 15, opacity: 0.6 }}>/mo</Text></T>
              {[...p.features, `${p.maxStores} published stores`, `${p.aiTokensPerPeriod.toLocaleString()} AI tokens`].map((f) => <Row key={f} gap={8} style={{ flexWrap: 'nowrap' }}><Icon name="checkmark-circle" size={18} color={pro ? '#C55CFF' : colors.ok} /><T small color={pro ? 'rgba(255,255,255,0.85)' : colors.text}>{f}</T></Row>)}
              <Btn full size="lg" kind={pro ? 'ai' : 'primary'} disabled={cur} title={cur ? 'Current plan' : `Choose ${p.name}`} onPress={() => buy(id as 'PLUS' | 'PRO')} />
            </LinearGradient>
          </View>
        </Enter>); })}
      <T small muted center>Prices are placeholders and will be finalised before launch.</T>
      <Btn full kind="outline" icon="log-out-outline" title={t('settings.logout')} onPress={async () => { await logout(); router.replace('/login'); }} />
    </Screen>
  );
}
