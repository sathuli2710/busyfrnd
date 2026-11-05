import type { ReactNode } from 'react';
import '@busyfrnd/web-ui/src/styles.css';
import { Providers } from './providers';

export const metadata = { title: 'BusyFrnd — shop local, near you', description: 'Order from stores in your village or town. Pickup or delivery.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en"><body><Providers>{children}</Providers></body></html>
  );
}
