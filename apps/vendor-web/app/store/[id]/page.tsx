'use client';
import { use, useCallback, useEffect, useState } from 'react';
import { rupees, type Item, type LayoutTemplate } from '@busyfrnd/shared';
import type { VendorStorePage } from '@busyfrnd/api-client';
import { StoreView, useApp } from '@busyfrnd/web-ui';

type Tab = 'items' | 'layout' | 'fees' | 'publish' | 'preview';
const rs = (p: number | null | undefined) => (p == null ? '' : String(p / 100));
const paise = (v: string) => (v.trim() === '' ? null : Math.round(+v * 100));

export default function StoreAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, t } = useApp();
  const [page, setPage] = useState<VendorStorePage | null>(null);
  const [layouts, setLayouts] = useState<Array<LayoutTemplate & { locked: boolean }>>([]);
  const [tab, setTab] = useState<Tab>('items');
  const [msg, setMsg] = useState('');
  const [web, setWeb] = useState(true);
  const [app, setApp] = useState(true);

  const load = useCallback(() => api.vendor.preview(id).then((p) => { setPage(p); setWeb(p.wantWeb); setApp(p.wantApp); }), [api, id]);
  useEffect(() => { load().catch((e) => setMsg(e.message)); api.vendor.layouts().then(setLayouts); }, [api, load]);
  const act = async (fn: () => Promise<unknown>, ok = 'Saved ✓') => { setMsg(''); try { await fn(); await load(); setMsg(ok); } catch (e) { setMsg((e as Error).message); } };

  if (!page) return <div className="muted">{msg || t('common.loading')}</div>;
  const p = page.policy;
  const live = page.status === 'PUBLISHED';

  return (
    <div className="col">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{page.name}</h2>
        <div className="row"><span className={`badge ${live ? 'green' : page.status === 'REJECTED' ? 'red' : 'orange'}`}>{page.status.replace('_', ' ')}</span>{page.publishWeb && <span className="badge blue">Web</span>}{page.publishApp && <span className="badge blue">App</span>}</div>
      </div>
      {page.rejectionReason && <div className="card error">Admin feedback: {page.rejectionReason}</div>}
      {msg && <div className="small">{msg}</div>}
      <div className="row">{(['items', 'layout', 'fees', 'publish', 'preview'] as Tab[]).map((x) => <button key={x} className={`btn ${tab === x ? '' : 'secondary'}`} onClick={() => setTab(x)}>{x}</button>)}</div>

      {tab === 'items' && <ItemsTab storeId={id} />}

      {tab === 'layout' && <div className="grid">{layouts.map((l) => (
        <button key={l.id} disabled={l.locked} onClick={() => act(() => api.vendor.updateStore(id, { templateId: l.id }))} className="card col" style={{ textAlign: 'left', cursor: l.locked ? 'not-allowed' : 'pointer', opacity: l.locked ? .55 : 1, outline: page.templateId === l.id ? '3px solid var(--primary)' : 'none', background: l.theme.background }}>
          <div className="row" style={{ gap: 4 }}>{[l.theme.primary, l.theme.accent, l.theme.surface].map((c) => <span key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c, border: '1px solid #0002' }} />)}</div>
          <b style={{ color: l.theme.text }}>{l.name}</b><span className="small muted">{l.sections.map((s) => s.type).join(' · ')}</span>
          <span className={`badge ${l.tier === 'BASIC' ? 'green' : l.tier === 'PLUS' ? 'blue' : 'orange'}`}>{l.locked ? `🔒 ${l.tier}` : l.tier}</span>
        </button>))}</div>}

      {tab === 'fees' && <FeesForm key={page.templateId + JSON.stringify(p)} page={page} onSave={(b) => act(() => api.vendor.updateStore(id, b))} t={t} />}

      {tab === 'publish' && <div className="card col">
        <b>Where do you want to sell?</b>
        <label className="row" style={{ flexDirection: 'row' }}><input type="checkbox" style={{ width: 'auto' }} checked={web} onChange={(e) => setWeb(e.target.checked)} /> Website</label>
        <label className="row" style={{ flexDirection: 'row' }}><input type="checkbox" style={{ width: 'auto' }} checked={app} onChange={(e) => setApp(e.target.checked)} /> Customer mobile app</label>
        {['DRAFT', 'REJECTED'].includes(page.status) && <button className="btn big" onClick={() => act(() => api.vendor.submit(id, web, app), 'Sent to admin for review ✓')}>{t('vendor.publish')}</button>}
        {page.status === 'IN_REVIEW' && <div className="muted">⏳ Waiting for admin review. We'll notify you.</div>}
        {['APPROVED', 'PUBLISHED'].includes(page.status) && <div className="row">
          <button className="btn big" onClick={() => act(() => api.vendor.publish(id, web, app), 'Published ✓')}>{live ? 'Update channels' : '🚀 Publish now'}</button>
          {live && <button className="btn secondary" onClick={() => act(() => api.vendor.unpublish(id), 'Taken offline')}>Unpublish</button>}</div>}
        {page.status === 'SUSPENDED' && <div className="error">This store is suspended. Contact support.</div>}
      </div>}

      {tab === 'preview' && <StoreView page={page} t={t} />}
    </div>
  );
}

function FeesForm({ page, onSave, t }: { page: VendorStorePage; onSave: (b: Record<string, unknown>) => void; t: (k: string) => string }) {
  const p = page.policy;
  const [f, setF] = useState({
    offersPickup: p.offersPickup, offersDelivery: p.offersDelivery, deliveryFee: rs(p.deliveryFee), lowOrderThreshold: rs(p.lowOrderThreshold), lowOrderDeliveryFee: rs(p.lowOrderDeliveryFee),
    freeDeliveryAbove: rs(p.freeDeliveryAbove), platformFee: rs(p.platformFee), handlingFee: rs(p.handlingFee), visitingFee: rs(p.visitingFee), partialPaymentEnabled: p.partialPaymentEnabled, partialPercent: String(p.partialPercent),
    phone: page.phone ?? '', address: page.address ?? '', hours: page.hours ?? '',
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF({ ...f, [k]: v });
  const num = (k: keyof typeof f, label: string) => <label>{label} (₹)<input type="number" min={0} value={f[k] as string} onChange={(e) => set(k, e.target.value)} /></label>;
  return (
    <div className="card col" style={{ maxWidth: 560 }}>
      <b>Fulfilment</b>
      <label className="row" style={{ flexDirection: 'row' }}><input type="checkbox" style={{ width: 'auto' }} checked={f.offersPickup} onChange={(e) => (e.target.checked || f.offersDelivery) && set('offersPickup', e.target.checked)} /> Customer pickup</label>
      <label className="row" style={{ flexDirection: 'row' }}><input type="checkbox" style={{ width: 'auto' }} checked={f.offersDelivery} onChange={(e) => (e.target.checked || f.offersPickup) && set('offersDelivery', e.target.checked)} /> Home delivery</label>
      <div className="small muted">At least one must stay enabled. Pickup customers never pay a delivery fee.</div>
      {f.offersDelivery && <>
        {num('deliveryFee', 'Delivery fee')}
        <div className="row">{num('lowOrderThreshold', 'Low-order limit')}{num('lowOrderDeliveryFee', 'Fee below limit')}</div>
        {num('freeDeliveryAbove', 'Free delivery above')}
      </>}
      <b>Charges</b>
      {num('platformFee', 'Platform fee')}{num('handlingFee', 'Handling charge')}{num('visitingFee', 'Visiting charge (services)')}
      <b>Payments</b>
      <label className="row" style={{ flexDirection: 'row' }}><input type="checkbox" style={{ width: 'auto' }} checked={f.partialPaymentEnabled} onChange={(e) => set('partialPaymentEnabled', e.target.checked)} /> Allow part payment (full payment is always available)</label>
      {f.partialPaymentEnabled && <label>Part payment % upfront<input type="number" min={1} max={99} value={f.partialPercent} onChange={(e) => set('partialPercent', e.target.value)} /></label>}
      <b>Shop details</b>
      <label>Phone<input value={f.phone} onChange={(e) => set('phone', e.target.value)} /></label>
      <label>Address<input value={f.address} onChange={(e) => set('address', e.target.value)} /></label>
      <label>Opening hours<input value={f.hours} onChange={(e) => set('hours', e.target.value)} /></label>
      <button className="btn big" onClick={() => onSave({
        offersPickup: f.offersPickup, offersDelivery: f.offersDelivery, deliveryFee: paise(f.deliveryFee) ?? 0, lowOrderThreshold: paise(f.lowOrderThreshold), lowOrderDeliveryFee: paise(f.lowOrderDeliveryFee),
        freeDeliveryAbove: paise(f.freeDeliveryAbove), platformFee: paise(f.platformFee) ?? 0, handlingFee: paise(f.handlingFee) ?? 0, visitingFee: paise(f.visitingFee) ?? 0,
        partialPaymentEnabled: f.partialPaymentEnabled, partialPercent: +f.partialPercent || 30, phone: f.phone, address: f.address, hours: f.hours,
      })}>{t('common.save')}</button>
    </div>
  );
}

function ItemsTab({ storeId }: { storeId: string }) {
  const { api } = useApp();
  const [items, setItems] = useState<Item[]>([]);
  const [nm, setNm] = useState('');
  const [pr, setPr] = useState('');
  const [kind, setKind] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const load = useCallback(() => api.vendor.items(storeId).then(setItems), [api, storeId]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="col">
      <div className="card row">
        <input style={{ flex: 2, minWidth: 160 }} placeholder="Item name" value={nm} onChange={(e) => setNm(e.target.value)} />
        <input style={{ width: 110 }} type="number" placeholder="₹ price" value={pr} onChange={(e) => setPr(e.target.value)} />
        <select style={{ width: 120 }} value={kind} onChange={(e) => setKind(e.target.value as 'PRODUCT' | 'SERVICE')}><option>PRODUCT</option><option>SERVICE</option></select>
        <button className="btn" disabled={!nm || !pr} onClick={async () => { await api.vendor.addItems(storeId, [{ name: nm, pricePaise: Math.round(+pr * 100), kind }]); setNm(''); setPr(''); load(); }}>Add</button>
      </div>
      <div className="card" style={{ overflowX: 'auto' }}><table><thead><tr><th>Name</th><th>Type</th><th>Price</th><th>In stock</th><th /></tr></thead><tbody>
        {items.map((i) => (
          <tr key={i.id}><td>{i.name}</td><td><span className="badge">{i.kind}</span></td>
            <td><input style={{ width: 90 }} type="number" defaultValue={i.pricePaise / 100} onBlur={(e) => api.vendor.updateItem(storeId, i.id, { pricePaise: Math.round(+e.target.value * 100) }).then(load)} /> <span className="muted small">{rupees(i.pricePaise)}</span></td>
            <td><input type="checkbox" style={{ width: 'auto' }} checked={i.inStock} onChange={(e) => api.vendor.updateItem(storeId, i.id, { inStock: e.target.checked }).then(load)} /></td>
            <td><button className="btn secondary" onClick={() => api.vendor.removeItem(storeId, i.id).then(load)}>✕</button></td></tr>))}
      </tbody></table></div>
    </div>
  );
}
