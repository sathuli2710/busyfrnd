'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button, Field, Input, OtpInput, Badge, toast, useApp } from '@busyfrnd/web-ui';

export default function Login() {
  const { api, setSession, t, lang } = useApp();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => { setBusy(true); try { const r = await api.auth.requestOtp({ phone, role: 'CUSTOMER' }); setHint(r.devHint ?? ''); setSent(true); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } };
  const verify = async (c = code) => { setBusy(true); try { const r = await api.auth.verifyOtp({ phone, code: c, role: 'CUSTOMER', language: lang }); setSession(r.token, r.user); router.replace('/'); } catch (e) { toast.error((e as Error).message); setCode(''); setBusy(false); } };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white md:flex md:flex-col md:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" /><div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-ai-500/40 blur-3xl" />
        <div className="relative flex items-center gap-2 text-2xl font-black"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-ink">B</span>BusyFrnd</div>
        <div className="relative"><h1 className="text-5xl font-black leading-[1.05] tracking-tight">Your whole<br />neighbourhood,<br />one tap away.</h1><p className="mt-5 max-w-sm text-lg text-white/70">Order from the shops you already trust — pickup in minutes or delivery to your door.</p></div>
        <div className="relative flex gap-2 text-4xl">🛒 🎂 📱 💇 🔧 💊</div>
      </div>
      <div className="flex flex-col justify-center px-6 py-10 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-xl font-black md:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">B</span>BusyFrnd</div>
          <AnimatePresence mode="wait" initial={false}>
            {!sent ? (
              <motion.div key="phone" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="flex flex-col gap-6">
                <div><h2 className="text-3xl font-black tracking-tight">{t('app.welcome')} 👋</h2><p className="mt-1 text-muted">Enter your mobile number to continue.</p></div>
                <Field label={t('auth.phone')}>
                  <div className="flex gap-2"><div className="grid h-12 place-items-center rounded-2xl border border-line bg-white px-4 font-bold">+91</div><Input inputMode="tel" autoFocus placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && phone.replace(/\D/g, '').length >= 10 && send()} /></div>
                </Field>
                <Button size="lg" block loading={busy} disabled={phone.replace(/\D/g, '').length < 10} onClick={send}>{t('auth.sendOtp')}</Button>
                <p className="text-xs text-muted">By continuing you agree to our Terms & Privacy Policy.</p>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="flex flex-col gap-6">
                <button onClick={() => { setSent(false); setCode(''); }} className="flex w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} />Change number</button>
                <div><h2 className="text-3xl font-black tracking-tight">{t('auth.otp')}</h2><p className="mt-1 text-muted">Sent to +91 {phone.replace(/\D/g, '').slice(-10)}</p></div>
                <OtpInput value={code} onChange={setCode} autoFocus onComplete={verify} />
                {hint && <Badge tone="violet" className="w-fit"><Sparkles size={12} />Demo mode · OTP is 123456</Badge>}
                <Button size="lg" block loading={busy} disabled={code.length < 6} onClick={() => verify()}>{t('auth.verify')}</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
