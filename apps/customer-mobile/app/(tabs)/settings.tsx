import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LANGUAGES, LANGUAGE_LABELS, MAX_RADIUS_KM, MIN_RADIUS_KM, type Language } from '@busyfrnd/shared';
import { Btn, Card, Field, Row, Screen, T, useApp, useLocation } from '@busyfrnd/mobile-core';

export default function Settings() {
  const { api, user, updateUser, lang, setLang, logout, t } = useApp();
  const { loc, detect } = useLocation();
  const router = useRouter();
  const [radius, setRadius] = useState(user?.radiusKm ?? 20);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [msg, setMsg] = useState('');
  if (!user) return null;
  const clamp = (n: number) => Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, n));
  return (
    <Screen>
      <Card>
        <T bold>{t('settings.radius')}</T>
        <Row><Btn kind="secondary" title="−5" onPress={() => setRadius(clamp(radius - 5))} /><T bold size={22}>{radius} km</T><Btn kind="secondary" title="+5" onPress={() => setRadius(clamp(radius + 5))} /></Row>
        <T muted small>Stores within this distance of your location are shown ({MIN_RADIUS_KM}–{MAX_RADIUS_KM} km).</T>
        <Btn kind="secondary" title="📍 Use my current location" onPress={() => detect().then(() => setMsg('Location updated')).catch((e) => setMsg(e.message))} />
      </Card>
      <Card>
        <T bold>{t('settings.language')}</T>
        <Row>{LANGUAGES.map((l) => <Btn key={l} kind={lang === l ? 'primary' : 'secondary'} title={LANGUAGE_LABELS[l as Language]} onPress={() => setLang(l as Language)} />)}</Row>
      </Card>
      <Card>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label={t('auth.phone')} value={user.phone} editable={false} />
        <Field label={t('auth.emailOptional')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </Card>
      <Btn title={t('common.save')} onPress={async () => { try { updateUser(await api.me.update({ radiusKm: radius, name: name || undefined, email: email || undefined, lat: loc.lat, lng: loc.lng })); setMsg('Saved ✓'); } catch (e) { setMsg((e as Error).message); } }} />
      {msg ? <T small>{msg}</T> : null}
      <Btn kind="ghost" title={t('settings.logout')} onPress={async () => { await logout(); router.replace('/login'); }} />
    </Screen>
  );
}
