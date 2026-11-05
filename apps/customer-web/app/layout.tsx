import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = { title: 'BusyFrnd — shop local, near you', description: 'Order from stores in your village or town. Pickup or delivery.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0B0B0F' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
