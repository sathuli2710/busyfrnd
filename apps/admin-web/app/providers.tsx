'use client';
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppProvider, useApp } from '@busyfrnd/web-ui';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function Shell({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useApp();
  const path = usePathname();
  const router = useRouter();
  useEffect(() => { if (ready && (!user || user.role !== 'ADMIN') && path !== '/login') router.replace('/login'); }, [ready, user, path, router]);
  return (
    <>
      <nav className="nav"><div className="container">
        <Link href="/" className="brand">BusyFrnd <small>Admin</small></Link>
        {user && <>
          <Link href="/" className="link">Overview</Link><Link href="/stores" className="link">Store reviews</Link>
          <Link href="/vendors" className="link">Vendors</Link><Link href="/customers" className="link">Customers</Link><Link href="/orders" className="link">Orders</Link>
        </>}
        <span className="spacer" />
        {user && <button className="btn secondary" onClick={() => { logout(); router.push('/login'); }}>Log out</button>}
      </div></nav>
      <main className="container">{children}</main>
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider storageKey="bf:admin" channel="web" baseUrl={API_URL}><Shell>{children}</Shell></AppProvider>;
}
