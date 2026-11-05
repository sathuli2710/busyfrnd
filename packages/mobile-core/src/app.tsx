import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { kv } from './kv';
import { createApi, type Api } from '@busyfrnd/api-client';
import { makeT, type Language, type SessionUser } from '@busyfrnd/shared';

interface Ctx {
  apiUrl: string; setApiUrl: (u: string) => Promise<void>;
  api: Api; user: SessionUser | null; ready: boolean; lang: Language; t: (k: string) => string;
  setLang: (l: Language) => void; setSession: (token: string, user: SessionUser) => Promise<void>; logout: () => Promise<void>; updateUser: (u: SessionUser) => void;
}
const C = createContext<Ctx | null>(null);

const store = kv;

export function AppProvider({ storageKey, apiUrl: defaultApiUrl, children }: { storageKey: string; apiUrl: string; children: ReactNode }) {
  const [apiUrl, setApiUrlState] = useState(defaultApiUrl);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [lang, setLangState] = useState<Language>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await store.get(storageKey);
      if (raw) { try { const s = JSON.parse(raw); setToken(s.token); setUser(s.user); setLangState(s.user?.language ?? 'en'); } catch { /* ignore */ } }
      const override = await store.get(storageKey + '.apiUrl');
      if (override) setApiUrlState(override);
      const l = (await store.get(storageKey + '.lang')) as Language | null;
      if (l) setLangState(l);
      setReady(true);
    })();
  }, [storageKey]);

  const logout = useCallback(async () => { await store.del(storageKey); setToken(null); setUser(null); }, [storageKey]);
  const api = useMemo(() => createApi({ baseUrl: apiUrl, channel: 'app', getToken: () => token, onUnauthorized: () => { logout(); } }), [apiUrl, token, logout]);

  const value = useMemo<Ctx>(() => ({
    api, user, ready, lang, t: makeT(lang), apiUrl,
    setApiUrl: async (u) => { const v = u.trim().replace(/\/$/, '') || defaultApiUrl; await store.set(storageKey + '.apiUrl', v); setApiUrlState(v); },
    setLang: (l) => { setLangState(l); store.set(storageKey + '.lang', l); if (token) api.me.update({ language: l }).catch(() => undefined); },
    setSession: async (tk, u) => { await store.set(storageKey, JSON.stringify({ token: tk, user: u })); setToken(tk); setUser(u); setLangState(u.language); },
    updateUser: (u) => { setUser(u); if (token) store.set(storageKey, JSON.stringify({ token, user: u })); },
    logout,
  }), [api, user, ready, lang, token, storageKey, logout, apiUrl, defaultApiUrl]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useApp() {
  const c = useContext(C);
  if (!c) throw new Error('AppProvider missing');
  return c;
}
