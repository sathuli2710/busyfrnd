'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { rupees, type OrderDto } from '@busyfrnd/shared';
import { STATUS_COLOR, fmtDate, shortId, useApp } from '@busyfrnd/web-ui';

export default function Orders() {
  const { api, user, t } = useApp();
  const [orders, setOrders] = useState<OrderDto[] | null>(null);
  useEffect(() => { if (user) api.orders.list().then(setOrders); }, [api, user]);
  if (!orders) return <div className="muted">{t('common.loading')}</div>;
  if (!orders.length) return <div className="card muted">No orders yet.</div>;
  return (
    <div className="col">{orders.map((o) => (
      <Link key={o.id} href={`/orders/${o.id}`} className="card row" style={{ justifyContent: 'space-between' }}>
        <div><b>{o.storeName}</b> <span className="muted small">{shortId(o.id)} · {fmtDate(o.createdAt)}</span></div>
        <div className="row"><span className={`badge ${STATUS_COLOR[o.status]}`}>{o.status.replace(/_/g, ' ')}</span><b>{rupees(o.total)}</b></div>
      </Link>))}</div>
  );
}
