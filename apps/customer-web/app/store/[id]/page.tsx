'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { StorePage } from '@busyfrnd/shared';
import { EmptyState, Skeleton, StoreView, Button, useApp, useLocation } from '@busyfrnd/web-ui';
import { useCart } from '../../../components/cart';
import { CartBar } from '../../../components/cart-bar';

export default function StoreRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { api, user, t } = useApp();
  const { loc } = useLocation();
  const { qtyOf, setQty } = useCart();
  const router = useRouter();
  const [page, setPage] = useState<StorePage | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.catalog.store(id, loc).then(setPage).catch((e) => setErr(e.message)); }, [api, id, loc]);

  return (
    <div className="flex flex-col gap-4">
      <div><Button variant="soft" size="sm" onClick={() => router.back()}><ArrowLeft size={16} />Back</Button></div>
      {err ? <EmptyState emoji="🏪" title="Store unavailable" hint={err} /> : !page ? (
        <div className="space-y-4"><Skeleton className="h-56 rounded-[28px]" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : (
        <StoreView page={page} t={t} qtyOf={(i) => qtyOf(id, i)} onSetQty={(i, n) => (user ? setQty(id, i, n) : router.push('/login'))} />
      )}
      <CartBar storeId={id} />
    </div>
  );
}
