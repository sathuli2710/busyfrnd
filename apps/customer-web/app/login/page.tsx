'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@busyfrnd/web-ui';

export default function Login() {
  const { api, setSession, t, lang } = useApp();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => { setErr(''); setBusy(true); try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };

  return (
    <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2 style={{ marginTop: 0 }}>{t('app.welcome')} 👋</h2>
      <div className="col">
        <label>{t('auth.phone')}<input inputMode="tel" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={sent} /></label>
        {!sent && <label>{t('auth.emailOptional')}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>}
        {sent && <label>{t('auth.otp')}<input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoFocus /></label>}
        {hint && <div className="small muted">{hint}</div>}
        {err && <div className="error">{err}</div>}
        {!sent ? (
          <button className="btn big" disabled={busy || phone.replace(/\D/g, '').length < 10} onClick={() => run(async () => { const r = await api.auth.requestOtp({ phone, role: 'CUSTOMER' }); setHint(r.devHint ?? ''); setSent(true); })}>{t('auth.sendOtp')}</button>
        ) : (
          <button className="btn big" disabled={busy || code.length < 4} onClick={() => run(async () => { const r = await api.auth.verifyOtp({ phone, code, role: 'CUSTOMER', email: email || undefined, language: lang }); setSession(r.token, r.user); router.replace('/'); })}>{t('auth.verify')}</button>
        )}
      </div>
    </div>
  );
}
