'use client';
import { useRef } from 'react';
import { cn } from './lib';

/** Segmented one-time-code input with paste + auto-advance. */
export function OtpInput({ value, onChange, length = 6, autoFocus, onComplete, label }: { value: string; onChange: (v: string) => void; length?: number; autoFocus?: boolean; onComplete?: (v: string) => void; label?: string }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const set = (next: string) => { const v = next.replace(/\D/g, '').slice(0, length); onChange(v); if (v.length === length) onComplete?.(v); };
  return (
    <div className="flex gap-2" role="group" aria-label={label ?? 'One-time code'}>
      {Array.from({ length }).map((_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" autoComplete="one-time-code" maxLength={1} autoFocus={autoFocus && i === 0}
          value={value[i] ?? ''} aria-label={`Digit ${i + 1}`}
          onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); if (!d) return; const arr = value.split(''); arr[i] = d[d.length - 1]; set(arr.join('')); refs.current[Math.min(i + 1, length - 1)]?.focus(); }}
          onKeyDown={(e) => { if (e.key === 'Backspace') { if (value[i]) set(value.slice(0, i) + value.slice(i + 1)); else { refs.current[Math.max(0, i - 1)]?.focus(); set(value.slice(0, Math.max(0, i - 1))); } } }}
          onPaste={(e) => { e.preventDefault(); set(e.clipboardData.getData('text')); refs.current[Math.min(length - 1, e.clipboardData.getData('text').length)]?.focus(); }}
          className={cn('h-14 w-full min-w-0 rounded-2xl border bg-white text-center text-xl font-extrabold tabular-nums outline-none transition focus:border-ink focus:ring-4 focus:ring-black/5', value[i] ? 'border-ink' : 'border-line')} />
      ))}
    </div>
  );
}
