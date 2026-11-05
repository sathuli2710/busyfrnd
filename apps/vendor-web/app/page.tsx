'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Clock, IndianRupee, Mic, PackagePlus, Plus, ShoppingBag, Sparkles } from 'lucide-react';
import { categoryMeta, fill, greeting, rupees } from '@busyfrnd/shared';
import type { Dashboard, VendorStore } from '@busyfrnd/api-client';
import { AiBadge, AreaChart, Badge, Button, Card, EmptyState, Skeleton, Stagger, StaggerItem, Stat, StoreCover, buttonStyles, cn, useApp, useCountUp } from '@busyfrnd/web-ui';
import { StatusSteps } from '../components/status-steps';

const TONE: Record<string, 'gray' | 'orange' | 'blue' | 'red' | 'green'> = { DRAFT: 'gray', IN_REVIEW: 'orange', APPROVED: 'blue', REJECTED: 'red', PUBLISHED: 'green', SUSPENDED: 'red' };

function Money({ v }: { v: number }) { const n = useCountUp(v); return <>₹{n.toLocaleString('en-IN')}</>; }

export default function Home() {
  const { api, user, t } = useApp();
  const [d, setD] = useState<Dashboard | null>(null);
  const [stores, setStores] = useState<VendorStore[] | null>(null);
  const [ix, setIx] = useState(0);
  useEffect(() => { if (!user) return; api.vendor.dashboard().then(setD).catch(() => undefined); api.vendor.overview().then((o) => setStores(o.stores)).catch(() => setStores([])); }, [api, user]);
  const insights = d?.insights ?? [];
  useEffect(() => { if (insights.length < 2) return; const i = setInterval(() => setIx((n) => (n + 1) % insights.length), 4500); return () => clearInterval(i); }, [insights.length]);
  const text = (k: string, p?: Record<string, string | number>) => fill(t(k), p ?? {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-muted">{t(`hello.${greeting()}`)}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</p><h1 className="text-3xl font-black tracking-tight md:text-4xl">{t('nav.dashboard')}</h1></div>
        <Link href="/onboarding" className={buttonStyles({ variant: 'ai' })}><Plus size={18} />New store · voice setup</Link>
      </div>

      {/* AI insights */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-ink to-[#1d1a3a] p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-ai-500/40 blur-3xl" />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center justify-between"><AiBadge>{t('insight.title')}</AiBadge>
            <div className="flex gap-1.5">{insights.map((_, i) => <button key={i} aria-label={`Insight ${i + 1}`} onClick={() => setIx(i)} className={cn('h-1.5 rounded-full transition-all', i === ix ? 'w-6 bg-white' : 'w-1.5 bg-white/30')} />)}</div></div>
          <div className="min-h-[3.5rem] md:min-h-[4.5rem]">
            <AnimatePresence mode="wait">
              <motion.p key={ix + (d ? 1 : 0)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="text-xl font-extrabold leading-snug md:text-3xl">
                {!d ? '…' : insights.length ? text(insights[ix % insights.length].key, insights[ix % insights.length].params) : '✨ ' + t('vendor.askBuddy')}
              </motion.p>
            </AnimatePresence>
          </div>
          <Link href="/assistant" className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur transition hover:bg-white/20"><Mic size={16} />{t('vendor.askBuddy')}<ArrowUpRight size={16} /></Link>
        </div>
      </div>

      {/* KPIs */}
      {!d ? <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div> : (
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StaggerItem><Stat label="Today’s sales" value={<Money v={d.revenueToday} />} hint={`${d.ordersToday} order${d.ordersToday === 1 ? "" : "s"}`} icon={<IndianRupee size={20} />} tone="green" /></StaggerItem>
          <StaggerItem><Stat label="Last 7 days" value={<Money v={d.revenueLast7Days} />} hint={`${d.ordersLast7Days} order${d.ordersLast7Days === 1 ? "" : "s"}`} icon={<ShoppingBag size={20} />} tone="blue" /></StaggerItem>
          <StaggerItem className="col-span-2 sm:col-span-1"><Link href="/orders"><Stat label="Needs attention" value={d.pendingOrders} hint="Open the order board →" icon={<Clock size={20} />} tone={d.pendingOrders ? 'orange' : 'gray'} /></Link></StaggerItem>
        </Stagger>
      )}

      {d && <Card className="flex flex-col gap-4"><div className="flex items-baseline justify-between"><h2 className="text-lg font-extrabold">Revenue · last 7 days</h2><span className="text-sm font-semibold text-muted">{rupees(d.revenueLast7Days * 100)}</span></div>
        <AreaChart data={d.series.map((s) => ({ label: new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short' }), value: s.revenue }))} format={(n) => `₹${n.toLocaleString('en-IN')}`} /></Card>}

      {/* Stores */}
      <div className="flex items-end justify-between"><h2 className="text-2xl font-black tracking-tight">{t('nav.store')}</h2></div>
      {!stores ? <Skeleton className="h-48" /> : !stores.length ? (
        <EmptyState emoji="🎙️" title="Let’s build your first store" hint="Just tell the AI what you sell — it will draft your store, items and prices in your language." action={<Link href="/onboarding" className={buttonStyles({ variant: 'ai', size: 'lg' })}><Sparkles size={18} />Start with your voice</Link>} />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2">{stores.map((s) => (
          <StaggerItem key={s.id}>
            <Link href={`/store/${s.id}`} className="group block overflow-hidden rounded-[28px] border border-line bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
              <StoreCover category={s.category} name={s.name} className="h-24"><span className="absolute left-4 top-4 z-10"><Badge tone={TONE[s.status]} className="bg-white/95">{s.status.replace('_', ' ')}</Badge></span></StoreCover>
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between"><div><h3 className="text-lg font-extrabold">{s.name}</h3><p className="text-sm text-muted">{categoryMeta(s.category).emoji} {categoryMeta(s.category).label} · {s._count?.items ?? 0} items</p></div>
                  <div className="flex gap-1">{s.publishWeb && <Badge tone="blue">Web</Badge>}{s.publishApp && <Badge tone="blue">App</Badge>}</div></div>
                <StatusSteps status={s.status} />
                {s.rejectionReason && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{s.rejectionReason}</p>}
              </div>
            </Link>
          </StaggerItem>))}</Stagger>
      )}
      {stores && stores.length > 0 && <div className="flex flex-wrap gap-3"><Link href={`/store/${stores[0].id}?tab=items`} className={buttonStyles({ variant: 'soft' })}><PackagePlus size={18} />Add products</Link></div>}
    </div>
  );
}
