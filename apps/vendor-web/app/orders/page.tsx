'use client';
import { useEffect, useState } from 'react';
import { ORDER_TRANSITIONS, rupees, type OrderStatus } from '@busyfrnd/shared';
import type { VendorOrder } from '@busyfrnd/api-client';
import { STATUS_COLOR, fmtDate, shortId, useApp } from '@busyfrnd/web-ui';

export default function Orders() {
  const { api, user, t } = useApp();
  const [orders, setOrders] = useState<VendorOrder[] | null>(null);
  const [err, setErr] = useState('');
  const load = () => api.vendor.orders().then(setOrders);
  useEffect(() => { if (!user) return; load(); const i = setInterval(load, 10_000); return () => clearInterval(i); /* eslint-disable-next-line */ }, [user]);
  if (!orders) return <div className="muted">{t('common.loading')}</div>;
  const move = async (id: string, s: OrderStatus) => { setErr(''); try { await api.vendor.setOrderStatus(id, s); load(); } catch (e) { setErr((e as Error).message); } };
  return (
    <div className="col">
      {err && <div className="error">{err}</div>}
      {!orders.length && <div className="card muted">No orders yet.</div>}
      {orders.map((o) => (
        <div key={o.id} className="card col">
          <div className="row" style={{ justifyContent: 'space-between' }}><b>{shortId(o.id)} · {o.storeName}</b><span className={`badge ${STATUS_COLOR[o.status]}`}>{o.status.replace(/_/g, ' ')}</span></div>
          <div className="small muted">{fmtDate(o.createdAt)} · {o.fulfillment} · {o.customer.phone}</div>
          {o.lines.map((l) => <div key={l.itemId} className="small">{l.qty} × {l.name}</div>)}
          {o.deliveryAddress && <div className="small">📍 {o.deliveryAddress}</div>}
          <div className="row" style={{ justifyContent: 'space-between' }}><span><b>{rupees(o.total)}</b> · paid {rupees(o.paid)}{o.due > 0 && <b className="error"> · collect {rupees(o.due)}</b>}</span>
            <span className="row">{ORDER_TRANSITIONS[o.status].filter((s) => s !== 'OUT_FOR_DELIVERY' || o.fulfillment === 'DELIVERY').map((s) => <button key={s} className={`btn ${s === 'CANCELLED' ? 'danger' : ''}`} onClick={() => move(o.id, s)}>{s.replace(/_/g, ' ')}</button>)}</span></div>
        </div>))}
    </div>
  );
}
