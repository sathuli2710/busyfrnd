'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@busyfrnd/web-ui';

export default function Login() {
  const { api, setSession, t, lang } = useApp();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pCode, setPCode] = useState('');
  const [eCode, setECode] = useState('');
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => { setErr(''); setBusy(true); try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };

  return (
    <div className="card" style={{ maxWidth: 440, margin: '40px auto' }}>
      <h2 style={{ marginTop: 0 }}>{t('app.welcome')} 🏪</h2>
      <p className="muted small">Mobile number and email are both verified with an OTP. New vendors get a 60-day free trial.</p>
      <div className="col">
        <label>{t('auth.phone')}<input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={sent} /></label>
        <label>{t('auth.email')}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={sent} /></label>
        {sent && <>
          <label>SMS {t('auth.otp')}<input inputMode="numeric" maxLength={6} value={pCode} onChange={(e) => setPCode(e.target.value)} /></label>
          <label>{t('auth.emailOtp')}<input inputMode="numeric" maxLength={6} value={eCode} onChange={(e) => setECode(e.target.value)} /></label>
        </>}
        {hint && <div className="small muted">{hint}</div>}
        {err && <div className="error">{err}</div>}
        {!sent
          ? <button className="btn big" disabled={busy || phone.replace(/\D/g, '').length < 10 || !/.+@.+\..+/.test(email)} onClick={() => run(async () => { const r = await api.auth.requestOtp({ phone, email, role: 'VENDOR' }); setHint(r.devHint ?? ''); setSent(true); })}>{t('auth.sendOtp')}</button>
          : <button className="btn big" disabled={busy || pCode.length < 4 || eCode.length < 4} onClick={() => run(async () => {
              const r = await api.auth.verifyOtp({ phone, email, code: pCode, emailCode: eCode, role: 'VENDOR', language: lang });
              setSession(r.token, r.user); router.replace('/');
            })}>{t('auth.verify')}</button>}
      </div>
    </div>
  );
}
