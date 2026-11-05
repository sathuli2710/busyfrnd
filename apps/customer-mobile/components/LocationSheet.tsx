import { useState } from 'react';
import { View } from 'react-native';
import { DEFAULT_RADIUS_KM, MAX_RADIUS_KM, MIN_RADIUS_KM } from '@busyfrnd/shared';
import { Btn, Chip, IconBtn, Row, Sheet, T, haptic, useApp, useLocation, useToast } from '@busyfrnd/mobile-core';

const PRESETS = [{ label: 'Chennai', lat: 13.0827, lng: 80.2707 }, { label: 'Bengaluru', lat: 12.9716, lng: 77.5946 }, { label: 'Hyderabad', lat: 17.385, lng: 78.4867 }, { label: 'Mumbai', lat: 19.076, lng: 72.8777 }, { label: 'Delhi', lat: 28.6139, lng: 77.209 }];

export function LocationSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { api, user, updateUser, t } = useApp();
  const { loc, setLoc, detect } = useLocation();
  const toast = useToast();
  const [radius, setRadius] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const r = radius ?? user?.radiusKm ?? DEFAULT_RADIUS_KM;
  const clamp = (n: number) => Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, n));
  const commit = async () => { if (user && r !== user.radiusKm) { try { updateUser(await api.me.update({ radiusKm: r })); } catch { /* ignore */ } } };
  return (
    <Sheet visible={visible} onClose={() => { commit(); onClose(); }} title="Your location">
      <Btn kind="soft" full icon="locate" title="Use my current location" loading={busy} onPress={async () => { setBusy(true); try { await detect(); toast.show('Location updated', 'ok'); } catch (e) { toast.show((e as Error).message, 'error'); } finally { setBusy(false); } }} />
      <Row>{PRESETS.map((p) => <Chip key={p.label} label={p.label} active={loc.label === p.label} onPress={() => setLoc(p)} />)}</Row>
      <View style={{ gap: 10 }}>
        <T variant="label">{t('settings.radius')}</T>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><IconBtn name="remove" onPress={() => { haptic.light(); setRadius(clamp(r - 5)); }} /><T variant="display">{r} km</T><IconBtn name="add" onPress={() => { haptic.light(); setRadius(clamp(r + 5)); }} /></Row>
      </View>
      <Btn full size="lg" title="Done" onPress={() => { commit(); onClose(); }} />
    </Sheet>
  );
}
