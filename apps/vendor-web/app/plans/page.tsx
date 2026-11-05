'use client';
import { useEffect, useState } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
import { PLANS, rupees, type PlanId, type Subscription } from '@busyfrnd/shared';
import { Badge, Button, Card, Ring, Skeleton, Stagger, StaggerItem, cn, toast, useApp } from '@busyfrnd/web-ui';

export default function Plans() {
  const { api, user } = useApp();
  const [sub, setSub] = useState<Subscription | null>(null);
  useEffect(() => { if (user) api.vendor.overview().then((o) => setSub(o.subscription)); }, [api, user]);
  const buy = async (plan: 'PLUS' | 'PRO') => { try { const r = await api.vendor.subscribe(plan, `${location.origin}/plans`); location.href = r.checkoutUrl; } catch (e) { toast.error((e as Error).message); } };
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-3xl font-black tracking-tight md:text-4xl">Plans</h1><p className="text-muted">Start free. Upgrade when you grow.</p></div>
      {!sub ? <Skeleton className="h-32" /> : (
        <Card className="flex flex-wrap items-center gap-6">
          <Ring value={sub.aiTokensUsed} max={sub.aiTokensLimit} size={88} label={`${Math.round((sub.aiTokensUsed / Math.max(1, sub.aiTokensLimit)) * 100)}%`} />
          <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-muted">Current plan</div><div className="text-2xl font-black">{PLANS[sub.plan].name}</div>{sub.daysLeft != null && <div className="font-semibold text-brand-600">{sub.daysLeft} days left in your free trial</div>}
            <div className="mt-1 text-sm text-muted">AI tokens used: {sub.aiTokensUsed.toLocaleString()} / {sub.aiTokensLimit.toLocaleString()}</div></div>
        </Card>)}
      <Stagger className="grid gap-5 md:grid-cols-3">
        {(['TRIAL', 'PLUS', 'PRO'] as PlanId[]).map((id) => { const p = PLANS[id]; const pro = id === 'PRO', current = sub?.plan === id; return (
          <StaggerItem key={id}>
            <div className={cn('relative flex h-full flex-col gap-5 rounded-[32px] border-2 p-6', pro ? 'border-transparent bg-ink text-white shadow-lift' : 'border-line bg-white shadow-soft', current && !pro && 'border-ink')}>
              {pro && <Badge tone="violet" className="absolute -top-3 left-6 bg-gradient-to-r from-ai-500 to-ai-pink !text-white"><Crown size={12} />Best value</Badge>}
              <div><div className={cn('text-sm font-bold', pro ? 'text-white/70' : 'text-muted')}>{p.name}</div><div className="mt-1 text-4xl font-black tracking-tight">{p.pricePaise ? rupees(p.pricePaise) : 'Free'}{p.pricePaise ? <span className={cn('text-base font-semibold', pro ? 'text-white/60' : 'text-muted')}>/mo</span> : null}</div></div>
              <ul className="flex flex-1 flex-col gap-2.5 text-sm font-medium">
                {[...p.features, `${p.maxStores} published store${p.maxStores > 1 ? 's' : ''}`, `${p.aiTokensPerPeriod.toLocaleString()} AI tokens`].map((f) => <li key={f} className="flex gap-2.5"><Check size={18} className={cn('shrink-0', pro ? 'text-ai-pink' : 'text-ok')} />{f}</li>)}
              </ul>
              {(id === 'PLUS' || id === 'PRO') ? <Button size="lg" variant={pro ? 'ai' : 'primary'} disabled={current} onClick={() => buy(id)}>{current ? 'Current plan' : <><Sparkles size={16} />Choose {p.name}</>}</Button> : <Button size="lg" variant="soft" disabled>{current ? 'Current plan' : 'Included'}</Button>}
            </div>
          </StaggerItem>); })}
      </Stagger>
      <p className="text-xs text-muted">Prices are placeholders and will be finalised before launch.</p>
    </div>
  );
}
