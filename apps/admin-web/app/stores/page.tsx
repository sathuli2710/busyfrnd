'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { categoryMeta } from '@busyfrnd/shared';
import { Badge, DataTable, EmptyState, Input, Segmented, Skeleton, fmtShort, useApp, type Tone } from '@busyfrnd/web-ui';

const TONE: Record<string, Tone> = { DRAFT: 'gray', IN_REVIEW: 'orange', APPROVED: 'blue', REJECTED: 'red', PUBLISHED: 'green', SUSPENDED: 'red' };
const FILTERS = [['IN_REVIEW', 'In review'], ['PUBLISHED', 'Live'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected'], ['SUSPENDED', 'Suspended'], ['', 'All']] as const;

function List() {
  const { api, user } = useApp();
  const status = useSearchParams().get('status') ?? 'IN_REVIEW';
  const router = useRouter();
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => { if (user) { setRows(null); api.admin.stores(status || undefined).then(setRows).catch(() => setRows([])); } }, [api, user, status]);
  const shown = useMemo(() => (rows ?? []).filter((s) => !q || [s.name, s.vendor.user.phone, s.vendor.user.email, s.category].some((f) => f?.toLowerCase().includes(q.toLowerCase()))), [rows, q]);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar max-w-full overflow-x-auto"><Segmented value={status} onChange={(v) => router.push(`/stores?status=${v}`)} options={FILTERS.map(([v, l]) => ({ value: v, label: l }))} /></div>
        <div className="relative w-full sm:w-72"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stores or vendors" className="h-11 rounded-full pl-10" /></div>
      </div>
      {!rows ? <Skeleton className="h-64" /> : (
        <DataTable rows={shown} rowKey={(s) => s.id} onRowClick={(s) => router.push(`/stores/${s.id}`)} empty={<EmptyState emoji="🎉" title="Nothing to review" hint="You’re all caught up." />}
          columns={[
            { header: 'Store', cell: (s) => <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-canvas text-xl">{categoryMeta(s.category).emoji}</span><div><div className="font-extrabold">{s.name}</div><div className="text-xs text-muted">{s._count.items} items · {s.village ?? '—'}</div></div></div> },
            { header: 'Vendor', cell: (s) => <div><div className="font-semibold">{s.vendor.user.phone}</div><div className="text-xs text-muted">{s.vendor.user.email}</div></div> },
            { header: 'Channels', cell: (s) => <div className="flex gap-1">{s.wantWeb && <Badge tone="blue">Web</Badge>}{s.wantApp && <Badge tone="blue">App</Badge>}</div> },
            { header: 'Submitted', cell: (s) => <span className="text-muted">{s.submittedAt ? fmtShort(s.submittedAt) : '—'}</span> },
            { header: 'Status', cell: (s) => <Badge tone={TONE[s.status]}>{s.status.replace('_', ' ')}</Badge> },
          ]} />)}
    </div>
  );
}
export default function Stores() { return <Suspense fallback={<Skeleton className="h-64" />}><List /></Suspense>; }
