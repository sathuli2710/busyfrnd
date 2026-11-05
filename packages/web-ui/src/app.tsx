import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createApi, type Api } from '@busyfrnd/api-client';
import { makeT, type Language, type SessionUser } from '@busyfrnd/shared';

interface AppCtx {
  api: Api; user: SessionUser | null; token: string | null; ready: boolean;
  lang: Language; setLang: (l: Language) => void; t: (k: string) => string;
  setSession: (token: string, user: SessionUser) => void; logout: () => void; updateUser: (u: SessionUser) => void;
}
const Ctx = createContext<AppCtx | null>(null);

const safe = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export function AppProvider({ storageKey, channel, baseUrl, children }: { storageKey: string; channel: 'app' | 'web'; baseUrl: string; children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [lang, setLangState] = useState<Language>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = safe.get(storageKey);
    if (raw) { try { const s = JSON.parse(raw); setToken(s.token); setUser(s.user); if (s.user?.language) setLangState(s.user.language); } catch { /* ignore */ } }
    const l = safe.get(storageKey + ':lang') as Language | null;
    if (l) setLangState(l);
    setReady(true);
  }, [storageKey]);

  const logout = useCallback(() => { safe.del(storageKey); setToken(null); setUser(null); }, [storageKey]);
  const api = useMemo(() => createApi({ baseUrl, channel, getToken: () => token, onUnauthorized: logout }), [baseUrl, channel, token, logout]);

  const value = useMemo<AppCtx>(() => ({
    api, user, token, ready, lang, t: makeT(lang),
    setLang: (l) => { setLangState(l); safe.set(storageKey + ':lang', l); if (token) api.me.update({ language: l }).catch(() => undefined); },
    setSession: (tk, u) => { safe.set(storageKey, JSON.stringify({ token: tk, user: u })); setToken(tk); setUser(u); setLangState(u.language); },
    updateUser: (u) => { setUser(u); if (token) safe.set(storageKey, JSON.stringify({ token, user: u })); },
    logout,
  }), [api, user, token, ready, lang, storageKey, logout]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('AppProvider missing');
  return c;
}
