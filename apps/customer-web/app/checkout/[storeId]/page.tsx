'use client';
import { use, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bike, Check, ShieldCheck, Store } from 'lucide-react';
import { rupees, type Fulfillment, type PaymentMode, type Quote, type StorePage } from '@busyfrnd/shared';
import { Button, Card, EmptyState, Field, ProductThumb, Segmented, Skeleton, Textarea, cn, toast, useApp } from '@busyfrnd/web-ui';
import { useCart } from '../../../components/cart';

export default function Checkout({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const { api, t } = useApp();
  const { cartFor, loaded } = useCart();
  const cart = cartFor(storeId);
  const [store, setStore] = useState<StorePage | null>(null);
  const [f, setF] = useState<Fulfillment>('PICKUP');
  const [mode, setMode] = useState<PaymentMode>('FULL');
  const [address, setAddress] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.catalog.store(storeId).then((s) => { setStore(s); setF(s.policy.offersPickup ? 'PICKUP' : 'DELIVERY'); }).catch((e) => toast.error(e.message)); }, [api, storeId]);
  useEffect(() => { if (cart) api.cart.quote({ storeId, fulfillment: f, paymentMode: mode }).then(setQuote).catch((e) => toast.error(e.message)); }, [api, storeId, f, mode, cart]);

  if (!loaded || !store) return <div className="mx-auto max-w-4xl space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-72" /></div>;
  if (!cart) return <EmptyState emoji="🛒" title={t('cart.empty')} />;

  const pay = async () => {
    setBusy(true);
    try { const r = await api.cart.checkout({ storeId, fulfillment: f, paymentMode: mode, address: address || undefined, next: `${location.origin}/orders` }); location.href = r.checkoutUrl; }
    catch (e) { toast.error((e as Error).message); setBusy(false); }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        <div><p className="text-sm font-semibold text-muted">{t('cart.checkout')}</p><h1 className="text-3xl font-black tracking-tight">{store.name}</h1></div>

        <Card className="flex flex-col gap-4">
          <h2 className="font-extrabold">How do you want it?</h2>
          <Segmented value={f} onChange={setF} className="w-full [&>button]:flex-1" options={[
            { value: 'PICKUP', label: <><Store size={16} />{t('cart.pickup')}</>, disabled: !store.policy.offersPickup },
            { value: 'DELIVERY', label: <><Bike size={16} />{t('cart.delivery')}</>, disabled: !store.policy.offersDelivery },
          ]} />
          <AnimatePresence initial={false} mode="wait">
            {f === 'PICKUP' ? <motion.p key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">🎉 No delivery fee — we’ll notify you when it’s ready.</motion.p>
              : <motion.div key="d" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><Field label="Delivery address"><Textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, street, landmark" /></Field></motion.div>}
          </AnimatePresence>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-extrabold">Payment</h2>
          {([['FULL', t('cart.fullPay'), 'Pay the full amount now'], ...(store.policy.partialPaymentEnabled ? [['PARTIAL', t('cart.partPay'), `Pay ${store.policy.partialPercent}% now, rest at the store`]] : [])] as Array<[PaymentMode, string, string]>).map(([v, label, hint]) => (
            <button key={v} onClick={() => setMode(v)} className={cn('flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition', mode === v ? 'border-ink bg-canvas' : 'border-line hover:border-ink/30')}>
              <span className={cn('grid h-6 w-6 place-items-center rounded-full border-2', mode === v ? 'border-ink bg-ink text-white' : 'border-line')}>{mode === v && <Check size={14} />}</span>
              <span><span className="block font-bold">{label}</span><span className="text-sm text-muted">{hint}</span></span>
            </button>
          ))}
        </Card>
      </div>

      <div className="md:sticky md:top-24 md:self-start">
        <Card className="flex flex-col gap-4">
          <h2 className="font-extrabold">Order summary</h2>
          <div className="flex flex-col gap-3">{cart.lines.map((l) => <div key={l.itemId} className="flex items-center gap-3"><ProductThumb id={l.itemId} name={l.name} kind={l.kind} size={40} /><div className="min-w-0 flex-1 truncate text-sm font-semibold">{l.qty} × {l.name}</div><div className="text-sm font-bold tabular-nums">{rupees(l.qty * l.pricePaise)}</div></div>)}</div>
          <hr className="border-line" />
          <AnimatePresence mode="popLayout" initial={false}>
            {quote?.lines.map((l) => <motion.div layout key={l.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex justify-between text-sm"><span className="text-muted">{t('fee.' + l.key)}</span><span className="font-semibold tabular-nums">{rupees(l.amount)}</span></motion.div>)}
          </AnimatePresence>
          <hr className="border-line" />
          <div className="flex justify-between text-lg font-black"><span>{t('cart.total')}</span><span className="tabular-nums">{quote ? rupees(quote.total) : '—'}</span></div>
          {quote && quote.payLater > 0 && <div className="flex justify-between rounded-2xl bg-canvas px-4 py-3 text-sm"><span className="text-muted">{t('cart.payLater')}</span><b className="tabular-nums">{rupees(quote.payLater)}</b></div>}
          <Button size="lg" block loading={busy} disabled={!quote || (f === 'DELIVERY' && !address.trim())} onClick={pay}>{t('cart.payNow')} {quote ? rupees(quote.payNow) : ''}</Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck size={14} />Secure payment by Cashfree</p>
        </Card>
      </div>
    </div>
  );
}
