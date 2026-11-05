'use client';
import { use, useEffect, useState } from 'react';
import { rupees, type OrderDto } from '@busyfrnd/shared';
import { STATUS_COLOR, fmtDate, shortId, useApp } from '@busyfrnd/web-ui';

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, user, t } = useApp();
  const [o, setO] = useState<OrderDto | null>(null);
  useEffect(() => {
    if (!user) return;
    const load = () => api.orders.get(id).then(setO).catch(() => undefined);
    load(); const i = setInterval(load, 8000); return () => clearInterval(i);
  }, [api, user, id]);
  if (!o) return <div className="muted">{t('common.loading')}</div>;
  return (
    <div className="card col" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>{o.storeName} {shortId(o.id)}</h2><span className={`badge ${STATUS_COLOR[o.status]}`}>{o.status.replace(/_/g, ' ')}</span></div>
      <div className="muted small">{fmtDate(o.createdAt)} · {o.fulfillment === 'PICKUP' ? t('cart.pickup') : t('cart.delivery')}</div>
      {o.status === 'READY' && o.fulfillment === 'PICKUP' && <div className="card ok"><b>✅ {t('order.ready')}</b></div>}
      {o.status === 'PENDING_PAYMENT' && <button className="btn" onClick={async () => { const r = await api.orders.pay(o.id, location.href); location.href = r.checkoutUrl; }}>{t('cart.payNow')}</button>}
      {o.lines.map((l) => <div key={l.itemId} className="row" style={{ justifyContent: 'space-between' }}><span>{l.qty} × {l.name}</span><span>{rupees(l.qty * l.pricePaise)}</span></div>)}
      {o.fees.filter((f) => f.key !== 'subtotal').map((f) => <div key={f.key} className="row muted small" style={{ justifyContent: 'space-between' }}><span>{t('fee.' + f.key)}</span><span>{rupees(f.amount)}</span></div>)}
      <div className="row price" style={{ justifyContent: 'space-between' }}><span>{t('cart.total')}</span><span>{rupees(o.total)}</span></div>
      <div className="row small" style={{ justifyContent: 'space-between' }}><span>Paid</span><span>{rupees(o.paid)}</span></div>
      {o.due > 0 && <div className="row small" style={{ justifyContent: 'space-between' }}><span>{t('cart.payLater')}</span><b>{rupees(o.due)}</b></div>}
      {o.deliveryAddress && <div className="small">📍 {o.deliveryAddress}</div>}
    </div>
  );
}
