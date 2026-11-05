'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { rupees, type Cart } from '@busyfrnd/shared';
import { useApp } from '@busyfrnd/web-ui';

export default function CartPage() {
  const { api, user, t } = useApp();
  const [carts, setCarts] = useState<Cart[] | null>(null);
  useEffect(() => { if (user) api.cart.list().then(setCarts); }, [api, user]);
  if (!carts) return <div className="muted">{t('common.loading')}</div>;
  if (!carts.length) return <div className="card muted">{t('cart.empty')}</div>;
  return (
    <div className="col">
      <p className="muted small">One cart per store — check out each store separately.</p>
      {carts.map((c) => (
        <div key={c.storeId} className="card col">
          <div className="row" style={{ justifyContent: 'space-between' }}><Link href={`/store/${c.storeId}`}><b>{c.store.name}</b></Link><b>{rupees(c.subtotal)}</b></div>
          {c.lines.map((l) => <div key={l.itemId} className="row small" style={{ justifyContent: 'space-between' }}><span>{l.qty} × {l.name}</span><span>{rupees(l.qty * l.pricePaise)}</span></div>)}
          <div className="row">
            <Link className="btn" href={`/checkout/${c.storeId}`}>{t('cart.checkout')}</Link>
            <button className="btn secondary" onClick={async () => { await api.cart.clear(c.storeId); setCarts(carts.filter((x) => x.storeId !== c.storeId)); }}>Clear</button>
          </div>
        </div>))}
    </div>
  );
}
