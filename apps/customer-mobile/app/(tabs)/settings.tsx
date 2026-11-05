import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LANGUAGES, LANGUAGE_LABELS, MAX_RADIUS_KM, MIN_RADIUS_KM, type Language } from '@busyfrnd/shared';
import { Btn, Card, Field, IconBtn, Row, Screen, Segmented, T, colors, haptic, useApp, useLocation, useToast } from '@busyfrnd/mobile-core';

export default function Settings() {
  const { api, user, updateUser, lang, setLang, logout, t } = useApp();
  const { loc, detect } = useLocation();
  const toast = useToast();
  const router = useRouter();
  const [radius, setRadius] = useState(user?.radiusKm ?? 20);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const clamp = (n: number) => Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, n));
  const save = async () => { setBusy(true); try { updateUser(await api.me.update({ radiusKm: radius, name: name || undefined, email: email || undefined, lat: loc.lat, lng: loc.lng })); toast.show('Saved', 'ok'); } catch (e) { toast.show((e as Error).message, 'error'); } finally { setBusy(false); } };
  return (
    <Screen title="Account" bottomInset={40}>
      <Row gap={14} style={{ flexWrap: 'nowrap' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 26 }}>{(user.name ?? user.phone).slice(0, 1).toUpperCase()}</Text></View>
        <View><T variant="title">{user.name ?? 'Your account'}</T><T muted>{user.phone}</T></View>
      </Row>
      <Card>
        <T variant="headline">{t('settings.radius')}</T>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><IconBtn name="remove" onPress={() => { haptic.light(); setRadius(clamp(radius - 5)); }} /><T variant="display">{radius} km</T><IconBtn name="add" onPress={() => { haptic.light(); setRadius(clamp(radius + 5)); }} /></Row>
        <T small muted>Stores within this distance are shown ({MIN_RADIUS_KM}–{MAX_RADIUS_KM} km).</T>
        <Btn kind="soft" full icon="locate" title="Use my current location" onPress={() => detect().then(() => toast.show('Location updated', 'ok')).catch((e) => toast.show(e.message, 'error'))} />
      </Card>
      <Card><T variant="headline">{t('settings.language')}</T><Segmented value={lang} onChange={(l) => setLang(l as Language)} options={LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))} /></Card>
      <Card><T variant="headline">Profile</T><Field label="Name" value={name} onChangeText={setName} /><Field label={t('auth.emailOptional')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></Card>
      <Btn full size="lg" title={t('common.save')} loading={busy} onPress={save} />
      <Btn full kind="outline" icon="log-out-outline" title={t('settings.logout')} onPress={async () => { await logout(); router.replace('/login'); }} />
    </Screen>
  );
}
