'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@busyfrnd/web-ui';

export default function Login() {
  const { api, setSession } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  return (
    <form className="card col" style={{ maxWidth: 380, margin: '60px auto' }} onSubmit={async (e) => { e.preventDefault(); setErr(''); try { const r = await api.auth.adminLogin(email, password); setSession(r.token, r.user); router.replace('/'); } catch (x) { setErr((x as Error).message); } }}>
      <h2 style={{ margin: 0 }}>Admin sign in</h2>
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {err && <div className="error">{err}</div>}
      <button className="btn big">Sign in</button>
    </form>
  );
}
