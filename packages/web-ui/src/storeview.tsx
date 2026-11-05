'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bike, Clock, MapPin, Phone, ShoppingBag, Store as StoreIcon } from 'lucide-react';
import { makeT, rupees, type Item, type Section, type StorePage } from '@busyfrnd/shared';
import { ProductThumb, StoreCover } from './art';
import { Badge, QtyStepper, Stagger, StaggerItem } from './ui';
import { cn } from './lib';

export interface StoreViewProps {
  page: StorePage;
  qtyOf?: (itemId: string) => number;
  onSetQty?: (itemId: string, qty: number) => void;
  t?: (k: string) => string;
  /** hides the cover when the host page renders its own header */
  hideHero?: boolean;
}

/** Renders a vendor storefront from its template (sections + theme). Used by customers, vendor preview and admin review. */
export function StoreView({ page, qtyOf, onSetQty, t = makeT('en'), hideHero }: StoreViewProps) {
  const th = page.theme;
  const [cat, setCat] = useState<string | null>(null);
  const items = useMemo(() => page.items.filter((i) => !cat || i.category === cat), [page.items, cat]);
  const categories = useMemo(() => [...new Set(page.items.map((i) => i.category).filter(Boolean) as string[])], [page.items]);
  const hasServicesSection = page.sections.some((x) => x.type === 'services');
  const dark = th.background.toLowerCase() < '#555555';
  const card = { background: th.surface, borderRadius: th.radius + 8, borderColor: `${th.text}12` } as const;
  const price = (i: Item) => <span className="font-extrabold tabular-nums" style={{ color: th.primary }}>{rupees(i.pricePaise)}</span>;
  const control = (i: Item): ReactNode => (!onSetQty ? null : i.inStock ? <QtyStepper qty={qtyOf?.(i.id) ?? 0} onChange={(n) => onSetQty(i.id, n)} addLabel={t('cart.add')} size="sm" /> : <Badge tone="red">Sold out</Badge>);

  const meta = (
    <div className="flex flex-wrap gap-2">
      {page.village && <Badge className="bg-white/90 !text-ink"><MapPin size={12} />{page.village}</Badge>}
      {page.distanceKm != null && <Badge className="bg-white/90 !text-ink">{page.distanceKm} {t('store.km')}</Badge>}
      {page.policy.offersPickup && <Badge tone="green"><StoreIcon size={12} />{t('cart.pickup')}</Badge>}
      {page.policy.offersDelivery && <Badge tone="blue"><Bike size={12} />{t('cart.delivery')}</Badge>}
    </div>
  );

  const render = (s: Section, idx: number): ReactNode => {
    const p = (s.props ?? {}) as Record<string, any>;
    switch (s.type) {
      case 'hero':
        if (hideHero) return null;
        return (
          <StoreCover key={idx} category={page.category} name={page.name} big className={cn('flex flex-col justify-end rounded-[28px]', p.compact ? 'min-h-36' : 'min-h-56')}>
            <div className="relative z-10 flex flex-col gap-3 p-6 text-white">
              <h2 className={cn('font-black leading-tight tracking-tight drop-shadow', p.compact ? 'text-2xl' : 'text-4xl')}>{page.name}</h2>
              {page.description && <p className="max-w-md text-sm font-medium text-white/90">{page.description}</p>}
              {meta}
            </div>
          </StoreCover>
        );
      case 'banner':
        return hideHero ? null : (
          <div key={idx} className="flex items-center justify-between rounded-[28px] p-5 text-white" style={{ background: `linear-gradient(120deg, ${p.sale ? th.accent : th.primary}, ${th.primary}CC)` }}>
            <div><div className="text-xs font-bold uppercase tracking-widest opacity-80">{p.sale ? 'Today’s deals' : 'Welcome to'}</div><div className="text-2xl font-black">{page.name}</div></div>
            <ShoppingBag size={40} className="opacity-70" />
          </div>
        );
      case 'categories':
        return categories.length ? (
          <div key={idx} className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {['All', ...categories].map((c) => {
              const active = (c === 'All' && !cat) || cat === c;
              return <button key={c} onClick={() => setCat(c === 'All' ? null : c)} className="shrink-0 rounded-full px-4 py-2 text-sm font-bold transition" style={{ background: active ? th.primary : `${th.text}0D`, color: active ? '#fff' : th.text }}>{c}</button>;
            })}
          </div>
        ) : null;
      case 'productGrid': {
        const list = items.filter((i) => i.kind === 'PRODUCT' || !hasServicesSection);
        return (
          <Stagger key={idx} className={cn('grid gap-3', p.columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2')}>
            {list.map((i) => (
              <StaggerItem key={i.id}>
                <div className="flex h-full flex-col gap-3 border p-3" style={card}>
                  <ProductThumb id={i.id} name={i.name} category={i.category} kind={i.kind} imageUrl={i.imageUrl} size={0} />
                  <div className="min-h-10 text-[15px] font-bold leading-snug" style={{ color: th.text }}>{i.name}</div>
                  <div className="mt-auto flex items-center justify-between gap-2">{price(i)}{control(i)}</div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        );
      }
      case 'productList':
        return (
          <Stagger key={idx} className="flex flex-col gap-3">
            {items.map((i) => (
              <StaggerItem key={i.id}>
                <div className="flex items-center gap-4 border p-3" style={card}>
                  <ProductThumb id={i.id} name={i.name} category={i.category} kind={i.kind} imageUrl={i.imageUrl} size={76} />
                  <div className="min-w-0 flex-1"><div className="font-bold leading-snug" style={{ color: th.text }}>{i.name}</div>{i.description && <div className="line-clamp-2 text-xs opacity-60" style={{ color: th.text }}>{i.description}</div>}<div className="mt-1">{price(i)}</div></div>
                  {control(i)}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        );
      case 'services': {
        const svc = items.filter((i) => i.kind === 'SERVICE');
        return svc.length ? (
          <div key={idx} className="flex flex-col gap-3">
            <h3 className="text-xl font-black" style={{ color: th.text }}>Services</h3>
            <Stagger className="flex flex-col gap-3">
              {svc.map((i) => (
                <StaggerItem key={i.id}>
                  <div className="flex items-center gap-4 border p-4" style={card}>
                    <ProductThumb id={i.id} name={i.name} category={i.category} kind="SERVICE" size={56} />
                    <div className="min-w-0 flex-1"><div className="font-bold" style={{ color: th.text }}>{i.name}</div>{price(i)}</div>
                    {control(i)}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            {page.policy.visitingFee > 0 && <p className="text-xs font-medium opacity-60" style={{ color: th.text }}>+ visiting charge {rupees(page.policy.visitingFee)} per booking</p>}
          </div>
        ) : null;
      }
      case 'about':
        return page.description ? <div key={idx} className="border p-5" style={card}><div className="mb-1 font-black" style={{ color: th.text }}>About</div><p className="text-sm leading-relaxed opacity-75" style={{ color: th.text }}>{page.description}</p></div> : null;
      case 'hours':
        return page.hours ? <div key={idx} className="flex items-center gap-3 border p-4 text-sm font-semibold" style={{ ...card, color: th.text }}><Clock size={18} style={{ color: th.primary }} />{page.hours}</div> : null;
      case 'contact':
        return page.phone || page.address ? (
          <div key={idx} className="flex flex-col gap-2 border p-5 text-sm font-medium" style={{ ...card, color: th.text }}>
            {page.address && <div className="flex items-center gap-3"><MapPin size={18} style={{ color: th.primary }} />{page.address}</div>}
            {page.phone && <div className="flex items-center gap-3"><Phone size={18} style={{ color: th.primary }} />{page.phone}</div>}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('flex flex-col gap-4 rounded-[32px] p-3 sm:p-4', dark && 'text-white')} style={{ background: th.background }}>
      {page.sections.map(render)}
    </motion.div>
  );
}
