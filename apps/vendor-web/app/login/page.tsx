'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Mic, Sparkles, Store, TrendingUp } from 'lucide-react';
import { AiBadge, Badge, Button, Field, Input, OtpInput, toast, useApp } from '@busyfrnd/web-ui';

export default function Login() {
  const { api, setSession, t, lang } = useApp();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pCode, setPCode] = useState('');
  const [eCode, setECode] = useState('');
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const okPhone = phone.replace(/\D/g, '').length >= 10, okEmail = /.+@.+\..+/.test(email);

  const send = async () => { setBusy(true); try { const r = await api.auth.requestOtp({ phone, email, role: 'VENDOR' }); setHint(r.devHint ?? ''); setSent(true); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } };
  const verify = async () => { setBusy(true); try { const r = await api.auth.verifyOtp({ phone, email, code: pCode, emailCode: eCode, role: 'VENDOR', language: lang }); setSession(r.token, r.user); router.replace('/'); } catch (e) { toast.error((e as Error).message); setBusy(false); } };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-ai-500/50 blur-3xl" /><div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="relative flex items-center gap-2 text-2xl font-black"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-ink">B</span>BusyFrnd<Badge tone="orange">Vendor</Badge></div>
        <div className="relative max-w-lg">
          <AiBadge>Voice-first · English · हिन्दी · தமிழ்</AiBadge>
          <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight">Talk to your phone.<br />Get your shop online.</h1>
          <p className="mt-4 text-lg text-white/70">Tell our AI about your shop in your own language. We build the store, you start selling — free for 60 days.</p>
          <div className="mt-8 grid gap-3">{[[Mic, 'Set up by speaking — no typing needed'], [Store, 'A store layout that fits your business'], [TrendingUp, 'AI Buddy answers “how much did I sell today?”']].map(([I, s], i) => { const Icon = I as typeof Mic; return <div key={i} className="flex items-center gap-3 text-white/90"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><Icon size={18} /></span>{s as string}</div>; })}</div>
        </div>
        <div className="relative text-sm text-white/40">© BusyFrnd</div>
      </div>
      <div className="flex flex-col justify-center px-6 py-10 md:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 text-xl font-black lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">B</span>BusyFrnd Vendor</div>
          <AnimatePresence mode="wait" initial={false}>
            {!sent ? (
              <motion.div key="a" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="flex flex-col gap-5">
                <div><h2 className="text-3xl font-black tracking-tight">{t('app.welcome')} 🏪</h2><p className="mt-1 text-muted">Verify your mobile and email to start your 60-day free trial.</p></div>
                <Field label={t('auth.phone')}><div className="flex gap-2"><div className="grid h-12 place-items-center rounded-2xl border border-line bg-white px-4 font-bold">+91</div><Input inputMode="tel" autoFocus placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} /></div></Field>
                <Field label={t('auth.email')} hint="We’ll send order and billing updates here."><Input type="email" placeholder="you@shop.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Button size="lg" block loading={busy} disabled={!okPhone || !okEmail} onClick={send}>{t('auth.sendOtp')}</Button>
              </motion.div>
            ) : (
              <motion.div key="b" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="flex flex-col gap-5">
                <button onClick={() => { setSent(false); setPCode(''); setECode(''); }} className="flex w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} />Edit details</button>
                <div><h2 className="text-3xl font-black tracking-tight">Verify both</h2><p className="mt-1 text-muted">Enter the code sent by SMS and the code sent to your email.</p></div>
                <Field label={`SMS code · +91 ${phone.replace(/\D/g, '').slice(-10)}`}>{<div className="flex items-center gap-2"><OtpInput value={pCode} onChange={setPCode} autoFocus />{pCode.length === 6 && <Check className="shrink-0 text-ok" />}</div>}</Field>
                <Field label={`Email code · ${email}`}>{<div className="flex items-center gap-2"><OtpInput value={eCode} onChange={setECode} />{eCode.length === 6 && <Check className="shrink-0 text-ok" />}</div>}</Field>
                {hint && <Badge tone="violet" className="w-fit"><Sparkles size={12} />Demo mode · both codes are 123456</Badge>}
                <Button size="lg" block loading={busy} disabled={pCode.length < 6 || eCode.length < 6} onClick={verify}>{t('auth.verify')}</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
