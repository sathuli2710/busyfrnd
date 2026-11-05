'use client';
import { useEffect, useState } from 'react';
import { PLANS, type PlanId } from '@busyfrnd/shared';
import { Avatar, Badge, DataTable, Select, Skeleton, fmtShort, toast, useApp } from '@busyfrnd/web-ui';

export default function Vendors() {
  const { api, user } = useApp();
  const [rows, setRows] = useState<any[] | null>(null);
  const load = () => api.admin.vendors().then(setRows).catch(() => setRows([]));
  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);
  if (!rows) return <Skeleton className="h-64" />;
  return (
    <DataTable rows={rows} rowKey={(v) => v.id} columns={[
      { header: 'Vendor', cell: (v) => <div className="flex items-center gap-3"><Avatar name={v.user.name ?? v.user.phone} /><div><div className="font-extrabold">{v.user.name ?? v.user.phone}</div><div className="text-xs text-muted">{v.user.email}</div></div></div> },
      { header: 'Stores', cell: (v) => <span className="font-bold tabular-nums">{v._count.stores}</span> },
      { header: 'Trial ends', cell: (v) => <span className="text-muted">{fmtShort(v.trialEndsAt)}</span> },
      { header: 'AI tokens', cell: (v) => <span className="tabular-nums">{v.aiTokensUsed.toLocaleString()}</span> },
      { header: 'Plan', cell: (v) => <Select value={v.plan} className="h-10 w-36" onChange={(e) => api.admin.setPlan(v.id, e.target.value as PlanId).then(() => { toast.success('Plan updated'); load(); })}>{(['TRIAL', 'FREE', 'PLUS', 'PRO'] as PlanId[]).map((p) => <option key={p} value={p}>{PLANS[p].name.split(' ')[0]}</option>)}</Select> },
      { header: 'Status', cell: (v) => <Badge tone={v.plan === 'PRO' ? 'violet' : v.plan === 'PLUS' ? 'blue' : 'gray'}>{v.plan}</Badge> },
    ]} />
  );
}
