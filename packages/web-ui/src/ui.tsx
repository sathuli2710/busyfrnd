'use client';
import { forwardRef, useEffect, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Minus, Plus, X } from 'lucide-react';
import { Toaster as Sonner, toast } from 'sonner';
import { cn } from './lib';

export { toast };
export const SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const;

/* ---------- Button ---------- */
export const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-white hover:bg-ink-soft',
        brand: 'bg-brand-500 text-white hover:bg-brand-600 shadow-[0_8px_20px_-8px_rgb(255_90_31/0.7)]',
        ai: 'bg-gradient-to-r from-ai-500 to-ai-pink text-white shadow-ai',
        soft: 'bg-black/5 text-ink hover:bg-black/10',
        outline: 'border border-line bg-white text-ink hover:bg-canvas',
        ghost: 'text-ink hover:bg-black/5',
        danger: 'bg-bad text-white hover:opacity-90',
      },
      size: { sm: 'h-9 px-4 text-sm', md: 'h-11 px-5 text-[15px]', lg: 'h-14 px-7 text-base', icon: 'h-10 w-10', iconSm: 'h-8 w-8' },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
type MotionSafe = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'>;
export interface ButtonProps extends MotionSafe, VariantProps<typeof buttonStyles> { loading?: boolean }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, block, loading, children, disabled, ...p }, ref) {
  return (
    <motion.button ref={ref} whileTap={{ scale: 0.96 }} transition={SPRING} className={cn(buttonStyles({ variant, size, block }), className)} disabled={disabled || loading} {...p}>
      {loading ? <Spinner className="h-4 w-4" /> : null}
      {children}
    </motion.button>
  );
});

export const Spinner = ({ className }: { className?: string }) => (
  <span className={cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent', className)} role="status" aria-label="Loading" />
);

/* ---------- Surfaces ---------- */
export const Card = forwardRef<HTMLDivElement, { className?: string; children?: ReactNode; onClick?: () => void; interactive?: boolean }>(function Card({ className, children, interactive, ...p }, ref) {
  return <div ref={ref} className={cn('rounded-3xl border border-line bg-white p-5 shadow-soft', interactive && 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.99]', className)} {...p}>{children}</div>;
});

const TONES = {
  gray: 'bg-black/5 text-ink-soft', green: 'bg-emerald-50 text-emerald-700', orange: 'bg-brand-50 text-brand-600', red: 'bg-rose-50 text-rose-700',
  blue: 'bg-sky-50 text-sky-700', violet: 'bg-ai-50 text-ai-600', dark: 'bg-ink text-white',
} as const;
export type Tone = keyof typeof TONES;
export const Badge = ({ tone = 'gray', className, children }: { tone?: Tone; className?: string; children: ReactNode }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone], className)}>{children}</span>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-shimmer rounded-2xl bg-[linear-gradient(90deg,#efeff2_25%,#f8f8fa_50%,#efeff2_75%)] bg-[length:200%_100%]', className)} />
);

export function EmptyState({ emoji = '✨', title, hint, action }: { emoji?: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <div className="text-5xl">{emoji}</div>
      <div className="text-lg font-bold">{title}</div>
      {hint && <div className="max-w-sm text-sm text-muted">{hint}</div>}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  );
}

/* ---------- Form ---------- */
const field = 'w-full rounded-2xl border border-line bg-white px-4 text-[15px] text-ink placeholder:text-muted/70 transition focus:border-ink focus:outline-none focus:ring-4 focus:ring-black/5 disabled:bg-canvas disabled:text-muted';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(field, 'h-12', className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(field, 'py-3', className)} {...p} />;
});
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return <select ref={ref} className={cn(field, 'h-12 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%236b6b76%27 stroke-width=%272%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10', className)} {...p}>{children}</select>;
});
export function Field({ label, hint, error, children, className }: { label?: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      {label && <span className="text-[13px] font-semibold text-ink-soft">{label}</span>}
      {children}
      {error ? <span className="text-xs font-medium text-bad">{error}</span> : hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-ink' : 'bg-black/15')}>
      <motion.span layout transition={SPRING} className={cn('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow', checked ? 'right-0.5' : 'left-0.5')} />
    </button>
  );
}

export function SwitchRow({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white px-4 py-3">
      <div><div className="font-semibold">{label}</div>{hint && <div className="text-xs text-muted">{hint}</div>}</div>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}

/** Animated pill selector (iOS-style segmented control). */
export function Segmented<T extends string>({ value, onChange, options, className, size = 'md' }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: ReactNode; disabled?: boolean }>; className?: string; size?: 'sm' | 'md' }) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div className={cn('inline-flex rounded-full bg-black/5 p-1', className)} role="tablist">
        {options.map((o) => (
          <button key={o.value} type="button" role="tab" aria-selected={value === o.value} disabled={o.disabled} onClick={() => onChange(o.value)}
            className={cn('relative rounded-full font-semibold transition-colors disabled:opacity-40', size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-sm', value === o.value ? 'text-ink' : 'text-muted hover:text-ink')}>
            {value === o.value && <motion.span layoutId="seg" transition={SPRING} className="absolute inset-0 rounded-full bg-white shadow-soft" />}
            <span className="relative z-10 flex items-center justify-center gap-1.5">{o.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/** Underline tabs. */
export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: Array<{ value: T; label: ReactNode }>; className?: string }) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)} role="tablist">
        {items.map((i) => (
          <button key={i.value} role="tab" aria-selected={value === i.value} onClick={() => onChange(i.value)} className={cn('relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors', value === i.value ? 'text-ink' : 'text-muted hover:text-ink')}>
            {i.label}
            {value === i.value && <motion.span layoutId="tab-underline" transition={SPRING} className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink" />}
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors', active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-canvas', className)}>
      {children}
    </motion.button>
  );
}

/** Quantity stepper that morphs from an "Add" button. */
export function QtyStepper({ qty, onChange, addLabel = 'Add', size = 'md', max = 99 }: { qty: number; onChange: (n: number) => void; addLabel?: string; size?: 'sm' | 'md'; max?: number }) {
  const h = size === 'sm' ? 'h-9' : 'h-10';
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {qty <= 0 ? (
        <motion.button key="add" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} whileTap={{ scale: 0.92 }} onClick={() => onChange(1)}
          className={cn('rounded-full border border-ink bg-white px-5 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white', h)}>{addLabel}</motion.button>
      ) : (
        <motion.div key="step" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className={cn('inline-flex items-center rounded-full bg-ink text-white', h)}>
          <button aria-label="decrease" onClick={() => onChange(qty - 1)} className="grid h-full w-9 place-items-center rounded-l-full active:bg-white/20"><Minus size={16} /></button>
          <AnimatePresence mode="popLayout" initial={false}><motion.span key={qty} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="min-w-6 text-center text-sm font-bold tabular-nums">{qty}</motion.span></AnimatePresence>
          <button aria-label="increase" disabled={qty >= max} onClick={() => onChange(qty + 1)} className="grid h-full w-9 place-items-center rounded-r-full active:bg-white/20 disabled:opacity-40"><Plus size={16} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Overlays ---------- */
export function Sheet({ open, onOpenChange, title, description, children, className }: { open: boolean; onOpenChange: (o: boolean) => void; title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild><motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /></Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center md:items-center">
              <Dialog.Content asChild>
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 340 }}
                  className={cn('pointer-events-auto max-h-[88vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-6 pb-8 shadow-lift md:max-w-lg md:rounded-[32px]', className)}>
                  <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-black/10 md:hidden" />
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-xl font-extrabold tracking-tight">{title ?? 'Details'}</Dialog.Title>
                      {description ? <Dialog.Description className="text-sm text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
                    </div>
                    <Dialog.Close asChild><Button variant="soft" size="iconSm" aria-label="Close"><X size={16} /></Button></Dialog.Close>
                  </div>
                  {children}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export const Toaster = () => <Sonner position="top-center" richColors={false} toastOptions={{ classNames: { toast: '!rounded-2xl !border-line !shadow-lift !font-semibold' } }} />;

/* ---------- Data display ---------- */
export function Stat({ label, value, hint, icon, tone = 'gray', className }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone; className?: string }) {
  return (
    <Card className={cn('flex items-start justify-between gap-3 p-5', className)}>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-muted">{label}</div>
        <div className="mt-1 text-[28px] font-extrabold leading-none tracking-tight tabular-nums">{value}</div>
        {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
      </div>
      {icon && <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', TONES[tone])}>{icon}</div>}
    </Card>
  );
}

export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  const ch = (name ?? '?').trim().slice(0, 1).toUpperCase() || '?';
  return <div className={cn('grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-ai-pink text-sm font-extrabold text-white', className)}>{ch}</div>;
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 28, delay }} className={className}>{children}</motion.div>;
}
export const Stagger = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className={className}>{children}</motion.div>
);
export const StaggerItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } } }} className={className}>{children}</motion.div>
);

export function useCountUp(target: number, ms = 700) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now(); const from = 0;
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / ms); setV(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
