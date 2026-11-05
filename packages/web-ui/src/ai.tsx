'use client';
import { useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Mic, Send, Sparkles, Square } from 'lucide-react';
import { cn } from './lib';

export const AiBadge = ({ children = 'AI', className }: { children?: ReactNode; className?: string }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-ai-500 to-ai-pink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white', className)}>
    <Sparkles size={11} /> {children}
  </span>
);

/** Voice orb: breathing gradient sphere with ripple rings while listening. */
export function AiOrb({ listening, busy, onClick, size = 120, label }: { listening?: boolean; busy?: boolean; onClick?: () => void; size?: number; label?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} aria-label={label ?? 'Talk to AI'} className="relative grid place-items-center outline-none disabled:opacity-70" style={{ width: size, height: size }}>
      <AnimatePresence>
        {listening && [0, 1, 2].map((i) => (
          <motion.span key={i} className="absolute inset-0 rounded-full border-2 border-ai-500/50" initial={{ scale: 1, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.55, ease: 'easeOut' }} />
        ))}
      </AnimatePresence>
      <motion.span className="absolute inset-0 rounded-full bg-gradient-to-br from-ai-500 via-ai-pink to-brand-500 shadow-ai" animate={busy ? { rotate: 360 } : { scale: listening ? [1, 1.08, 1] : [1, 1.03, 1] }} transition={busy ? { duration: 1.2, repeat: Infinity, ease: 'linear' } : { duration: listening ? 0.9 : 3, repeat: Infinity }} />
      <span className="absolute inset-[10%] rounded-full bg-white/15 blur-[1px]" />
      <span className="relative text-white">{busy ? <Sparkles size={size * 0.34} /> : listening ? <Square size={size * 0.28} fill="white" /> : <Mic size={size * 0.34} />}</span>
    </button>
  );
}

/** "Ask AI" search bar with suggestion chips. */
export function AiPromptBar({ value, onChange, onSubmit, placeholder, busy, suggestions, onPickSuggestion, className }: {
  value: string; onChange: (v: string) => void; onSubmit: (v: string) => void; placeholder: string; busy?: boolean; suggestions?: string[]; onPickSuggestion?: (s: string) => void; className?: string;
}) {
  const [focus, setFocus] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); if (value.trim()) onSubmit(value.trim()); };
  return (
    <div className={className}>
      <form onSubmit={submit} className={cn('relative flex items-center gap-2 rounded-full border bg-white p-1.5 pl-5 shadow-soft transition-all', focus ? 'border-ai-500 shadow-ai' : 'border-line')}>
        <Sparkles size={18} className="shrink-0 text-ai-500" />
        <input value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} placeholder={placeholder} className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/80" />
        <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={busy || !value.trim()} aria-label="Ask" className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-ai-500 to-ai-pink text-white disabled:opacity-40">
          {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send size={16} />}
        </motion.button>
      </form>
      {suggestions && suggestions.length > 0 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {suggestions.map((s) => (
            <button key={s} onClick={() => onPickSuggestion?.(s)} className="shrink-0 rounded-full bg-ai-50 px-3.5 py-1.5 text-[13px] font-semibold text-ai-600 transition hover:bg-ai-100 active:scale-95">{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AiBubble({ who, children }: { who: 'me' | 'ai'; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={cn('max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed', who === 'me' ? 'self-end rounded-br-lg bg-ink text-white' : 'self-start rounded-bl-lg border border-line bg-white shadow-soft')}>
      {who === 'ai' && <AiBadge className="mb-1.5">BusyFrnd AI</AiBadge>}
      <div>{children}</div>
    </motion.div>
  );
}

export function TypingDots() {
  return <div className="flex gap-1 px-1 py-2">{[0, 1, 2].map((i) => <motion.span key={i} className="h-2 w-2 rounded-full bg-ai-500" animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />)}</div>;
}
