'use client';
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCircle2, Circle, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { categoryMeta } from '@busyfrnd/shared';
import { Badge, Button, Card, EmptyState, Skeleton, StoreView, Textarea, fmtShort, toast, useApp, type Tone } from '@busyfrnd/web-ui';

type Detail = Awaited<ReturnType<ReturnType<typeof useApp>['api']['admin']['store']>>;
const TONE: Record<string, Tone> = { IN_REVIEW: 'orange', APPROVED: 'blue', PUBLISHED: 'green', REJECTED: 'red', SUSPENDED: 'red', DRAFT: 'gray' };

export default function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, user } = useApp();
  const [d, setD] = useState<Detail | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.admin.store(id).then(setD), [api, id]);
  useEffect(() => { if (user) load().catch((e) => setErr(e.message)); }, [user, load]);
  if (err) return <EmptyState emoji="🏪" title="Couldn’t load store" hint={err} />;
  if (!d) return <div className="grid gap-6 lg:grid-cols-[1fr_380px]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;
  const page = d.page;
  const decide = async (decision: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REINSTATE') => {
    setBusy(true); try { await api.admin.review(id, decision, notes || undefined); setNotes(''); await load(); toast.success(`Store ${decision.toLowerCase()}${decision.endsWith('E') ? 'd' : 'ed'}`); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const checks = [
    ['Has a name and category', !!page.name && !!page.category], ['Has at least one item', page.items.length > 0], ['All items have a price', page.items.length > 0 && page.items.every((i) => i.pricePaise > 0)],
    ['Location is set', !!page.lat && !!page.lng], ['Pickup or delivery enabled', page.policy.offersPickup || page.policy.offersDelivery], ['Description present', !!page.description],
  ] as const;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/stores" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} />All reviews</Link><Badge tone={TONE[d.status]}>{d.status.replace('_', ' ')}</Badge></div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">Storefront preview <span className="text-sm font-medium text-muted">— exactly what customers see</span></h2>
          <div className="mx-auto w-full max-w-md rounded-[44px] border-[10px] border-ink bg-white p-1 shadow-lift"><div className="max-h-[78vh] overflow-y-auto rounded-[34px]"><StoreView page={page} /></div></div>
        </div>
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-2xl">{categoryMeta(page.category).emoji}</span><div className="min-w-0"><h1 className="truncate text-xl font-black">{page.name}</h1><p className="text-sm text-muted">{categoryMeta(page.category).label} · {page.village ?? '—'}</p></div></div>
            <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs font-bold uppercase text-muted">Vendor</dt><dd className="font-semibold">{d.vendor.phone}</dd></div><div><dt className="text-xs font-bold uppercase text-muted">Plan</dt><dd><Badge tone="violet">{d.vendor.plan}</Badge></dd></div>
              <div className="col-span-2"><dt className="text-xs font-bold uppercase text-muted">Email</dt><dd className="font-semibold">{d.vendor.email}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-muted">Wants</dt><dd className="flex gap-1">{d.wantWeb && <Badge tone="blue">Web</Badge>}{d.wantApp && <Badge tone="blue">App</Badge>}</dd></div><div><dt className="text-xs font-bold uppercase text-muted">Layout</dt><dd className="truncate font-semibold">{page.templateId}</dd></div></dl>
          </Card>
          <Card className="flex flex-col gap-2.5"><h3 className="font-extrabold">Review checklist</h3>
            {checks.map(([l, ok]) => <div key={l} className="flex items-center gap-2.5 text-sm font-medium">{ok ? <CheckCircle2 size={18} className="text-ok" /> : <Circle size={18} className="text-bad" />}<span className={ok ? '' : 'text-bad'}>{l}</span></div>)}</Card>
          <Card className="flex flex-col gap-3"><h3 className="font-extrabold">Decision</h3>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Feedback for the vendor (required when rejecting)" />
            <div className="flex flex-wrap gap-2">
              {d.status === 'IN_REVIEW' && <><Button variant="primary" loading={busy} onClick={() => decide('APPROVE')}><ShieldCheck size={16} />Approve</Button><Button variant="danger" disabled={busy || !notes.trim()} onClick={() => decide('REJECT')}><XCircle size={16} />Request changes</Button></>}
              {['PUBLISHED', 'APPROVED'].includes(d.status) && <Button variant="danger" loading={busy} onClick={() => decide('SUSPEND')}><ShieldAlert size={16} />Suspend</Button>}
              {d.status === 'SUSPENDED' && <Button loading={busy} onClick={() => decide('REINSTATE')}><Check size={16} />Reinstate</Button>}
              {!['IN_REVIEW', 'PUBLISHED', 'APPROVED', 'SUSPENDED'].includes(d.status) && <p className="text-sm text-muted">No actions available in this state.</p>}
            </div>
          </Card>
          {d.reviews.length > 0 && <Card className="flex flex-col gap-3"><h3 className="font-extrabold">History</h3>{d.reviews.map((r: any) => <div key={r.id} className="border-l-2 border-line pl-3 text-sm"><div className="font-bold">{r.decision}</div><div className="text-xs text-muted">{fmtShort(r.createdAt)}</div>{r.notes && <div className="mt-0.5">{r.notes}</div>}</div>)}</Card>}
        </div>
      </div>
    </div>
  );
}
