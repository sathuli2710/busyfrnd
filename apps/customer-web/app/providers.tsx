'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, MapPin, Package, ShoppingBag, User } from 'lucide-react';
import { AppProvider, BottomNav, Button, Toaster, buttonStyles, cn, useApp, useLocation, type NavItem } from '@busyfrnd/web-ui';
import { CartProvider, useCart } from '../components/cart';
import { LocationSheet } from '../components/location-sheet';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const NavLink = (p: { href: string; className?: string; children?: ReactNode; 'aria-current'?: 'page' | undefined }) => <Link {...p} />;
const PUBLIC = ['/', '/login'];

function Shell({ children }: { children: ReactNode }) {
  const { user, ready, t } = useApp();
  const { count } = useCart();
  const { loc } = useLocation();
  const path = usePathname();
  const router = useRouter();
  const [locOpen, setLocOpen] = useState(false);
  const authless = PUBLIC.includes(path) || path.startsWith('/store');
  useEffect(() => { if (ready && !user && !authless) router.replace('/login'); }, [ready, user, authless, router]);
  const items: NavItem[] = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/cart', label: t('nav.cart'), icon: ShoppingBag, badge: count || undefined },
    { href: '/orders', label: t('nav.orders'), icon: Package },
    { href: user ? '/settings' : '/login', label: user ? t('nav.settings') : t('auth.verify'), icon: User },
  ];
  if (path === '/login') return <>{children}</>;
  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-line">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-white">B</span><span className="hidden sm:inline">BusyFrnd</span></Link>
          <button onClick={() => setLocOpen(true)} className="flex min-w-0 items-center gap-1.5 rounded-full bg-black/5 px-3.5 py-2 text-sm font-semibold transition hover:bg-black/10 active:scale-95">
            <MapPin size={16} className="shrink-0 text-brand-500" /><span className="truncate">{loc.label ?? 'Set location'}</span><span className="text-muted">· {user?.radiusKm ?? 20} km</span>
          </button>
          <span className="flex-1" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {items.slice(0, 3).map((it) => { const on = it.href === '/' ? path === '/' : path.startsWith(it.href); const Icon = it.icon; return (
              <Link key={it.href} href={it.href} aria-current={on ? 'page' : undefined} className={cn('relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition', on ? 'bg-ink text-white' : 'text-ink-soft hover:bg-black/5')}>
                <Icon size={18} />{it.label}{it.badge ? <span className="rounded-full bg-brand-500 px-1.5 text-[11px] font-extrabold text-white">{it.badge}</span> : null}
              </Link>); })}
          </nav>
          {user ? <Link href="/settings" className={cn(buttonStyles({ variant: 'soft', size: 'icon' }), 'hidden md:inline-flex')} aria-label="Account"><User size={18} /></Link>
            : <Link href="/login" className={buttonStyles({ size: 'sm' })}>{t('auth.verify')}</Link>}
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl px-4 pb-32 pt-5 md:pb-12">{children}</main>
      <BottomNav items={items} path={path} Link={NavLink} />
      <LocationSheet open={locOpen} onOpenChange={setLocOpen} />
      <Toaster />
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider storageKey="bf:customer" channel="web" baseUrl={API_URL}><CartProvider><Shell>{children}</Shell></CartProvider></AppProvider>;
}
export { Button };
