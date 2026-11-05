'use client';
import { useEffect, useState } from 'react';
import { rupees } from '@busyfrnd/shared';
import { Badge, DataTable, STATUS_LABEL, STATUS_TONE, Skeleton, fmtShort, shortId, useApp } from '@busyfrnd/web-ui';

export default function Orders() {
  const { api, user } = useApp();
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { if (user) api.admin.orders().then(setRows).catch(() => setRows([])); }, [api, user]);
  if (!rows) return <Skeleton className="h-64" />;
  return <DataTable rows={rows} rowKey={(o) => o.id} columns={[
    { header: 'Order', cell: (o) => <span className="font-extrabold">{shortId(o.id)}</span> }, { header: 'Store', cell: (o) => o.store.name }, { header: 'Customer', cell: (o) => <span className="text-muted">{o.user.phone}</span> },
    { header: 'Type', cell: (o) => <Badge>{o.fulfillment === 'PICKUP' ? 'Pickup' : 'Delivery'}</Badge> }, { header: 'Total', cell: (o) => <span className="font-bold tabular-nums">{rupees(o.total)}</span> },
    { header: 'Paid', cell: (o) => <span className="tabular-nums">{rupees(o.paid)}</span> }, { header: 'Status', cell: (o) => <Badge tone={STATUS_TONE[o.status as keyof typeof STATUS_TONE]}>{STATUS_LABEL[o.status as keyof typeof STATUS_LABEL]}</Badge> }, { header: 'Date', cell: (o) => <span className="text-muted">{fmtShort(o.createdAt)}</span> },
  ]} />;
}
