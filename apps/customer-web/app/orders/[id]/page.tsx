'use client';
import { use, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { rupees, type OrderDto } from '@busyfrnd/shared';
import { Badge, Button, Card, OrderTimeline, ProductThumb, STATUS_LABEL, STATUS_TONE, Skeleton, fmtDate, shortId, useApp } from '@busyfrnd/web-ui';

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, user, t } = useApp();
  const [o, setO] = useState<OrderDto | null>(null);
  useEffect(() => {
    if (!user) return;
    const load = () => api.orders.get(id).then(setO).catch(() => undefined);
    load(); const i = setInterval(load, 8000); return () => clearInterval(i);
  }, [api, user, id]);
  if (!o) return <div className="mx-auto max-w-xl space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-muted">{shortId(o.id)} · {fmtDate(o.createdAt)}</p><h1 className="text-3xl font-black tracking-tight">{o.storeName}</h1></div><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge></div>
      {o.status === 'READY' && o.fulfillment === 'PICKUP' && <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-800"><div className="text-xl font-black">✅ {t('order.ready')}</div><div className="text-sm">Show order {shortId(o.id)} at the counter.</div></div>}
      {o.status === 'PENDING_PAYMENT' && <Card className="flex items-center justify-between gap-3"><span className="font-semibold">Payment not completed</span><Button variant="brand" onClick={async () => { const r = await api.orders.pay(o.id, location.href); location.href = r.checkoutUrl; }}>{t('cart.payNow')}</Button></Card>}
      {o.status !== 'PENDING_PAYMENT' && <Card><h2 className="mb-4 font-extrabold">{t('order.track')}</h2><OrderTimeline status={o.status} fulfillment={o.fulfillment} /></Card>}
      <Card className="flex flex-col gap-3">
        <h2 className="font-extrabold">Items</h2>
        {o.lines.map((l) => <div key={l.itemId} className="flex items-center gap-3"><ProductThumb id={l.itemId} name={l.name} kind={l.kind} size={44} /><div className="min-w-0 flex-1 truncate font-semibold">{l.qty} × {l.name}</div><div className="font-bold tabular-nums">{rupees(l.qty * l.pricePaise)}</div></div>)}
        <hr className="border-line" />
        {o.fees.filter((f) => f.key !== 'subtotal').map((f) => <div key={f.key} className="flex justify-between text-sm text-muted"><span>{t('fee.' + f.key)}</span><span className="tabular-nums">{rupees(f.amount)}</span></div>)}
        <div className="flex justify-between text-lg font-black"><span>{t('cart.total')}</span><span className="tabular-nums">{rupees(o.total)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted">Paid</span><span className="font-bold tabular-nums">{rupees(o.paid)}</span></div>
        {o.due > 0 && <div className="flex justify-between rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-600"><span>{t('cart.payLater')}</span><span className="tabular-nums">{rupees(o.due)}</span></div>}
      </Card>
      {o.deliveryAddress && <Card className="flex gap-3"><MapPin className="shrink-0 text-brand-500" /><div><div className="font-extrabold">Delivering to</div><div className="text-sm text-muted">{o.deliveryAddress}</div></div></Card>}
    </div>
  );
}
