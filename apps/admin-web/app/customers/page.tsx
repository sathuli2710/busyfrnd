'use client';
import { useEffect, useState } from 'react';
import { fmtDate, useApp } from '@busyfrnd/web-ui';

export default function Customers() {
  const { api, user } = useApp();
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { if (user) api.admin.customers().then(setRows); }, [api, user]);
  if (!rows) return <div className="muted">Loading…</div>;
  return <div className="card" style={{ overflowX: 'auto' }}><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Orders</th><th>Joined</th></tr></thead><tbody>
    {rows.map((c) => <tr key={c.id}><td>{c.name ?? '—'}</td><td>{c.phone}</td><td>{c.email ?? '—'}</td><td>{c._count.orders}</td><td>{fmtDate(c.createdAt)}</td></tr>)}</tbody></table></div>;
}
