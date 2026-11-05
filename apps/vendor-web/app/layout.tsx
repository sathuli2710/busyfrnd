import type { ReactNode } from 'react';
import '@busyfrnd/web-ui/src/styles.css';
import { Providers } from './providers';

export const metadata = { title: 'BusyFrnd Vendor — your shop, online in minutes', description: 'Build your store with your voice and start selling.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
