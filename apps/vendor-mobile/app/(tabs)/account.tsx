import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LANGUAGES, LANGUAGE_LABELS, PLANS, rupees, type Language, type PlanId, type Subscription } from '@busyfrnd/shared';
import { Btn, Card, Err, Row, Screen, T, openCheckout, useApp } from '@busyfrnd/mobile-core';

export default function Account() {
  const { api, user, lang, setLang, logout, t } = useApp();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [err, setErr] = useState('');
  useFocusEffect(useCallback(() => { api.vendor.overview().then((o) => setSub(o.subscription)).catch(() => undefined); }, [api]));
  const buy = async (plan: 'PLUS' | 'PRO') => {
    setErr('');
    try { const ret = 'busyfrnd-vendor://pay-result'; const r = await api.vendor.subscribe(plan, ret); await openCheckout(r.checkoutUrl, ret); const o = await api.vendor.overview(); setSub(o.subscription); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <Screen>
      <Card><T bold>{user?.phone}</T><T muted small>{user?.email}</T></Card>
      <Card>
        <T bold>{t('settings.language')}</T>
        <Row>{LANGUAGES.map((l) => <Btn key={l} kind={lang === l ? 'primary' : 'secondary'} title={LANGUAGE_LABELS[l as Language]} onPress={() => setLang(l as Language)} />)}</Row>
      </Card>
      {sub && <Card><T muted small>Current plan</T><T bold size={18}>{PLANS[sub.plan].name}</T>{sub.daysLeft != null && <T>{sub.daysLeft} days left</T>}<T small muted>AI tokens {sub.aiTokensUsed.toLocaleString()} / {sub.aiTokensLimit.toLocaleString()}</T></Card>}
      <Err msg={err} />
      {(['PLUS', 'PRO'] as PlanId[]).map((id) => { const p = PLANS[id]; return (
        <Card key={id}>
          <Row style={{ justifyContent: 'space-between' }}><T bold size={17}>{p.name}</T><T bold>{rupees(p.pricePaise)}/mo</T></Row>
          {p.features.map((f) => <T key={f} small>• {f}</T>)}
          <T small>• {p.maxStores} published store(s) · {p.aiTokensPerPeriod.toLocaleString()} AI tokens</T>
          <Btn title={sub?.plan === id ? 'Current plan' : `Choose ${p.name}`} disabled={sub?.plan === id} onPress={() => buy(id as 'PLUS' | 'PRO')} />
        </Card>); })}
      <T muted small>Prices are placeholders and will be finalised before launch.</T>
      <Btn kind="ghost" title={t('settings.logout')} onPress={async () => { await logout(); router.replace('/login'); }} />
    </Screen>
  );
}
