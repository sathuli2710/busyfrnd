'use client';
import { useEffect, useState } from 'react';
import { rupees } from '@busyfrnd/shared';
import { fmtDate, shortId, useApp } from '@busyfrnd/web-ui';

export default function Orders() {
  const { api, user } = useApp();
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { if (user) api.admin.orders().then(setRows); }, [api, user]);
  if (!rows) return <div className="muted">Loading…</div>;
  return <div className="card" style={{ overflowX: 'auto' }}><table><thead><tr><th>Order</th><th>Store</th><th>Customer</th><th>Type</th><th>Total</th><th>Paid</th><th>Status</th><th>Date</th></tr></thead><tbody>
    {rows.map((o) => <tr key={o.id}><td>{shortId(o.id)}</td><td>{o.store.name}</td><td>{o.user.phone}</td><td>{o.fulfillment}</td><td>{rupees(o.total)}</td><td>{rupees(o.paid)}</td><td><span className="badge">{o.status}</span></td><td>{fmtDate(o.createdAt)}</td></tr>)}</tbody></table></div>;
}
