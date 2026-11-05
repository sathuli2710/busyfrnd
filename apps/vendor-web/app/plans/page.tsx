'use client';
import { useEffect, useState } from 'react';
import { PLANS, rupees, type PlanId, type Subscription } from '@busyfrnd/shared';
import { useApp } from '@busyfrnd/web-ui';

export default function Plans() {
  const { api, user } = useApp();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { if (user) api.vendor.overview().then((o) => setSub(o.subscription)); }, [api, user]);
  const buy = async (plan: 'PLUS' | 'PRO') => {
    try { const r = await api.vendor.subscribe(plan, `${location.origin}/plans`); location.href = r.checkoutUrl; } catch (e) { setErr((e as Error).message); }
  };
  return (
    <div className="col">
      {sub && <div className="card">Current plan: <b>{PLANS[sub.plan].name}</b>{sub.daysLeft != null && <> · {sub.daysLeft} days left</>} · AI tokens {sub.aiTokensUsed.toLocaleString()} / {sub.aiTokensLimit.toLocaleString()}</div>}
      {err && <div className="error">{err}</div>}
      <div className="grid">{(['TRIAL', 'PLUS', 'PRO'] as PlanId[]).map((id) => { const p = PLANS[id]; return (
        <div key={id} className="card col" style={{ outline: sub?.plan === id ? '3px solid var(--primary)' : 'none' }}>
          <h3 style={{ margin: 0 }}>{p.name}</h3>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{p.pricePaise ? `${rupees(p.pricePaise)}/mo` : 'Free'}</div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>{p.features.map((f) => <li key={f}>{f}</li>)}<li>{p.maxStores} published store(s)</li><li>{p.aiTokensPerPeriod.toLocaleString()} AI tokens</li></ul>
          {(id === 'PLUS' || id === 'PRO') && <button className="btn" onClick={() => buy(id)} disabled={sub?.plan === id}>{sub?.plan === id ? 'Current plan' : 'Choose ' + p.name}</button>}
        </div>); })}</div>
      <p className="muted small">Prices are placeholders and will be finalised before launch.</p>
    </div>
  );
}
