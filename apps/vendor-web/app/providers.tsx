'use client';
import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Mic, Package, Sparkles, Wallet } from 'lucide-react';
import { LANGUAGES, type Language } from '@busyfrnd/shared';
import { AppProvider, BottomNav, Segmented, Sidebar, Toaster, Topbar, UserChip, AiBadge, useApp, type NavItem } from '@busyfrnd/web-ui';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const NavLink = (p: { href: string; className?: string; children?: ReactNode; 'aria-current'?: 'page' | undefined }) => <Link {...p} />;
const SHORT: Record<Language, string> = { en: 'EN', hi: 'हि', ta: 'த' };

function Shell({ children }: { children: ReactNode }) {
  const { user, ready, t, lang, setLang, logout } = useApp();
  const path = usePathname();
  const router = useRouter();
  useEffect(() => { if (ready && !user && path !== '/login') router.replace('/login'); }, [ready, user, path, router]);
  const items: NavItem[] = [
    { href: '/', label: t('nav.dashboard'), icon: Home }, { href: '/orders', label: t('nav.orders'), icon: Package },
    { href: '/assistant', label: t('nav.assistant'), icon: Sparkles }, { href: '/plans', label: t('nav.plans'), icon: Wallet },
  ];
  if (path === '/login' || path === '/onboarding') return <>{children}<Toaster /></>;
  return (
    <div className="flex min-h-screen">
      <Sidebar items={items} path={path} Link={NavLink}
        brand={<Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">B</span>BusyFrnd<span className="rounded-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-white">Vendor</span></Link>}
        footer={<Link href="/assistant" className="rounded-3xl bg-gradient-to-br from-ai-500 to-ai-pink p-4 text-white shadow-ai"><AiBadge className="bg-white/20">AI Buddy</AiBadge><div className="mt-2 text-sm font-bold">Ask anything about your shop — by voice.</div></Link>} />
      <div className="min-w-0 flex-1">
        <Topbar right={<div className="flex items-center gap-3"><Segmented size="sm" value={lang} onChange={(l) => setLang(l as Language)} options={LANGUAGES.map((l) => ({ value: l, label: SHORT[l] }))} />{user && <UserChip name={user.name} sub={user.phone} onLogout={() => { logout(); router.push('/login'); }} />}</div>}
          title={<Link href="/" className="flex items-center gap-2 md:hidden"><span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-sm text-white">B</span></Link>} />
        <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 md:px-8 md:pb-12">{children}</main>
      </div>
      <BottomNav items={items} path={path} Link={NavLink} />
      {path !== '/assistant' && <Link href="/assistant" aria-label={t('vendor.askBuddy')} className="fixed bottom-24 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-ai-500 to-ai-pink text-white shadow-ai transition active:scale-90 md:hidden"><Mic size={24} /></Link>}
      <Toaster />
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider storageKey="bf:vendor" channel="web" baseUrl={API_URL}><Shell>{children}</Shell></AppProvider>;
}
