import { useState } from 'react';
import { Btn, Card, Err, Field, Screen, T } from './ui';
import { useApp } from './app';

/** Customer: mobile OTP only (email optional). Vendor: mobile OTP + email OTP, both mandatory. */
export function OtpLogin({ role, onDone }: { role: 'CUSTOMER' | 'VENDOR'; onDone: () => void }) {
  const { api, setSession, t, lang, apiUrl, setApiUrl } = useApp();
  const [server, setServer] = useState(apiUrl);
  const [showServer, setShowServer] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pCode, setPCode] = useState('');
  const [eCode, setECode] = useState('');
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const vendor = role === 'VENDOR';
  const run = async (fn: () => Promise<void>) => { setErr(''); setBusy(true); try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };

  return (
    <Screen>
      <T size={28} bold style={{ marginTop: 40 }}>{t('app.welcome')} {vendor ? '🏪' : '👋'}</T>
      {vendor && <T muted small>Mobile and email are both verified with an OTP. 60-day free trial for new vendors.</T>}
      <Card>
        <Field label={t('auth.phone')} keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!sent} placeholder="98765 43210" />
        {(vendor || !sent) && <Field label={vendor ? t('auth.email') : t('auth.emailOptional')} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} editable={!sent} />}
        {sent && <Field label={`SMS ${t('auth.otp')}`} keyboardType="number-pad" maxLength={6} value={pCode} onChangeText={setPCode} />}
        {sent && vendor && <Field label={t('auth.emailOtp')} keyboardType="number-pad" maxLength={6} value={eCode} onChangeText={setECode} />}
        {hint ? <T small muted>{hint}</T> : null}
        <Err msg={err} />
        {!sent
          ? <Btn title={t('auth.sendOtp')} loading={busy} disabled={phone.replace(/\D/g, '').length < 10 || (vendor && !/.+@.+\..+/.test(email))}
              onPress={() => run(async () => { const r = await api.auth.requestOtp({ phone, role, email: vendor ? email : undefined }); setHint(r.devHint ?? ''); setSent(true); })} />
          : <Btn title={t('auth.verify')} loading={busy} disabled={pCode.length < 4 || (vendor && eCode.length < 4)}
              onPress={() => run(async () => { const r = await api.auth.verifyOtp({ phone, code: pCode, role, email: email || undefined, emailCode: vendor ? eCode : undefined, language: lang }); await setSession(r.token, r.user); onDone(); })} />}
      </Card>
      <Btn kind="ghost" title={showServer ? 'Hide server settings' : 'Server settings'} onPress={() => setShowServer(!showServer)} />
      {showServer && (
        <Card>
          <Field label="API server URL (testing)" autoCapitalize="none" value={server} onChangeText={setServer} placeholder="http://192.168.1.10:4000" />
          <Btn kind="secondary" title="Use this server" onPress={() => setApiUrl(server)} />
        </Card>)}
    </Screen>
  );
}
