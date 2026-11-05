'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { rupees } from '@busyfrnd/shared';
import type { Dashboard, VendorStore } from '@busyfrnd/api-client';
import { useApp } from '@busyfrnd/web-ui';

const STATUS_BADGE: Record<string, string> = { DRAFT: '', IN_REVIEW: 'orange', APPROVED: 'blue', REJECTED: 'red', PUBLISHED: 'green', SUSPENDED: 'red' };

export default function Home() {
  const { api, user, t } = useApp();
  const [d, setD] = useState<Dashboard | null>(null);
  const [stores, setStores] = useState<VendorStore[] | null>(null);
  useEffect(() => { if (!user) return; api.vendor.dashboard().then(setD).catch(() => undefined); api.vendor.overview().then((o) => setStores(o.stores)); }, [api, user]);
  if (!stores) return <div className="muted">{t('common.loading')}</div>;
  const max = Math.max(1, ...(d?.series.map((s) => s.revenue) ?? [1]));
  return (
    <div className="col">
      {d?.subscription.plan === 'TRIAL' && <div className="card" style={{ background: '#fff7e6' }}>🎁 <b>{d.subscription.daysLeft}</b> {t('vendor.trialLeft')} · AI tokens {d.subscription.aiTokensUsed.toLocaleString()} / {d.subscription.aiTokensLimit.toLocaleString()} · <Link href="/plans" style={{ color: 'var(--primary)', fontWeight: 700 }}>{t('nav.plans')}</Link></div>}
      {d && <div className="grid">
        <div className="card"><div className="muted small">Today's sales</div><div style={{ fontSize: 28, fontWeight: 800 }}>₹{d.revenueToday.toLocaleString('en-IN')}</div><div className="small muted">{d.ordersToday} orders</div></div>
        <div className="card"><div className="muted small">Last 7 days</div><div style={{ fontSize: 28, fontWeight: 800 }}>₹{d.revenueLast7Days.toLocaleString('en-IN')}</div><div className="small muted">{d.ordersLast7Days} orders</div></div>
        <div className="card"><div className="muted small">Pending orders</div><div style={{ fontSize: 28, fontWeight: 800 }}>{d.pendingOrders}</div><Link href="/orders" className="small" style={{ color: 'var(--primary)' }}>Open orders →</Link></div>
      </div>}
      {d && <div className="card"><b>Revenue (7 days)</b><div className="bars" style={{ marginTop: 12 }}>{d.series.map((s) => <div key={s.date} title={`${s.date}: ${rupees(s.revenue * 100)}`} style={{ height: `${(s.revenue / max) * 100}%` }} />)}</div></div>}
      <div className="row" style={{ justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>{t('nav.store')}</h3><Link className="btn" href="/onboarding">＋ New store (voice setup)</Link></div>
      {!stores.length && <div className="card muted">You have no stores yet. Tap “New store” and just tell the AI about your shop.</div>}
      <div className="grid">{stores.map((s) => (
        <Link key={s.id} href={`/store/${s.id}`} className="card col" style={{ gap: 6 }}>
          <b>{s.name}</b><div className="row"><span className={`badge ${STATUS_BADGE[s.status]}`}>{s.status.replace('_', ' ')}</span>{s.publishWeb && <span className="badge blue">Web</span>}{s.publishApp && <span className="badge blue">App</span>}<span className="small muted">{s._count?.items ?? 0} items</span></div>
          {s.rejectionReason && <div className="small error">{s.rejectionReason}</div>}
        </Link>))}</div>
    </div>
  );
}
