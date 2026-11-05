'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { LANGUAGES, LANGUAGE_LABELS, MAX_RADIUS_KM, MIN_RADIUS_KM, type Language } from '@busyfrnd/shared';
import { Avatar, Button, Card, Field, Input, Segmented, toast, useApp, useLocation } from '@busyfrnd/web-ui';

export default function Settings() {
  const { api, user, updateUser, lang, setLang, logout, t } = useApp();
  const { loc, detect } = useLocation();
  const router = useRouter();
  const [radius, setRadius] = useState(user?.radiusKm ?? 20);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const save = async () => { setBusy(true); try { updateUser(await api.me.update({ radiusKm: radius, name: name || undefined, email: email || undefined, lat: loc.lat, lng: loc.lng })); toast.success('Saved'); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } };
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex items-center gap-4"><Avatar name={user.name ?? user.phone} className="h-16 w-16 text-2xl" /><div><h1 className="text-2xl font-black">{user.name ?? 'Your account'}</h1><p className="text-muted">{user.phone}</p></div></div>
      <Card className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between"><h2 className="font-extrabold">{t('settings.radius')}</h2><span className="text-2xl font-black tabular-nums">{radius} km</span></div>
        <input type="range" min={MIN_RADIUS_KM} max={MAX_RADIUS_KM} value={radius} onChange={(e) => setRadius(+e.target.value)} className="h-2 w-full cursor-pointer accent-ink" aria-label={t('settings.radius')} />
        <Button variant="soft" onClick={() => detect().then(() => toast.success('Location updated')).catch((e) => toast.error(e.message))}>📍 Use my current location</Button>
      </Card>
      <Card className="flex flex-col gap-4"><h2 className="font-extrabold">{t('settings.language')}</h2>
        <Segmented value={lang} onChange={(l) => setLang(l as Language)} options={LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))} /></Card>
      <Card className="flex flex-col gap-4"><h2 className="font-extrabold">Profile</h2>
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t('auth.emailOptional')}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field></Card>
      <Button size="lg" block loading={busy} onClick={save}>{t('common.save')}</Button>
      <Button variant="outline" block onClick={() => { logout(); router.push('/login'); }}><LogOut size={16} />{t('settings.logout')}</Button>
    </div>
  );
}
