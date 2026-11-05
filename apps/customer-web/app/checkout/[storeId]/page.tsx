'use client';
import { use, useEffect, useState } from 'react';
import { rupees, type Cart, type Fulfillment, type PaymentMode, type Quote, type StorePage } from '@busyfrnd/shared';
import { useApp } from '@busyfrnd/web-ui';

export default function Checkout({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const { api, t } = useApp();
  const [store, setStore] = useState<StorePage | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [fulfillment, setF] = useState<Fulfillment>('PICKUP');
  const [mode, setMode] = useState<PaymentMode>('FULL');
  const [address, setAddress] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.catalog.store(storeId).then((s) => { setStore(s); setF(s.policy.offersPickup ? 'PICKUP' : 'DELIVERY'); }).catch((e) => setErr(e.message));
    api.cart.list().then((cs) => setCart(cs.find((c) => c.storeId === storeId) ?? null));
  }, [api, storeId]);
  useEffect(() => { if (cart) api.cart.quote({ storeId, fulfillment, paymentMode: mode }).then((q) => { setQuote(q); setErr(''); }).catch((e) => setErr(e.message)); }, [api, storeId, fulfillment, mode, cart]);

  if (!store) return <div className="muted">{err || t('common.loading')}</div>;
  if (!cart) return <div className="card muted">{t('cart.empty')}</div>;

  const place = async () => {
    setBusy(true); setErr('');
    try {
      const next = `${location.origin}/orders`;
      const r = await api.cart.checkout({ storeId, fulfillment, paymentMode: mode, address: address || undefined, next });
      location.href = r.checkoutUrl;
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  return (
    <div className="col" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2 style={{ margin: 0 }}>{t('cart.checkout')} · {store.name}</h2>
      <div className="card col">
        {cart.lines.map((l) => <div key={l.itemId} className="row" style={{ justifyContent: 'space-between' }}><span>{l.qty} × {l.name}</span><span>{rupees(l.qty * l.pricePaise)}</span></div>)}
      </div>
      <div className="card col">
        <b>Pickup or delivery?</b>
        <div className="row">
          {store.policy.offersPickup && <button className={`btn ${fulfillment === 'PICKUP' ? '' : 'secondary'}`} onClick={() => setF('PICKUP')}>🏪 {t('cart.pickup')} · free</button>}
          {store.policy.offersDelivery && <button className={`btn ${fulfillment === 'DELIVERY' ? '' : 'secondary'}`} onClick={() => setF('DELIVERY')}>🛵 {t('cart.delivery')}</button>}
        </div>
        {fulfillment === 'DELIVERY' && <label>Delivery address<textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></label>}
      </div>
      <div className="card col">
        <b>Payment</b>
        <div className="row">
          <button className={`btn ${mode === 'FULL' ? '' : 'secondary'}`} onClick={() => setMode('FULL')}>{t('cart.fullPay')}</button>
          {store.policy.partialPaymentEnabled && <button className={`btn ${mode === 'PARTIAL' ? '' : 'secondary'}`} onClick={() => setMode('PARTIAL')}>{t('cart.partPay')} ({store.policy.partialPercent}%)</button>}
        </div>
      </div>
      {quote && (
        <div className="card col">
          {quote.lines.map((l) => <div key={l.key} className="row" style={{ justifyContent: 'space-between' }}><span>{t('fee.' + l.key)}</span><span>{rupees(l.amount)}</span></div>)}
          <hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--border)' }} />
          <div className="row price" style={{ justifyContent: 'space-between' }}><span>{t('cart.total')}</span><span>{rupees(quote.total)}</span></div>
          <div className="row" style={{ justifyContent: 'space-between' }}><span>{t('cart.payNow')}</span><b className="ok">{rupees(quote.payNow)}</b></div>
          {quote.payLater > 0 && <div className="row muted" style={{ justifyContent: 'space-between' }}><span>{t('cart.payLater')}</span><span>{rupees(quote.payLater)}</span></div>}
        </div>)}
      {err && <div className="error">{err}</div>}
      <button className="btn big" disabled={busy || !quote || (fulfillment === 'DELIVERY' && !address.trim())} onClick={place}>{t('cart.payNow')} {quote ? rupees(quote.payNow) : ''}</button>
    </div>
  );
}
