'use client';
import { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { DEFAULT_RADIUS_KM, MAX_RADIUS_KM, MIN_RADIUS_KM } from '@busyfrnd/shared';
import { Button, Chip, Sheet, toast, useApp, useLocation } from '@busyfrnd/web-ui';

const PRESETS = [
  { label: 'Chennai', lat: 13.0827, lng: 80.2707 }, { label: 'Bengaluru', lat: 12.9716, lng: 77.5946 }, { label: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { label: 'Mumbai', lat: 19.076, lng: 72.8777 }, { label: 'Delhi', lat: 28.6139, lng: 77.209 }, { label: 'Kolkata', lat: 22.5726, lng: 88.3639 },
];

export function LocationSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { api, user, updateUser, t } = useApp();
  const { loc, setLoc, detect } = useLocation();
  const [radius, setRadius] = useState<number | null>(null);
  const r = radius ?? user?.radiusKm ?? DEFAULT_RADIUS_KM;
  const [busy, setBusy] = useState(false);
  const commitRadius = async (v: number) => { if (!user) return; try { updateUser(await api.me.update({ radiusKm: v })); } catch { /* ignore */ } };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Delivery location" description="We show stores within your radius.">
      <div className="flex flex-col gap-5">
        <Button variant="soft" block loading={busy} onClick={async () => { setBusy(true); try { await detect(); toast.success('Location updated'); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }}><Crosshair size={18} />Use my current location</Button>
        <div className="flex flex-wrap gap-2">{PRESETS.map((p) => <Chip key={p.label} active={loc.label === p.label} onClick={() => setLoc(p)}>{p.label}</Chip>)}</div>
        <div>
          <div className="mb-2 flex items-baseline justify-between"><span className="text-sm font-semibold">{t('settings.radius')}</span><span className="text-2xl font-black tabular-nums">{r} km</span></div>
          <input type="range" min={MIN_RADIUS_KM} max={MAX_RADIUS_KM} value={r} onChange={(e) => setRadius(+e.target.value)} onPointerUp={() => commitRadius(r)} onKeyUp={() => commitRadius(r)} className="h-2 w-full cursor-pointer accent-ink" aria-label={t('settings.radius')} />
        </div>
        <Button size="lg" block onClick={() => { commitRadius(r); onOpenChange(false); }}>Done</Button>
      </div>
    </Sheet>
  );
}
