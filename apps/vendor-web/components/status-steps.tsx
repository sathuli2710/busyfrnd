'use client';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@busyfrnd/web-ui';

const STEPS = [['DRAFT', 'Draft'], ['IN_REVIEW', 'In review'], ['APPROVED', 'Approved'], ['PUBLISHED', 'Live']] as const;
export function StatusSteps({ status }: { status: string }) {
  const idx = status === 'REJECTED' ? 0 : status === 'SUSPENDED' ? 2 : Math.max(0, STEPS.findIndex(([k]) => k === status));
  return (
    <div className="flex items-center">
      {STEPS.map(([k, label], i) => {
        const done = i < idx || (status === 'PUBLISHED' && i === 3), active = i === idx && !done;
        return (
          <div key={k} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.span layout className={cn('grid h-7 w-7 place-items-center rounded-full border-2 text-[11px] font-extrabold', done ? 'border-ok bg-ok text-white' : active ? (status === 'REJECTED' || status === 'SUSPENDED' ? 'border-bad bg-white text-bad' : 'border-brand-500 bg-white text-brand-500') : 'border-line bg-white text-muted')}>{done ? <Check size={14} /> : i + 1}</motion.span>
              <span className={cn('text-[11px] font-bold', active || done ? 'text-ink' : 'text-muted')}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="mx-2 mb-5 h-0.5 flex-1 rounded bg-line"><motion.div className="h-full rounded bg-ok" initial={{ width: 0 }} animate={{ width: i < idx ? '100%' : 0 }} /></div>}
          </div>
        );
      })}
    </div>
  );
}
