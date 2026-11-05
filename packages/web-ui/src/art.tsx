'use client';
import type { ReactNode } from 'react';
import { categoryMeta, emojiFor, softGradient } from '@busyfrnd/shared';
import { cn } from './lib';

/** Emoji-on-gradient artwork used wherever there is no photo. */
export function ProductThumb({ id, name, category, kind, imageUrl, size = 72, className }: { id: string; name: string; category?: string | null; kind?: string; imageUrl?: string | null; size?: number; className?: string }) {
  if (imageUrl) return <img src={imageUrl} alt={name} loading="lazy" className={cn('shrink-0 rounded-2xl object-cover', size === 0 && 'aspect-square w-full', className)} style={size ? { width: size, height: size } : undefined} />;
  const [a, b] = softGradient(id || name);
  const fluid = size === 0; // fills its container (square), used in product grids
  return (
    <div className={cn('grid shrink-0 place-items-center rounded-2xl', fluid && 'aspect-square w-full text-[56px]', className)} style={{ ...(fluid ? {} : { width: size, height: size, fontSize: size * 0.5 }), background: `linear-gradient(135deg, ${a}, ${b})` }} aria-hidden>
      <span className="drop-shadow-sm">{emojiFor(name, category, kind)}</span>
    </div>
  );
}

export function StoreCover({ category, name, className, children, big }: { category?: string | null; name: string; className?: string; children?: ReactNode; big?: boolean }) {
  const m = categoryMeta(category);
  return (
    <div className={cn('relative isolate overflow-hidden', className)} style={{ background: `linear-gradient(135deg, ${m.gradient[0]}, ${m.gradient[1]})` }}>
      <div className="pointer-events-none absolute -right-6 -top-6 select-none text-[140px] leading-none opacity-25 blur-[0.5px]" aria-hidden>{m.emoji}</div>
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-40 w-40 rounded-full bg-white/15" />
      <div className={cn('pointer-events-none absolute bottom-3 right-4 select-none leading-none drop-shadow-lg', big ? 'text-7xl' : 'text-5xl')} aria-hidden>{m.emoji}</div>
      <span className="sr-only">{name}</span>
      {children}
    </div>
  );
}

export function CategoryTile({ emoji, label, gradient, active, onClick }: { emoji: string; label: string; gradient: [string, string]; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group flex w-[76px] shrink-0 flex-col items-center gap-2 outline-none" aria-pressed={active}>
      <div className={cn('grid h-[68px] w-[68px] place-items-center rounded-[22px] text-3xl transition-all duration-200 group-active:scale-90', active ? 'scale-105 ring-2 ring-ink ring-offset-2' : 'group-hover:-translate-y-0.5')}
        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`, boxShadow: `0 10px 20px -10px ${gradient[1]}` }}>
        <span className="drop-shadow">{emoji}</span>
      </div>
      <span className={cn('text-xs font-semibold', active ? 'text-ink' : 'text-ink-soft')}>{label}</span>
    </button>
  );
}
