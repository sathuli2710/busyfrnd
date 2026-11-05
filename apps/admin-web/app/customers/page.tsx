'use client';
import { useEffect, useState } from 'react';
import { Avatar, DataTable, Skeleton, fmtShort, useApp } from '@busyfrnd/web-ui';

export default function Customers() {
  const { api, user } = useApp();
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { if (user) api.admin.customers().then(setRows).catch(() => setRows([])); }, [api, user]);
  if (!rows) return <Skeleton className="h-64" />;
  return <DataTable rows={rows} rowKey={(c) => c.id} columns={[
    { header: 'Customer', cell: (c) => <div className="flex items-center gap-3"><Avatar name={c.name ?? c.phone} /><div><div className="font-extrabold">{c.name ?? 'Customer'}</div><div className="text-xs text-muted">{c.email ?? '—'}</div></div></div> },
    { header: 'Phone', cell: (c) => c.phone }, { header: 'Orders', cell: (c) => <span className="font-bold tabular-nums">{c._count.orders}</span> }, { header: 'Joined', cell: (c) => <span className="text-muted">{fmtShort(c.createdAt)}</span> },
  ]} />;
}
