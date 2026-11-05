'use client';
import { useState } from 'react';
import { MAX_RADIUS_KM, MIN_RADIUS_KM } from '@busyfrnd/shared';
import { useApp, useLocation } from '@busyfrnd/web-ui';

export default function Settings() {
  const { api, user, updateUser, t } = useApp();
  const { loc, detect } = useLocation();
  const [radius, setRadius] = useState(user?.radiusKm ?? 20);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [msg, setMsg] = useState('');
  if (!user) return null;
  const save = async () => {
    try { updateUser(await api.me.update({ radiusKm: radius, name: name || undefined, email: email || undefined, lat: loc.lat, lng: loc.lng })); setMsg('Saved ✓'); } catch (e) { setMsg((e as Error).message); }
  };
  return (
    <div className="card col" style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ margin: 0 }}>{t('nav.settings')}</h2>
      <label>{t('settings.radius')}: {radius} km<input type="range" min={MIN_RADIUS_KM} max={MAX_RADIUS_KM} value={radius} onChange={(e) => setRadius(+e.target.value)} /></label>
      <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>{t('auth.phone')}<input value={user.phone} disabled /></label>
      <label>{t('auth.emailOptional')}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <button className="btn secondary" onClick={() => detect().then(() => setMsg('Location updated')).catch((e) => setMsg(e.message))}>📍 Use my current location</button>
      <button className="btn" onClick={save}>{t('common.save')}</button>
      {msg && <div className="small">{msg}</div>}
    </div>
  );
}
