'use client';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { rupees } from '@busyfrnd/shared';
import { useApp } from '@busyfrnd/web-ui';
import { useCart } from './cart';

/** Floating cart summary for the current store — slides up like a native sheet. */
export function CartBar({ storeId }: { storeId: string }) {
  const { t } = useApp();
  const { cartFor } = useCart();
  const cart = cartFor(storeId);
  const n = cart?.lines.reduce((s, l) => s + l.qty, 0) ?? 0;
  return (
    <AnimatePresence>
      {cart && n > 0 && (
        <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }} className="fixed inset-x-0 bottom-[84px] z-30 px-4 md:bottom-6">
          <Link href={`/checkout/${storeId}`} className="mx-auto flex max-w-xl items-center justify-between gap-4 rounded-full bg-ink px-5 py-3.5 text-white shadow-lift transition active:scale-[0.98]">
            <span className="flex items-center gap-3"><span className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15"><ShoppingBag size={20} /><motion.span key={n} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-extrabold">{n}</motion.span></span>
              <span><span className="block text-xs font-medium text-white/60">{n} {t('cart.items')}</span><span className="block text-lg font-extrabold leading-none tabular-nums">{rupees(cart.subtotal)}</span></span></span>
            <span className="flex items-center gap-2 font-bold">{t('cart.view')}<ArrowRight size={18} /></span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
