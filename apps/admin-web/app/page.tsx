'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { rupees } from '@busyfrnd/shared';
import { useApp } from '@busyfrnd/web-ui';

export default function Overview() {
  const { api, user } = useApp();
  const [s, setS] = useState<Awaited<ReturnType<typeof api.admin.stats>> | null>(null);
  useEffect(() => { if (user?.role === 'ADMIN') api.admin.stats().then(setS); }, [api, user]);
  if (!s) return <div className="muted">Loading…</div>;
  const tile = (label: string, v: string | number, href?: string) => { const c = <div className="card"><div className="muted small">{label}</div><div style={{ fontSize: 28, fontWeight: 800 }}>{v}</div></div>; return href ? <Link key={label} href={href}>{c}</Link> : <div key={label}>{c}</div>; };
  return (
    <div className="grid">
      {tile('Stores awaiting review', s.inReview, '/stores?status=IN_REVIEW')}{tile('Published stores', s.published, '/stores?status=PUBLISHED')}{tile('All stores', s.stores, '/stores')}
      {tile('Vendors', s.vendors, '/vendors')}{tile('Customers', s.customers, '/customers')}{tile('Paid orders', s.orders, '/orders')}
      {tile('GMV', rupees(s.gmvPaise))}{tile('Subscription revenue', rupees(s.subscriptionRevenuePaise))}
    </div>
  );
}
