'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, IndianRupee, Package, ShieldCheck, Store, Users, Wallet } from 'lucide-react';
import { rupees } from '@busyfrnd/shared';
import { AreaChart, Badge, Card, Skeleton, Stagger, StaggerItem, Stat, useApp, useCountUp } from '@busyfrnd/web-ui';

const N = ({ v }: { v: number }) => <>{useCountUp(v).toLocaleString('en-IN')}</>;

export default function Overview() {
  const { api, user } = useApp();
  const [s, setS] = useState<Awaited<ReturnType<typeof api.admin.stats>> | null>(null);
  useEffect(() => { if (user?.role === 'ADMIN') api.admin.stats().then(setS).catch(() => undefined); }, [api, user]);
  if (!s) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>;
  const g = s.series.reduce((n, d) => n + d.gmvPaise, 0), o = s.series.reduce((n, d) => n + d.orders, 0);
  const label = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return (
    <div className="flex flex-col gap-6">
      {s.inReview > 0 && (
        <Link href="/stores?status=IN_REVIEW" className="group flex items-center justify-between gap-4 rounded-[28px] bg-gradient-to-r from-ink to-[#25213f] p-5 text-white shadow-lift transition hover:-translate-y-0.5">
          <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ShieldCheck /></span><div><div className="text-lg font-extrabold">{s.inReview} store{s.inReview > 1 ? 's' : ''} waiting for review</div><div className="text-sm text-white/60">Approve or send feedback so vendors can go live.</div></div></div>
          <ArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Link>)}
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem><Stat label="Gross merchandise value" value={<>₹<N v={Math.round(s.gmvPaise / 100)} /></>} hint="All paid orders" icon={<IndianRupee size={20} />} tone="green" /></StaggerItem>
        <StaggerItem><Stat label="Paid orders" value={<N v={s.orders} />} hint={`${o} in the last 14 days`} icon={<Package size={20} />} tone="blue" /></StaggerItem>
        <StaggerItem><Stat label="Live stores" value={<N v={s.published} />} hint={`${s.stores} total · ${s.vendors} vendors`} icon={<Store size={20} />} tone="orange" /></StaggerItem>
        <StaggerItem><Stat label="Customers" value={<N v={s.customers} />} hint={`Subscriptions ${rupees(s.subscriptionRevenuePaise)}`} icon={<Users size={20} />} tone="violet" /></StaggerItem>
      </Stagger>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4"><div className="flex items-baseline justify-between"><h2 className="text-lg font-extrabold">GMV · 14 days</h2><Badge tone="green">{rupees(g)}</Badge></div>
          <AreaChart data={s.series.map((d) => ({ label: label(d.date).split(' ')[0], value: Math.round(d.gmvPaise / 100) }))} color="#05944F" format={(n) => `₹${n.toLocaleString('en-IN')}`} /></Card>
        <Card className="flex flex-col gap-4"><div className="flex items-baseline justify-between"><h2 className="text-lg font-extrabold">Orders · 14 days</h2><Badge tone="blue">{o} order{o === 1 ? "" : "s"}</Badge></div>
          <AreaChart data={s.series.map((d) => ({ label: label(d.date).split(' ')[0], value: d.orders }))} color="#6C5CE7" /></Card>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Wallet size={20} /></span><div><div className="font-extrabold">Subscription revenue</div><div className="text-sm text-muted">Plus and Pro plans paid by vendors</div></div></div><div className="text-3xl font-black tabular-nums">{rupees(s.subscriptionRevenuePaise)}</div></Card>
    </div>
  );
}
