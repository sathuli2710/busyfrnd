import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { rupees, type Item, type Section, type StorePage, type Theme } from '@busyfrnd/shared';

export interface StoreViewProps {
  page: StorePage;
  /** When provided, products show add-to-cart steppers. */
  qtyOf?: (itemId: string) => number;
  onSetQty?: (itemId: string, qty: number) => void;
  t?: (k: string) => string;
}

const initials = (s: string) => s.trim().slice(0, 1).toUpperCase();

function Stepper({ q, set, label }: { q: number; set: (n: number) => void; label: string }) {
  if (q <= 0) return <button className="btn" style={{ padding: '6px 14px' }} onClick={() => set(1)}>{label}</button>;
  return (
    <span className="stepper">
      <button aria-label="decrease" onClick={() => set(q - 1)}>−</button><span>{q}</span><button aria-label="increase" onClick={() => set(q + 1)}>+</button>
    </span>
  );
}

function Thumb({ item, theme, size = 72 }: { item: Item; theme: Theme; size?: number }) {
  const s: CSSProperties = { width: size, height: size, borderRadius: theme.radius, background: theme.primary + '22', color: theme.primary, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size / 2.4, overflow: 'hidden', flex: 'none' };
  return item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ ...s, objectFit: 'cover' }} /> : <div style={s}>{initials(item.name)}</div>;
}

/** Renders a vendor storefront from its template sections + theme. Used by customer web, vendor preview and admin review. */
export function StoreView({ page, qtyOf, onSetQty, t = (k) => k }: StoreViewProps) {
  const th = page.theme;
  const [cat, setCat] = useState<string | null>(null);
  const items = useMemo(() => page.items.filter((i) => !cat || i.category === cat), [page.items, cat]);
  const categories = useMemo(() => [...new Set(page.items.map((i) => i.category).filter(Boolean) as string[])], [page.items]);
  const interactive = !!onSetQty;

  const card: CSSProperties = { background: th.surface, borderRadius: th.radius, padding: 14, border: `1px solid ${th.text}14` };
  const addLabel = t('cart.add');

  const price = (i: Item) => <span style={{ fontWeight: 700, color: th.primary }}>{rupees(i.pricePaise)}</span>;
  const control = (i: Item): ReactNode =>
    !interactive ? null : i.inStock ? <Stepper q={qtyOf?.(i.id) ?? 0} set={(n) => onSetQty!(i.id, n)} label={addLabel} /> : <span className="badge red">Out of stock</span>;

  const render = (s: Section, idx: number): ReactNode => {
    const p = (s.props ?? {}) as Record<string, any>;
    switch (s.type) {
      case 'hero':
        return (
          <div key={idx} style={{ background: `linear-gradient(135deg, ${th.primary}, ${th.accent})`, color: '#fff', borderRadius: th.radius, padding: p.compact ? 18 : 32 }}>
            <div style={{ fontSize: p.compact ? 22 : 30, fontWeight: 800 }}>{page.name}</div>
            {page.description && <div style={{ opacity: .92, marginTop: 6 }}>{page.description}</div>}
            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              {page.village && <span className="badge">📍 {page.village}</span>}
              {page.distanceKm != null && <span className="badge">{page.distanceKm} {t('store.km')}</span>}
              {page.policy.offersPickup && <span className="badge green">{t('cart.pickup')}</span>}
              {page.policy.offersDelivery && <span className="badge blue">{t('cart.delivery')}</span>}
            </div>
          </div>
        );
      case 'banner':
        return <div key={idx} style={{ background: p.sale ? th.accent : th.primary, color: '#fff', borderRadius: th.radius, padding: 18, fontWeight: 800, fontSize: 20 }}>{p.sale ? '🔥 ' : ''}{page.name}</div>;
      case 'categories':
        return categories.length ? (
          <div key={idx} className="row" style={{ gap: 8 }}>
            <button className="badge" style={{ border: 0, cursor: 'pointer', background: !cat ? th.primary : '#eee', color: !cat ? '#fff' : '#333' }} onClick={() => setCat(null)}>All</button>
            {categories.map((c) => <button key={c} className="badge" style={{ border: 0, cursor: 'pointer', background: cat === c ? th.primary : '#eee', color: cat === c ? '#fff' : '#333' }} onClick={() => setCat(c)}>{c}</button>)}
          </div>
        ) : null;
      case 'productGrid': {
        const list = items.filter((i) => i.kind === 'PRODUCT' || !page.sections.some((x) => x.type === 'services'));
        return (
          <div key={idx} style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(auto-fill,minmax(${p.columns === 3 ? 150 : 200}px,1fr))` }}>
            {list.map((i) => (
              <div key={i.id} style={card}>
                <Thumb item={i} theme={th} size={96} />
                <div style={{ fontWeight: 700, marginTop: 8 }}>{i.name}</div>
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>{price(i)}{control(i)}</div>
              </div>
            ))}
          </div>
        );
      }
      case 'productList':
        return (
          <div key={idx} className="col" style={{ gap: 8 }}>
            {items.map((i) => (
              <div key={i.id} style={{ ...card, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Thumb item={i} theme={th} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{i.name}</div>{i.description && <div className="small muted">{i.description}</div>}{price(i)}</div>
                {control(i)}
              </div>
            ))}
          </div>
        );
      case 'services': {
        const svc = items.filter((i) => i.kind === 'SERVICE');
        return svc.length ? (
          <div key={idx} className="col" style={{ gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Services</div>
            {svc.map((i) => (
              <div key={i.id} style={{ ...card, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{i.name}</div>{i.description && <div className="small muted">{i.description}</div>}</div>
                {price(i)}{control(i)}
              </div>
            ))}
            {page.policy.visitingFee > 0 && <div className="small muted">+ visiting charge {rupees(page.policy.visitingFee)}</div>}
          </div>
        ) : null;
      }
      case 'about':
        return page.description ? <div key={idx} style={card}><b>About</b><div>{page.description}</div></div> : null;
      case 'hours':
        return page.hours ? <div key={idx} style={card}>🕘 {page.hours}</div> : null;
      case 'contact':
        return (page.phone || page.address) ? <div key={idx} style={card}><b>Contact</b>{page.address && <div>📍 {page.address}</div>}{page.phone && <div>📞 {page.phone}</div>}</div> : null;
      default:
        return null;
    }
  };

  return (
    <div className="store-shell" style={{ background: th.background, color: th.text, padding: 14 }}>
      <div className="col" style={{ gap: 14 }}>{page.sections.map(render)}</div>
    </div>
  );
}
