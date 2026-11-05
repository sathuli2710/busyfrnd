'use client';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bike, MapPin, Phone, Store } from 'lucide-react';
import { ORDER_TRANSITIONS, rupees, type OrderStatus } from '@busyfrnd/shared';
import type { VendorOrder } from '@busyfrnd/api-client';
import { Badge, Button, EmptyState, STATUS_LABEL, STATUS_TONE, Skeleton, cn, fmtShort, shortId, toast, useApp } from '@busyfrnd/web-ui';

const COLUMNS: Array<{ key: string; title: string; statuses: OrderStatus[]; dot: string }> = [
  { key: 'new', title: 'New', statuses: ['PLACED'], dot: 'bg-sky-500' },
  { key: 'prep', title: 'In progress', statuses: ['ACCEPTED', 'PREPARING'], dot: 'bg-brand-500' },
  { key: 'ready', title: 'Ready / on the way', statuses: ['READY', 'OUT_FOR_DELIVERY'], dot: 'bg-emerald-500' },
  { key: 'done', title: 'Done', statuses: ['COMPLETED', 'CANCELLED'], dot: 'bg-zinc-400' },
];
const NEXT: Partial<Record<OrderStatus, string>> = { PLACED: 'Accept', ACCEPTED: 'Start preparing', PREPARING: 'Mark ready', READY: 'Complete', OUT_FOR_DELIVERY: 'Delivered' };

export default function Orders() {
  const { api, user, t } = useApp();
  const [orders, setOrders] = useState<VendorOrder[] | null>(null);
  const [col, setCol] = useState('new');
  const load = useCallback(() => api.vendor.orders().then(setOrders).catch(() => setOrders([])), [api]);
  useEffect(() => { if (!user) return; load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [user, load]);
  const move = async (o: VendorOrder, s: OrderStatus) => { try { await api.vendor.setOrderStatus(o.id, s); toast.success(`Order ${shortId(o.id)} → ${STATUS_LABEL[s]}`); load(); } catch (e) { toast.error((e as Error).message); } };
  const primary = (o: VendorOrder): OrderStatus | null => {
    const allowed = ORDER_TRANSITIONS[o.status].filter((s) => s !== 'CANCELLED' && (s !== 'OUT_FOR_DELIVERY' || o.fulfillment === 'DELIVERY'));
    if (o.status === 'READY') return o.fulfillment === 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'COMPLETED';
    return allowed[0] ?? null;
  };
  const rows = (c: (typeof COLUMNS)[number]) => (orders ?? []).filter((o) => c.statuses.includes(o.status));
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-3xl font-black tracking-tight md:text-4xl">{t('nav.orders')}</h1><p className="text-muted">Live — updates every few seconds.</p></div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 lg:hidden">{COLUMNS.map((c) => <button key={c.key} onClick={() => setCol(c.key)} className={cn('flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold', col === c.key ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>{c.title}<span className={cn('rounded-full px-2 text-xs', col === c.key ? 'bg-white/20' : 'bg-black/5')}>{rows(c).length}</span></button>)}</div>
      {!orders ? <div className="grid gap-4 lg:grid-cols-4"><Skeleton className="h-64" /><Skeleton className="h-64" /></div> : !orders.length ? <EmptyState emoji="🧾" title="No orders yet" hint="When a customer orders, it appears here instantly." /> : (
        <div className="grid items-start gap-4 lg:grid-cols-4">
          {COLUMNS.map((c) => (
            <section key={c.key} className={cn('flex flex-col gap-3 rounded-[28px] bg-black/[0.035] p-3', col !== c.key && 'hidden lg:flex')}>
              <div className="flex items-center gap-2 px-2 pt-1 text-sm font-extrabold"><span className={cn('h-2.5 w-2.5 rounded-full', c.dot)} />{c.title}<span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs">{rows(c).length}</span></div>
              <AnimatePresence initial={false}>
                {rows(c).map((o) => { const nx = primary(o); return (
                  <motion.article layout key={o.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-soft">
                    <div className="flex items-center justify-between"><span className="font-extrabold">{shortId(o.id)}</span><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge></div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted">{o.fulfillment === 'PICKUP' ? <Store size={14} /> : <Bike size={14} />}{o.fulfillment === 'PICKUP' ? 'Pickup' : 'Delivery'} · {fmtShort(o.createdAt)}</div>
                    <ul className="flex flex-col gap-1 text-sm">{o.lines.map((l) => <li key={l.itemId} className="flex justify-between gap-2"><span className="truncate">{l.qty} × {l.name}</span><span className="font-semibold tabular-nums">{rupees(l.qty * l.pricePaise)}</span></li>)}</ul>
                    {o.deliveryAddress && <div className="flex gap-2 text-xs text-muted"><MapPin size={14} className="shrink-0" />{o.deliveryAddress}</div>}
                    {o.customer.phone && <a href={`tel:${o.customer.phone}`} className="flex items-center gap-2 text-xs font-semibold text-sky-700"><Phone size={14} />{o.customer.phone}</a>}
                    <div className="flex items-center justify-between border-t border-line pt-3"><div><div className="font-black tabular-nums">{rupees(o.total)}</div>{o.due > 0 && <div className="text-xs font-bold text-brand-600">Collect {rupees(o.due)}</div>}</div></div>
                    {(nx || ORDER_TRANSITIONS[o.status].includes('CANCELLED')) && <div className="flex gap-2">{nx && <Button size="sm" variant={o.status === 'PLACED' ? 'brand' : 'primary'} className="flex-1" onClick={() => move(o, nx)}>{NEXT[o.status]}</Button>}{ORDER_TRANSITIONS[o.status].includes('CANCELLED') && <Button size="sm" variant="soft" onClick={() => move(o, 'CANCELLED')}>Cancel</Button>}</div>}
                  </motion.article>); })}
              </AnimatePresence>
              {!rows(c).length && <p className="py-8 text-center text-sm font-medium text-muted">Nothing here</p>}
            </section>))}
        </div>)}
    </div>
  );
}
