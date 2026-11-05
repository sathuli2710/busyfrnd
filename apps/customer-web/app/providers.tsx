'use client';
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LANGUAGES, LANGUAGE_LABELS, type Language } from '@busyfrnd/shared';
import { AppProvider, useApp } from '@busyfrnd/web-ui';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function Shell({ children }: { children: ReactNode }) {
  const { user, ready, t, lang, setLang, logout } = useApp();
  const path = usePathname();
  const router = useRouter();
  const open = path === '/login';
  useEffect(() => { if (ready && !user && !open && !path.startsWith('/store') && path !== '/') router.replace('/login'); }, [ready, user, open, path, router]);
  return (
    <>
      <nav className="nav"><div className="container">
        <Link href="/" className="brand">BusyFrnd</Link>
        <Link href="/" className="link">{t('nav.home')}</Link>
        <Link href="/cart" className="link">{t('nav.cart')}</Link>
        <Link href="/orders" className="link">{t('nav.orders')}</Link>
        <span className="spacer" />
        <select value={lang} onChange={(e) => setLang(e.target.value as Language)} style={{ width: 'auto' }} aria-label="Language">
          {LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>)}
        </select>
        {user ? <><Link href="/settings" className="link">{t('nav.settings')}</Link><button className="btn secondary" onClick={() => { logout(); router.push('/login'); }}>{t('settings.logout')}</button></>
          : <Link href="/login" className="btn">{t('auth.verify')}</Link>}
      </div></nav>
      <main className="container">{children}</main>
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider storageKey="bf:customer" channel="web" baseUrl={API_URL}><Shell>{children}</Shell></AppProvider>;
}
