'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { categoryMeta, rupees, type OrderDto } from '@busyfrnd/shared';
import { Badge, EmptyState, STATUS_LABEL, STATUS_TONE, Skeleton, Stagger, StaggerItem, buttonStyles, fmtShort, shortId, useApp } from '@busyfrnd/web-ui';

export default function Orders() {
  const { api, user, t } = useApp();
  const [orders, setOrders] = useState<OrderDto[] | null>(null);
  useEffect(() => { if (user) api.orders.list().then(setOrders).catch(() => setOrders([])); }, [api, user]);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-3xl font-black tracking-tight">{t('nav.orders')}</h1>
      {!orders ? <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        : !orders.length ? <EmptyState emoji="📦" title="No orders yet" hint="Your orders will show up here." action={<Link href="/" className={buttonStyles()}>Start shopping</Link>} />
        : <Stagger className="flex flex-col gap-3">{orders.map((o) => (
          <StaggerItem key={o.id}>
            <Link href={`/orders/${o.id}`} className="flex items-center gap-4 rounded-3xl border border-line bg-white p-4 shadow-soft transition hover:shadow-lift active:scale-[0.99]">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-canvas text-2xl">{categoryMeta(null).emoji}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-extrabold">{o.storeName}</span><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge></div>
                <div className="mt-0.5 truncate text-sm text-muted">{shortId(o.id)} · {fmtShort(o.createdAt)} · {o.lines.map((l) => l.name).join(', ')}</div></div>
              <div className="text-right"><div className="font-extrabold tabular-nums">{rupees(o.total)}</div><ChevronRight size={18} className="ml-auto text-muted" /></div>
            </Link>
          </StaggerItem>))}</Stagger>}
    </div>
  );
}
