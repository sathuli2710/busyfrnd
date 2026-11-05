import type { ReactNode } from 'react';
import '@busyfrnd/web-ui/src/styles.css';
import { Providers } from './providers';

export const metadata = { title: 'BusyFrnd Admin', description: 'Review stores, vendors and orders.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
