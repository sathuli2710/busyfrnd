'use client';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { rupees } from '@busyfrnd/shared';
import { Button, Card, EmptyState, ProductThumb, QtyStepper, Skeleton, Stagger, StaggerItem, buttonStyles, cn, useApp } from '@busyfrnd/web-ui';
import { useCart } from '../../components/cart';

export default function CartPage() {
  const { t } = useApp();
  const { carts, loaded, setQty, clear } = useCart();
  if (!loaded) return <div className="space-y-4"><Skeleton className="h-48" /></div>;
  if (!carts.length) return <EmptyState emoji="🛒" title={t('cart.empty')} hint="Browse nearby stores and add something you like." action={<Link href="/" className={buttonStyles({ size: 'lg' })}>Explore stores</Link>} />;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div><h1 className="text-3xl font-black tracking-tight">{t('nav.cart')}</h1><p className="text-sm text-muted">One cart per store — check out each store separately.</p></div>
      <Stagger className="flex flex-col gap-4">
        {carts.map((c) => (
          <StaggerItem key={c.storeId}>
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between"><Link href={`/store/${c.storeId}`} className="text-lg font-extrabold hover:underline">{c.store.name}</Link>
                <Button variant="ghost" size="iconSm" aria-label="Clear cart" onClick={() => clear(c.storeId)}><Trash2 size={16} /></Button></div>
              <div className="flex flex-col gap-3">
                {c.lines.map((l) => (
                  <div key={l.itemId} className="flex items-center gap-3">
                    <ProductThumb id={l.itemId} name={l.name} kind={l.kind} size={48} />
                    <div className="min-w-0 flex-1"><div className="truncate font-semibold">{l.name}</div><div className="text-sm text-muted tabular-nums">{rupees(l.pricePaise)}</div></div>
                    <QtyStepper qty={l.qty} onChange={(n) => setQty(c.storeId, l.itemId, n)} size="sm" />
                  </div>
                ))}
              </div>
              <Link href={`/checkout/${c.storeId}`} className={cn(buttonStyles({ size: 'lg', block: true }), 'justify-between')}><span>{t('cart.checkout')}</span><span className="tabular-nums">{rupees(c.subtotal)}</span></Link>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
