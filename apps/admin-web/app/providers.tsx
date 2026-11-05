'use client';
import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShieldCheck, Store, Users } from 'lucide-react';
import { AppProvider, BottomNav, Sidebar, Toaster, Topbar, UserChip, useApp, type NavItem } from '@busyfrnd/web-ui';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const NavLink = (p: { href: string; className?: string; children?: ReactNode; 'aria-current'?: 'page' | undefined }) => <Link {...p} />;
const TITLES: Record<string, string> = { '/': 'Overview', '/stores': 'Store reviews', '/vendors': 'Vendors', '/customers': 'Customers', '/orders': 'Orders' };

function Shell({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useApp();
  const path = usePathname();
  const router = useRouter();
  useEffect(() => { if (ready && (!user || user.role !== 'ADMIN') && path !== '/login') router.replace('/login'); }, [ready, user, path, router]);
  const items: NavItem[] = [
    { href: '/', label: 'Overview', icon: LayoutDashboard }, { href: '/stores', label: 'Store reviews', icon: ShieldCheck },
    { href: '/vendors', label: 'Vendors', icon: Store }, { href: '/customers', label: 'Customers', icon: Users }, { href: '/orders', label: 'Orders', icon: Package },
  ];
  if (path === '/login') return <>{children}<Toaster /></>;
  const base = '/' + path.split('/')[1];
  return (
    <div className="flex min-h-screen">
      <Sidebar dark items={items} path={path} Link={NavLink}
        brand={<Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-ink">B</span>BusyFrnd<span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase">Admin</span></Link>} />
      <div className="min-w-0 flex-1">
        <Topbar title={TITLES[base] ?? 'Admin'} subtitle="Marketplace control center" right={user && <UserChip name={user.name ?? 'Admin'} sub={user.email ?? undefined} onLogout={() => { logout(); router.push('/login'); }} />} />
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-12">{children}</main>
      </div>
      <BottomNav items={items.slice(0, 5)} path={path} Link={NavLink} />
      <Toaster />
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider storageKey="bf:admin" channel="web" baseUrl={API_URL}><Shell>{children}</Shell></AppProvider>;
}
