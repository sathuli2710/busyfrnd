import { useCallback, useEffect, useState } from 'react';

export const DEFAULT_LOCATION = { lat: 13.0827, lng: 80.2707, label: 'Chennai (default)' };
export type Loc = { lat: number; lng: number; label?: string };

/** Browser geolocation with manual fallback; persisted in localStorage. */
export function useLocation(key = 'bf:loc') {
  const [loc, setLocState] = useState<Loc>(DEFAULT_LOCATION);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setLocState(JSON.parse(raw)); } catch { /* ignore */ }
  }, [key]);
  const setLoc = useCallback((l: Loc) => { setLocState(l); try { localStorage.setItem(key, JSON.stringify(l)); } catch { /* ignore */ } }, [key]);
  const detect = useCallback(() => new Promise<Loc>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location not supported'));
    navigator.geolocation.getCurrentPosition(
      (p) => { const l = { lat: p.coords.latitude, lng: p.coords.longitude, label: 'Current location' }; setLoc(l); resolve(l); },
      (e) => reject(new Error(e.message)), { timeout: 10_000 });
  }), [setLoc]);
  return { loc, setLoc, detect };
}
