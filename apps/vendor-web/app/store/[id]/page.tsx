'use client';
import { Suspense, use, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Globe, Lock, Plus, Rocket, Smartphone, Trash2 } from 'lucide-react';
import { categoryMeta, rupees, type Item, type LayoutTemplate } from '@busyfrnd/shared';
import type { VendorStorePage } from '@busyfrnd/api-client';
import { Badge, Button, Card, EmptyState, Field, Input, ProductThumb, Skeleton, StoreCover, StoreView, Stagger, StaggerItem, Switch, SwitchRow, Tabs, cn, toast, useApp } from '@busyfrnd/web-ui';
import { StatusSteps } from '../../../components/status-steps';
import { LayoutThumb } from '../../../components/layout-thumb';

type Tab = 'items' | 'layout' | 'fees' | 'publish' | 'preview';
const rs = (p: number | null | undefined) => (p == null ? '' : String(p / 100));
const paise = (v: string) => (v.trim() === '' ? null : Math.round(+v * 100));

function Editor({ id }: { id: string }) {
  const { api, t } = useApp();
  const q = useSearchParams();
  const [page, setPage] = useState<VendorStorePage | null>(null);
  const [layouts, setLayouts] = useState<Array<LayoutTemplate & { locked: boolean }>>([]);
  const [tab, setTab] = useState<Tab>((q.get('tab') as Tab) || 'items');
  const [web, setWeb] = useState(true);
  const [app, setApp] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(() => api.vendor.preview(id).then((p) => { setPage(p); setWeb(p.wantWeb); setApp(p.wantApp); }), [api, id]);
  useEffect(() => { load().catch((e) => setErr(e.message)); api.vendor.layouts().then(setLayouts).catch(() => undefined); }, [api, load]);
  const act = async (fn: () => Promise<unknown>, ok = 'Saved') => { try { await fn(); await load(); toast.success(ok); } catch (e) { toast.error((e as Error).message); } };

  if (err) return <EmptyState emoji="🏪" title="Couldn’t load this store" hint={err} />;
  if (!page) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;
  const live = page.status === 'PUBLISHED';
  const cm = categoryMeta(page.category);

  return (
    <div className="flex flex-col gap-5">
      <StoreCover category={page.category} name={page.name} className="rounded-[32px]">
        <div className="relative z-10 flex flex-col gap-4 p-6 text-white md:p-8">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-white/80">{cm.emoji} {cm.label}</p><h1 className="text-3xl font-black tracking-tight md:text-4xl">{page.name}</h1></div>
            <div className="flex gap-1.5">{page.publishWeb && <Badge className="bg-white/90 !text-ink"><Globe size={12} />Web</Badge>}{page.publishApp && <Badge className="bg-white/90 !text-ink"><Smartphone size={12} />App</Badge>}</div></div>
          <div className="rounded-3xl bg-white p-4 text-ink"><StatusSteps status={page.status} /></div>
        </div>
      </StoreCover>
      {page.rejectionReason && <div className="rounded-3xl bg-rose-50 p-5 text-rose-700 ring-1 ring-rose-100"><div className="font-extrabold">Admin feedback</div><p className="text-sm font-medium">{page.rejectionReason}</p></div>}

      <Tabs value={tab} onChange={setTab} items={[{ value: 'items', label: 'Items' }, { value: 'layout', label: 'Layout' }, { value: 'fees', label: 'Fees & delivery' }, { value: 'publish', label: 'Publish' }, { value: 'preview', label: 'Preview' }]} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {tab === 'items' && <ItemsTab storeId={id} category={page.category} onChange={load} />}

          {tab === 'layout' && (
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{layouts.map((l) => (
              <StaggerItem key={l.id}>
                <button disabled={l.locked} onClick={() => act(() => api.vendor.updateStore(id, { templateId: l.id }), 'Layout applied')} className={cn('relative w-full rounded-[28px] border-2 bg-white p-3 text-left transition active:scale-[0.98] disabled:cursor-not-allowed', page.templateId === l.id ? 'border-ink shadow-lift' : 'border-line hover:border-ink/30')}>
                  <div className={l.locked ? 'opacity-50' : ''}><LayoutThumb tpl={l} /></div>
                  <div className="mt-3 flex items-center justify-between gap-2 px-1"><span className="truncate font-bold">{l.name}</span>
                    {page.templateId === l.id ? <Badge tone="dark"><Check size={12} />Active</Badge> : <Badge tone={l.tier === 'BASIC' ? 'green' : l.tier === 'PLUS' ? 'blue' : 'violet'}>{l.locked ? <Lock size={11} /> : null}{l.tier}</Badge>}</div>
                </button>
              </StaggerItem>))}</Stagger>
          )}

          {tab === 'fees' && <FeesForm key={JSON.stringify(page.policy) + page.phone} page={page} onSave={(b) => act(() => api.vendor.updateStore(id, b))} t={t} />}

          {tab === 'publish' && (
            <Card className="mx-auto flex max-w-xl flex-col gap-5">
              <div><h2 className="text-xl font-black">Where do you want to sell?</h2><p className="text-sm text-muted">Pick the channels. Your plan decides what’s available.</p></div>
              <SwitchRow label="Website" hint="Customers can order on the web" checked={web} onChange={setWeb} />
              <SwitchRow label="Customer mobile app" hint="Listed in the BusyFrnd app" checked={app} onChange={setApp} />
              {['DRAFT', 'REJECTED'].includes(page.status) && <Button size="lg" variant="ai" onClick={() => act(() => api.vendor.submit(id, web, app), 'Sent to admin for review')}><Rocket size={18} />{t('vendor.publish')}</Button>}
              {page.status === 'IN_REVIEW' && <div className="rounded-2xl bg-brand-50 p-4 text-sm font-semibold text-brand-600">⏳ Waiting for admin review. We’ll notify you as soon as it’s approved.</div>}
              {['APPROVED', 'PUBLISHED'].includes(page.status) && <div className="flex flex-wrap gap-3"><Button size="lg" variant="brand" onClick={() => act(() => api.vendor.publish(id, web, app), 'Published! 🎉')}><Rocket size={18} />{live ? 'Update channels' : 'Publish now'}</Button>{live && <Button size="lg" variant="soft" onClick={() => act(() => api.vendor.unpublish(id), 'Taken offline')}>Unpublish</Button>}</div>}
              {page.status === 'SUSPENDED' && <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">This store is suspended. Please contact support.</div>}
            </Card>
          )}

          {tab === 'preview' && <div className="mx-auto max-w-xl rounded-[40px] border-[8px] border-ink bg-white p-1 shadow-lift"><div className="max-h-[75vh] overflow-y-auto rounded-[32px]"><StoreView page={page} t={t} /></div></div>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function StoreAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Suspense fallback={<Skeleton className="h-64" />}><Editor id={id} /></Suspense>;
}

function FeesForm({ page, onSave, t }: { page: VendorStorePage; onSave: (b: Record<string, unknown>) => void; t: (k: string) => string }) {
  const p = page.policy;
  const [f, setF] = useState({ offersPickup: p.offersPickup, offersDelivery: p.offersDelivery, deliveryFee: rs(p.deliveryFee), lowOrderThreshold: rs(p.lowOrderThreshold), lowOrderDeliveryFee: rs(p.lowOrderDeliveryFee), freeDeliveryAbove: rs(p.freeDeliveryAbove), platformFee: rs(p.platformFee), handlingFee: rs(p.handlingFee), visitingFee: rs(p.visitingFee), partialPaymentEnabled: p.partialPaymentEnabled, partialPercent: String(p.partialPercent), phone: page.phone ?? '', address: page.address ?? '', hours: page.hours ?? '' });
  const set = (k: keyof typeof f, v: string | boolean) => setF({ ...f, [k]: v });
  const money = (k: keyof typeof f, label: string, hint?: string) => <Field label={label} hint={hint}><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted">₹</span><Input type="number" min={0} value={f[k] as string} onChange={(e) => set(k, e.target.value)} className="pl-8" /></div></Field>;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Card className="flex flex-col gap-4"><h2 className="text-lg font-black">Fulfilment</h2>
        <SwitchRow label="Customer pickup" hint="Pickup customers never pay a delivery fee" checked={f.offersPickup} onChange={(v) => (v || f.offersDelivery) && set('offersPickup', v)} />
        <SwitchRow label="Home delivery" checked={f.offersDelivery} onChange={(v) => (v || f.offersPickup) && set('offersDelivery', v)} />
        <p className="text-xs text-muted">At least one must stay enabled.</p>
        <AnimatePresence initial={false}>{f.offersDelivery && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid gap-4 overflow-hidden sm:grid-cols-2">
            {money('deliveryFee', 'Delivery fee')}{money('freeDeliveryAbove', 'Free delivery above', 'Leave empty for none')}
            {money('lowOrderThreshold', 'Small-order limit', 'e.g. ₹199')}{money('lowOrderDeliveryFee', 'Fee below that limit', 'e.g. ₹50')}
          </motion.div>)}</AnimatePresence>
      </Card>
      <Card className="flex flex-col gap-4"><h2 className="text-lg font-black">Charges</h2><div className="grid gap-4 sm:grid-cols-3">{money('platformFee', 'Platform fee')}{money('handlingFee', 'Handling charge')}{money('visitingFee', 'Visiting charge', 'Services only')}</div></Card>
      <Card className="flex flex-col gap-4"><h2 className="text-lg font-black">Payments</h2>
        <SwitchRow label="Allow part payment" hint="Full payment is always available" checked={f.partialPaymentEnabled} onChange={(v) => set('partialPaymentEnabled', v)} />
        <AnimatePresence initial={false}>{f.partialPaymentEnabled && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><Field label={`Customers pay ${f.partialPercent}% upfront`}><input type="range" min={10} max={90} step={5} value={f.partialPercent} onChange={(e) => set('partialPercent', e.target.value)} className="h-2 w-full accent-ink" /></Field></motion.div>}</AnimatePresence></Card>
      <Card className="flex flex-col gap-4"><h2 className="text-lg font-black">Shop details</h2><Field label="Phone"><Input value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field><Field label="Address"><Input value={f.address} onChange={(e) => set('address', e.target.value)} /></Field><Field label="Opening hours"><Input value={f.hours} onChange={(e) => set('hours', e.target.value)} placeholder="9 AM – 9 PM" /></Field></Card>
      <Button size="lg" onClick={() => onSave({ offersPickup: f.offersPickup, offersDelivery: f.offersDelivery, deliveryFee: paise(f.deliveryFee) ?? 0, lowOrderThreshold: paise(f.lowOrderThreshold), lowOrderDeliveryFee: paise(f.lowOrderDeliveryFee), freeDeliveryAbove: paise(f.freeDeliveryAbove), platformFee: paise(f.platformFee) ?? 0, handlingFee: paise(f.handlingFee) ?? 0, visitingFee: paise(f.visitingFee) ?? 0, partialPaymentEnabled: f.partialPaymentEnabled, partialPercent: +f.partialPercent || 30, phone: f.phone, address: f.address, hours: f.hours })}>{t('common.save')}</Button>
    </div>
  );
}

function ItemsTab({ storeId, category, onChange }: { storeId: string; category: string; onChange: () => void }) {
  const { api } = useApp();
  const [items, setItems] = useState<Item[] | null>(null);
  const [nm, setNm] = useState('');
  const [pr, setPr] = useState('');
  const [kind, setKind] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const load = useCallback(() => api.vendor.items(storeId).then(setItems), [api, storeId]);
  useEffect(() => { load(); }, [load]);
  const add = async () => { try { await api.vendor.addItems(storeId, [{ name: nm, pricePaise: Math.round(+pr * 100), kind }]); setNm(''); setPr(''); await load(); onChange(); toast.success('Item added'); } catch (e) { toast.error((e as Error).message); } };
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-end gap-3"><Field label="New item" className="min-w-48 flex-1"><Input value={nm} onChange={(e) => setNm(e.target.value)} placeholder="e.g. Chocolate cake" /></Field>
        <Field label="Price" className="w-32"><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted">₹</span><Input type="number" value={pr} onChange={(e) => setPr(e.target.value)} className="pl-8" /></div></Field>
        <div className="flex h-12 rounded-full bg-black/5 p-1">{(['PRODUCT', 'SERVICE'] as const).map((k) => <button key={k} onClick={() => setKind(k)} className={cn('rounded-full px-4 text-sm font-bold', kind === k ? 'bg-white shadow-soft' : 'text-muted')}>{k === 'PRODUCT' ? 'Product' : 'Service'}</button>)}</div>
        <Button size="lg" disabled={!nm || !pr} onClick={add}><Plus size={18} />Add</Button></Card>
      {!items ? <Skeleton className="h-40" /> : !items.length ? <EmptyState emoji="📦" title="No items yet" hint="Add your first product or service above." /> : (
        <Stagger className="flex flex-col gap-3">{items.map((i) => (
          <StaggerItem key={i.id}><Card className="flex items-center gap-4 p-4">
            <ProductThumb id={i.id} name={i.name} category={category} kind={i.kind} size={56} />
            <div className="min-w-0 flex-1"><div className="truncate font-bold">{i.name}</div><div className="flex items-center gap-2 text-sm text-muted"><Badge>{i.kind === 'SERVICE' ? 'Service' : 'Product'}</Badge><span className="tabular-nums">{rupees(i.pricePaise)}</span></div></div>
            <div className="relative hidden w-28 sm:block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">₹</span><Input type="number" defaultValue={i.pricePaise / 100} className="h-10 pl-7" aria-label="Price" onBlur={(e) => { const v = Math.round(+e.target.value * 100); if (v !== i.pricePaise) api.vendor.updateItem(storeId, i.id, { pricePaise: v }).then(load).then(() => toast.success('Price updated')); }} /></div>
            <div className="flex flex-col items-center gap-1"><Switch checked={i.inStock} label="In stock" onChange={(v) => api.vendor.updateItem(storeId, i.id, { inStock: v }).then(load)} /><span className="text-[10px] font-bold uppercase text-muted">{i.inStock ? 'In stock' : 'Sold out'}</span></div>
            <Button variant="ghost" size="iconSm" aria-label="Remove" onClick={() => api.vendor.removeItem(storeId, i.id).then(() => { load(); onChange(); })}><Trash2 size={16} /></Button>
          </Card></StaggerItem>))}</Stagger>)}
    </div>
  );
}
