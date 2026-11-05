'use client';
import { use, useCallback, useEffect, useState } from 'react';
import { StoreView, fmtDate, useApp } from '@busyfrnd/web-ui';

type Detail = Awaited<ReturnType<ReturnType<typeof useApp>['api']['admin']['store']>>;

export default function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, user } = useApp();
  const [d, setD] = useState<Detail | null>(null);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const load = useCallback(() => api.admin.store(id).then(setD), [api, id]);
  useEffect(() => { if (user) load().catch((e) => setMsg(e.message)); }, [user, load]);
  if (!d) return <div className="muted">{msg || 'Loading…'}</div>;
  const decide = async (decision: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REINSTATE') => {
    setMsg(''); try { await api.admin.review(id, decision, notes || undefined); setNotes(''); await load(); setMsg(`Done: ${decision}`); } catch (e) { setMsg((e as Error).message); }
  };
  const page = d.page;
  return (
    <div className="col">
      <div className="row" style={{ justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>{page.name}</h2><span className="badge orange">{d.status}</span></div>
      <div className="card small">
        Vendor: {d.vendor.name ?? '—'} · {d.vendor.phone} · {d.vendor.email} · plan <b>{d.vendor.plan}</b><br />
        Wants: {d.wantWeb ? 'Website ' : ''}{d.wantApp ? 'Mobile app' : ''} · Template <code>{page.templateId}</code> · {page.items.length} items · {page.category} · {page.village ?? '—'} ({page.lat.toFixed(4)}, {page.lng.toFixed(4)})
        <br />Fulfilment: {page.policy.offersPickup ? 'Pickup ' : ''}{page.policy.offersDelivery ? 'Delivery' : ''} · Part-payment: {page.policy.partialPaymentEnabled ? `${page.policy.partialPercent}%` : 'off'}
      </div>
      <div className="card col">
        <b>Decision</b>
        <textarea rows={2} placeholder="Notes for the vendor (required when rejecting)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="row">
          {d.status === 'IN_REVIEW' && <><button className="btn" onClick={() => decide('APPROVE')}>✅ Approve</button><button className="btn danger" onClick={() => decide('REJECT')}>Reject</button></>}
          {['PUBLISHED', 'APPROVED'].includes(d.status) && <button className="btn danger" onClick={() => decide('SUSPEND')}>Suspend</button>}
          {d.status === 'SUSPENDED' && <button className="btn" onClick={() => decide('REINSTATE')}>Reinstate</button>}
        </div>
        {msg && <div className="small">{msg}</div>}
      </div>
      <h3 style={{ margin: 0 }}>Storefront preview (exactly what customers see)</h3>
      <StoreView page={page} />
      {d.reviews.length > 0 && <div className="card"><b>History</b>{d.reviews.map((r: any) => <div key={r.id} className="small">{fmtDate(r.createdAt)} — {r.decision}{r.notes ? `: ${r.notes}` : ''}</div>)}</div>}
    </div>
  );
}
