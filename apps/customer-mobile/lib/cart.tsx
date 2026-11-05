import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Cart } from '@busyfrnd/shared';
import { useApp, useToast } from '@busyfrnd/mobile-core';

interface CartCtx { carts: Cart[]; count: number; loaded: boolean; refresh: () => Promise<void>; qtyOf: (s: string, i: string) => number; setQty: (s: string, i: string, q: number) => Promise<void>; cartFor: (s: string) => Cart | undefined; clear: (s: string) => Promise<void> }
const C = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { api, user } = useApp();
  const toast = useToast();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(async () => { if (!user) { setCarts([]); setLoaded(true); return; } try { setCarts(await api.cart.list()); } catch { /* ignore */ } finally { setLoaded(true); } }, [api, user]);
  useEffect(() => { refresh(); }, [refresh]);
  const setQty = useCallback(async (storeId: string, itemId: string, qty: number) => {
    try { const next = await api.cart.setItem(storeId, itemId, qty); setCarts((cs) => { const rest = cs.filter((c) => c.storeId !== storeId); return next ? [next, ...rest] : rest; }); }
    catch (e) { toast.show((e as Error).message, 'error'); }
  }, [api, toast]);
  const clear = useCallback(async (storeId: string) => { await api.cart.clear(storeId); setCarts((cs) => cs.filter((c) => c.storeId !== storeId)); }, [api]);
  const value = useMemo<CartCtx>(() => ({
    carts, loaded, refresh, setQty, clear, count: carts.reduce((n, c) => n + c.lines.reduce((m, l) => m + l.qty, 0), 0),
    qtyOf: (s, i) => carts.find((c) => c.storeId === s)?.lines.find((l) => l.itemId === i)?.qty ?? 0, cartFor: (s) => carts.find((c) => c.storeId === s),
  }), [carts, loaded, refresh, setQty, clear]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useCart = () => { const c = useContext(C); if (!c) throw new Error('CartProvider missing'); return c; };
