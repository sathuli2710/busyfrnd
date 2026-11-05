'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { ChevronsLeft, ChevronsRight, LogOut, Search } from 'lucide-react';
import { cn } from './lib';
import { Avatar } from './ui';

export interface NavItem { href: string; label: string; icon: ComponentType<{ size?: number; className?: string }>; badge?: number | string }
type LinkLike = ComponentType<{ href: string; className?: string; children?: ReactNode; 'aria-current'?: 'page' | undefined; onClick?: () => void }>;

/** Mobile bottom tab bar with a sliding pill (shared by customer + vendor web). */
export function BottomNav({ items, path, Link }: { items: NavItem[]; path: string; Link: LinkLike }) {
  const active = (h: string) => (h === '/' ? path === '/' : path.startsWith(h));
  return (
    <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line md:hidden" aria-label="Primary">
      <LayoutGroup id="bottom">
        <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
          {items.map((it) => {
            const on = active(it.href), Icon = it.icon;
            return (
              <li key={it.href} className="flex-1">
                <Link href={it.href} aria-current={on ? 'page' : undefined} className="relative flex flex-col items-center gap-0.5 py-1.5">
                  {on && <motion.span layoutId="bn-pill" transition={{ type: 'spring', stiffness: 500, damping: 36 }} className="absolute inset-x-3 top-0 h-1 rounded-full bg-ink" />}
                  <span className="relative"><Icon size={22} className={on ? 'text-ink' : 'text-muted'} />
                    {it.badge ? <span className="absolute -right-2.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-extrabold text-white">{it.badge}</span> : null}
                  </span>
                  <span className={cn('text-[11px] font-semibold', on ? 'text-ink' : 'text-muted')}>{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </nav>
  );
}

/** Desktop sidebar (vendor + admin). */
export function Sidebar({ items, path, Link, brand, footer, collapsible = true, dark }: { items: NavItem[]; path: string; Link: LinkLike; brand: ReactNode; footer?: ReactNode; collapsible?: boolean; dark?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const active = (h: string) => (h === '/' ? path === '/' : path.startsWith(h));
  return (
    <aside className={cn('sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-[width] duration-300 md:flex', collapsed ? 'w-[84px]' : 'w-64', dark ? 'border-white/10 bg-ink text-white' : 'border-line bg-white')}>
      <div className="flex h-16 items-center px-5">{brand}</div>
      <LayoutGroup id="side">
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="Primary">
          {items.map((it) => {
            const on = active(it.href), Icon = it.icon;
            return (
              <Link key={it.href} href={it.href} aria-current={on ? 'page' : undefined} className={cn('relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-colors', on ? (dark ? 'text-white' : 'text-ink') : dark ? 'text-white/60 hover:text-white' : 'text-muted hover:text-ink')}>
                {on && <motion.span layoutId="side-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} className={cn('absolute inset-0 rounded-2xl', dark ? 'bg-white/10' : 'bg-black/5')} />}
                <Icon size={20} className="relative z-10 shrink-0" />
                {!collapsed && <span className="relative z-10 flex-1 truncate">{it.label}</span>}
                {!collapsed && it.badge ? <span className="relative z-10 rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-extrabold text-white">{it.badge}</span> : null}
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>
      <div className="flex flex-col gap-2 p-3">
        {!collapsed && footer}
        {collapsible && <button onClick={() => setCollapsed(!collapsed)} aria-label="Collapse sidebar" className={cn('flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold', dark ? 'text-white/50 hover:text-white' : 'text-muted hover:text-ink')}>{collapsed ? <ChevronsRight size={20} /> : <><ChevronsLeft size={20} />Collapse</>}</button>}
      </div>
    </aside>
  );
}

export function Topbar({ title, subtitle, right, search }: { title?: ReactNode; subtitle?: ReactNode; right?: ReactNode; search?: { value: string; onChange: (v: string) => void; placeholder: string } }) {
  return (
    <header className="glass sticky top-0 z-30 flex min-h-16 items-center gap-4 border-b border-line px-4 py-3 md:px-8">
      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-xl font-extrabold tracking-tight md:text-2xl">{title}</h1>}
        {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
      </div>
      {search && (
        <div className="relative hidden w-72 md:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search.value} onChange={(e) => search.onChange(e.target.value)} placeholder={search.placeholder} className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none transition focus:border-ink focus:ring-4 focus:ring-black/5" />
        </div>
      )}
      {right}
    </header>
  );
}

export function UserChip({ name, sub, onLogout }: { name?: string | null; sub?: string; onLogout: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name ?? sub} />
      <div className="hidden min-w-0 lg:block"><div className="truncate text-sm font-bold">{name ?? 'Account'}</div>{sub && <div className="truncate text-xs text-muted">{sub}</div>}</div>
      <button onClick={onLogout} aria-label="Log out" className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-black/5 hover:text-ink"><LogOut size={18} /></button>
    </div>
  );
}

export function PageTransition({ children, k }: { children: ReactNode; k: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>{children}</motion.div>
    </AnimatePresence>
  );
}

/** Generic data table with sticky head + animated rows (admin). */
export function DataTable<T>({ rows, columns, rowKey, empty, onRowClick }: { rows: T[]; columns: Array<{ header: string; cell: (r: T) => ReactNode; className?: string }>; rowKey: (r: T) => string; empty?: ReactNode; onRowClick?: (r: T) => void }) {
  if (!rows.length) return <>{empty}</>;
  return (
    <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-canvas/70 text-xs font-bold uppercase tracking-wider text-muted">
          <tr>{columns.map((c) => <th key={c.header} className={cn('px-5 py-3.5', c.className)}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr key={rowKey(r)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.025 }} onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cn('border-b border-line/70 last:border-0', onRowClick && 'cursor-pointer transition-colors hover:bg-canvas/80')}>
              {columns.map((c) => <td key={c.header} className={cn('px-5 py-4 align-middle', c.className)}>{c.cell(r)}</td>)}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
