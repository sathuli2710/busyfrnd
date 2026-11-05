'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { STORE_CATEGORIES, DEFAULT_RADIUS_KM, type Item, type StoreSummary } from '@busyfrnd/shared';
import { rupees } from '@busyfrnd/shared';
import { useApp, useLocation } from '@busyfrnd/web-ui';

export default function Home() {
  const { api, user, t, ready } = useApp();
  const { loc, detect, setLoc } = useLocation();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [items, setItems] = useState<Array<Item & { storeName: string; distanceKm: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const radius = user?.radiusKm ?? DEFAULT_RADIUS_KM;

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      if (q.trim().length >= 2) { const r = await api.catalog.search({ ...loc, radius, q: q.trim() }); setStores(r.stores); setItems(r.items); }
      else { setItems([]); setStores(await api.catalog.stores({ ...loc, radius, category: cat || undefined })); }
    } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  }, [api, loc, radius, q, cat]);

  useEffect(() => { if (!ready) return; const id = setTimeout(load, 250); return () => clearTimeout(id); }, [ready, load]);

  return (
    <div className="col">
      <div className="row">
        <input style={{ flex: 1, minWidth: 220 }} placeholder={t('store.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn secondary" onClick={() => detect().catch((e) => setErr(e.message))}>📍 {loc.label ?? 'Set location'}</button>
      </div>
      <div className="row small muted">
        <span>{t('settings.radius')}: <b>{radius} km</b></span>
        <details><summary>Change location manually</summary>
          <div className="row" style={{ marginTop: 8 }}>
            <input style={{ width: 130 }} defaultValue={loc.lat} onBlur={(e) => setLoc({ ...loc, lat: +e.target.value || loc.lat, label: 'Custom' })} aria-label="Latitude" />
            <input style={{ width: 130 }} defaultValue={loc.lng} onBlur={(e) => setLoc({ ...loc, lng: +e.target.value || loc.lng, label: 'Custom' })} aria-label="Longitude" />
          </div></details>
      </div>
      <div className="row" style={{ gap: 6 }}>
        <button className={`badge ${!cat ? 'orange' : ''}`} style={{ border: 0, cursor: 'pointer' }} onClick={() => setCat('')}>All</button>
        {STORE_CATEGORIES.filter((c) => c !== 'other').map((c) => <button key={c} className={`badge ${cat === c ? 'orange' : ''}`} style={{ border: 0, cursor: 'pointer' }} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      {err && <div className="error">{err}</div>}
      {loading && <div className="muted">{t('common.loading')}</div>}
      {items.length > 0 && (<>
        <h3 style={{ margin: '8px 0 0' }}>Products & services</h3>
        <div className="grid">{items.map((i) => (
          <Link key={i.id} href={`/store/${i.storeId}`} className="card"><b>{i.name}</b><div className="price">{rupees(i.pricePaise)}</div><div className="small muted">{i.storeName} · {i.distanceKm} {t('store.km')}</div></Link>
        ))}</div></>)}
      <h3 style={{ margin: '8px 0 0' }}>{t('store.nearby')}</h3>
      {!loading && !stores.length && <div className="muted">No stores within {radius} km yet.</div>}
      <div className="grid">{stores.map((s) => (
        <Link key={s.id} href={`/store/${s.id}`} className="card col" style={{ gap: 6 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><b style={{ fontSize: 17 }}>{s.name}</b><span className="badge">{s.category}</span></div>
          {s.description && <div className="small muted">{s.description}</div>}
          <div className="row small"><span>📍 {s.village ?? '—'}</span><span>{s.distanceKm} {t('store.km')}</span>
            {s.offersPickup && <span className="badge green">{t('cart.pickup')}</span>}{s.offersDelivery && <span className="badge blue">{t('cart.delivery')}</span>}</div>
        </Link>))}</div>
    </div>
  );
}
