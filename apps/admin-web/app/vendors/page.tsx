'use client';
import { useEffect, useState } from 'react';
import { fmtDate, useApp } from '@busyfrnd/web-ui';

export default function Vendors() {
  const { api, user } = useApp();
  const [rows, setRows] = useState<any[] | null>(null);
  const load = () => api.admin.vendors().then(setRows);
  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);
  if (!rows) return <div className="muted">Loading…</div>;
  return (
    <div className="card" style={{ overflowX: 'auto' }}><table><thead><tr><th>Vendor</th><th>Contact</th><th>Stores</th><th>Plan</th><th>Trial ends</th><th>AI tokens</th><th>Set plan</th></tr></thead><tbody>
      {rows.map((v) => (
        <tr key={v.id}><td>{v.user.name ?? '—'}</td><td>{v.user.phone}<br /><span className="muted small">{v.user.email}</span></td><td>{v._count.stores}</td><td><span className="badge">{v.plan}</span></td><td>{fmtDate(v.trialEndsAt)}</td><td>{v.aiTokensUsed.toLocaleString()}</td>
          <td><select value={v.plan} style={{ width: 110 }} onChange={(e) => api.admin.setPlan(v.id, e.target.value as never).then(load)}>{['TRIAL', 'FREE', 'PLUS', 'PRO'].map((p) => <option key={p}>{p}</option>)}</select></td></tr>))}
    </tbody></table></div>
  );
}
