'use client';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { Fulfillment, OrderStatus } from '@busyfrnd/shared';
import { cn } from './lib';

const PICKUP: OrderStatus[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];
const DELIVERY: OrderStatus[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED'];
const LABEL: Record<string, string> = { PLACED: 'Order placed', ACCEPTED: 'Accepted', PREPARING: 'Preparing', READY: 'Ready for pickup', OUT_FOR_DELIVERY: 'Out for delivery', COMPLETED: 'Completed' };

export function OrderTimeline({ status, fulfillment }: { status: OrderStatus; fulfillment: Fulfillment }) {
  const steps = fulfillment === 'PICKUP' ? PICKUP : DELIVERY;
  const idx = status === 'READY' && fulfillment === 'DELIVERY' ? 3 : Math.max(0, steps.indexOf(status));
  if (status === 'CANCELLED') return <div className="rounded-2xl bg-rose-50 p-4 font-semibold text-rose-700">This order was cancelled.</div>;
  return (
    <ol className="relative flex flex-col gap-0">
      {steps.map((s, i) => {
        const done = i < idx || status === 'COMPLETED', active = i === idx && status !== 'COMPLETED';
        return (
          <li key={s} className="relative flex items-center gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5 bg-line"><motion.span className="block w-full bg-ink" initial={{ height: 0 }} animate={{ height: done ? '100%' : 0 }} transition={{ duration: 0.5 }} /></span>}
            <motion.span layout className={cn('relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold', done ? 'border-ink bg-ink text-white' : active ? 'border-brand-500 bg-white text-brand-500' : 'border-line bg-white text-muted')}>
              {done ? <Check size={16} /> : i + 1}
              {active && <motion.span className="absolute inset-0 rounded-full border-2 border-brand-500" animate={{ scale: [1, 1.6], opacity: [0.7, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />}
            </motion.span>
            <span className={cn('text-[15px]', active ? 'font-extrabold' : done ? 'font-semibold' : 'font-medium text-muted')}>{LABEL[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}
