import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { kv } from './kv';

export const DEFAULT_LOCATION = { lat: 13.0827, lng: 80.2707, label: 'Chennai (default)' };
export type Loc = { lat: number; lng: number; label?: string };

export function useLocation(key = 'bf.loc') {
  const [loc, setLocState] = useState<Loc>(DEFAULT_LOCATION);
  useEffect(() => { kv.get(key).then((r) => { if (r) setLocState(JSON.parse(r)); }).catch(() => undefined); }, [key]);
  const setLoc = useCallback((l: Loc) => { setLocState(l); kv.set(key, JSON.stringify(l)); }, [key]);
  const detect = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) throw new Error('Location permission denied');
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const l = { lat: p.coords.latitude, lng: p.coords.longitude, label: 'Current location' };
    setLoc(l);
    return l;
  }, [setLoc]);
  return { loc, setLoc, detect };
}
