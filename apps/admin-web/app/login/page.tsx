'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button, Field, Input, toast, useApp } from '@busyfrnd/web-ui';

export default function Login() {
  const { api, setSession } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); try { const r = await api.auth.adminLogin(email, password); setSession(r.token, r.user); router.replace('/'); } catch (e) { toast.error((e as Error).message); setBusy(false); } };
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink p-4">
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-ai-500/40 blur-3xl" /><div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="relative flex w-full max-w-sm flex-col gap-5 rounded-[32px] bg-white p-8 shadow-lift">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white"><ShieldCheck /></span><div><h1 className="text-2xl font-black tracking-tight">Admin sign in</h1><p className="text-sm text-muted">BusyFrnd control center</p></div></div>
        <Field label="Email"><Input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@busyfrnd.app" /></Field>
        <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Button size="lg" block loading={busy} disabled={!email || !password}>Sign in</Button>
      </form>
    </div>
  );
}
