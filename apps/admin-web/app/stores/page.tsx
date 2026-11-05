'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp, fmtDate } from '@busyfrnd/web-ui';

const STATUSES = ['', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'SUSPENDED', 'DRAFT'];

function List() {
  const { api, user } = useApp();
  const status = useSearchParams().get('status') ?? 'IN_REVIEW';
  const router = useRouter();
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { if (user) { setRows(null); api.admin.stores(status || undefined).then(setRows); } }, [api, user, status]);
  return (
    <div className="col">
      <div className="row">{STATUSES.map((s) => <button key={s} className={`btn ${s === status ? '' : 'secondary'}`} onClick={() => router.push(`/stores?status=${s}`)}>{s ? s.replace('_', ' ') : 'ALL'}</button>)}</div>
      {!rows ? <div className="muted">Loading…</div> : !rows.length ? <div className="card muted">Nothing here.</div> : (
        <div className="card" style={{ overflowX: 'auto' }}><table><thead><tr><th>Store</th><th>Category</th><th>Vendor</th><th>Items</th><th>Channels</th><th>Submitted</th><th>Status</th></tr></thead><tbody>
          {rows.map((s) => (
            <tr key={s.id}><td><Link href={`/stores/${s.id}`}><b>{s.name}</b></Link></td><td>{s.category}</td><td>{s.vendor.user.phone}<br /><span className="muted small">{s.vendor.user.email}</span></td><td>{s._count.items}</td>
              <td>{s.wantWeb ? 'Web ' : ''}{s.wantApp ? 'App' : ''}</td><td>{s.submittedAt ? fmtDate(s.submittedAt) : '—'}</td><td><span className="badge">{s.status}</span></td></tr>))}
        </tbody></table></div>)}
    </div>
  );
}
export default function Stores() { return <Suspense fallback={<div className="muted">Loading…</div>}><List /></Suspense>; }
