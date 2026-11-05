'use client';
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { rupees, type Cart, type StorePage } from '@busyfrnd/shared';
import { StoreView, useApp, useLocation } from '@busyfrnd/web-ui';

export default function StoreRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, user, t } = useApp();
  const { loc } = useLocation();
  const router = useRouter();
  const [page, setPage] = useState<StorePage | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.catalog.store(id, loc).then(setPage).catch((e) => setErr(e.message)); }, [api, id, loc]);
  useEffect(() => { if (user) api.cart.list().then((cs) => setCart(cs.find((c) => c.storeId === id) ?? null)).catch(() => undefined); }, [api, user, id]);

  const setQty = useCallback(async (itemId: string, qty: number) => {
    if (!user) return router.push('/login');
    try { setCart(await api.cart.setItem(id, itemId, qty)); } catch (e) { setErr((e as Error).message); }
  }, [api, id, user, router]);

  if (err && !page) return <div className="error">{err}</div>;
  if (!page) return <div className="muted">{t('common.loading')}</div>;
  const count = cart?.lines.reduce((s, l) => s + l.qty, 0) ?? 0;
  return (
    <div className="col">
      {err && <div className="error">{err}</div>}
      <StoreView page={page} t={t} qtyOf={(i) => cart?.lines.find((l) => l.itemId === i)?.qty ?? 0} onSetQty={setQty} />
      {count > 0 && (
        <div className="card row" style={{ position: 'sticky', bottom: 12, justifyContent: 'space-between', boxShadow: '0 6px 24px #0002' }}>
          <b>{count} item{count > 1 ? 's' : ''} · {rupees(cart!.subtotal)}</b>
          <Link className="btn" href={`/checkout/${id}`}>{t('cart.checkout')}</Link>
        </div>)}
    </div>
  );
}
