import { useCallback, useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { rupees, type Item, type LayoutTemplate } from '@busyfrnd/shared';
import type { VendorStorePage } from '@busyfrnd/api-client';
import { Badge, Btn, Card, Err, Field, Loading, Row, Screen, StoreView, T, colors, useApp } from '@busyfrnd/mobile-core';

type Tab = 'items' | 'layout' | 'fees' | 'publish' | 'preview';
const rs = (p: number | null | undefined) => (p == null ? '' : String(p / 100));
const paise = (v: string) => (v.trim() === '' ? null : Math.round(+v * 100));

export default function StoreAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, t } = useApp();
  const [page, setPage] = useState<VendorStorePage | null>(null);
  const [layouts, setLayouts] = useState<Array<LayoutTemplate & { locked: boolean }>>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<Tab>('items');
  const [msg, setMsg] = useState('');
  const [web, setWeb] = useState(true);
  const [app, setApp] = useState(true);
  const [nm, setNm] = useState('');
  const [pr, setPr] = useState('');

  const load = useCallback(async () => {
    const [p, it] = await Promise.all([api.vendor.preview(id), api.vendor.items(id)]);
    setPage(p); setItems(it); setWeb(p.wantWeb); setApp(p.wantApp);
  }, [api, id]);
  useEffect(() => { load().catch((e) => setMsg(e.message)); api.vendor.layouts().then(setLayouts).catch(() => undefined); }, [api, load]);
  const act = async (fn: () => Promise<unknown>, ok = 'Saved ✓') => { setMsg(''); try { await fn(); await load(); setMsg(ok); } catch (e) { setMsg((e as Error).message); } };

  if (!page) return <Screen><Err msg={msg} />{!msg && <Loading />}</Screen>;
  const live = page.status === 'PUBLISHED';
  return (
    <Screen>
      <Stack.Screen options={{ title: page.name }} />
      <Row><Badge text={page.status.replace('_', ' ')} tone={live ? 'green' : 'orange'} />{page.publishWeb && <Badge text="Web" tone="blue" />}{page.publishApp && <Badge text="App" tone="blue" />}</Row>
      {page.rejectionReason ? <Card><T color={colors.danger}>Admin feedback: {page.rejectionReason}</T></Card> : null}
      {msg ? <T small>{msg}</T> : null}
      <Row>{(['items', 'layout', 'fees', 'publish', 'preview'] as Tab[]).map((x) => <Btn key={x} kind={tab === x ? 'primary' : 'secondary'} title={x} onPress={() => setTab(x)} style={{ paddingHorizontal: 12 }} />)}</Row>

      {tab === 'items' && <>
        <Card>
          <Field label="Add item" value={nm} onChangeText={setNm} placeholder="Item name" />
          <Field value={pr} onChangeText={setPr} placeholder="₹ price" keyboardType="number-pad" />
          <Btn title="Add" disabled={!nm || !pr} onPress={() => act(async () => { await api.vendor.addItems(id, [{ name: nm, pricePaise: Math.round(+pr * 100) }]); setNm(''); setPr(''); })} />
        </Card>
        {items.map((i) => (
          <Card key={i.id}>
            <Row style={{ justifyContent: 'space-between' }}><T bold>{i.name}</T><T>{rupees(i.pricePaise)}</T></Row>
            <Row style={{ justifyContent: 'space-between' }}><Row><Switch value={i.inStock} onValueChange={(v) => act(() => api.vendor.updateItem(id, i.id, { inStock: v }), 'Updated')} /><T small muted>In stock</T></Row>
              <Btn kind="secondary" title="Remove" onPress={() => act(() => api.vendor.removeItem(id, i.id), 'Removed')} /></Row>
          </Card>))}
      </>}

      {tab === 'layout' && layouts.map((l) => (
        <Card key={l.id} onPress={l.locked ? undefined : () => act(() => api.vendor.updateStore(id, { templateId: l.id }))} style={{ opacity: l.locked ? 0.5 : 1, borderColor: page.templateId === l.id ? colors.primary : colors.border, borderWidth: page.templateId === l.id ? 2 : 1 }}>
          <Row>{[l.theme.primary, l.theme.accent, l.theme.surface].map((c) => <View key={c} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c, borderWidth: 1, borderColor: '#0002' }} />)}<T bold>{l.name}</T></Row>
          <Row><Badge text={l.locked ? `🔒 ${l.tier}` : l.tier} tone={l.tier === 'BASIC' ? 'green' : l.tier === 'PLUS' ? 'blue' : 'orange'} /><T small muted>{l.sections.map((s) => s.type).join(' · ')}</T></Row>
        </Card>))}

      {tab === 'fees' && <FeesForm key={JSON.stringify(page.policy)} page={page} onSave={(b) => act(() => api.vendor.updateStore(id, b))} t={t} />}

      {tab === 'publish' && <Card>
        <T bold>Where do you want to sell?</T>
        <Row><Switch value={web} onValueChange={setWeb} /><T>Website</T></Row>
        <Row><Switch value={app} onValueChange={setApp} /><T>Customer mobile app</T></Row>
        {['DRAFT', 'REJECTED'].includes(page.status) && <Btn title={t('vendor.publish')} onPress={() => act(() => api.vendor.submit(id, web, app), 'Sent to admin for review ✓')} />}
        {page.status === 'IN_REVIEW' && <T muted>⏳ Waiting for admin review. We'll notify you.</T>}
        {['APPROVED', 'PUBLISHED'].includes(page.status) && <Row><Btn title={live ? 'Update channels' : '🚀 Publish now'} onPress={() => act(() => api.vendor.publish(id, web, app), 'Published ✓')} />{live && <Btn kind="secondary" title="Unpublish" onPress={() => act(() => api.vendor.unpublish(id), 'Taken offline')} />}</Row>}
        {page.status === 'SUSPENDED' && <T color={colors.danger}>This store is suspended. Contact support.</T>}
      </Card>}

      {tab === 'preview' && <StoreView page={page} t={t} />}
    </Screen>
  );
}

function FeesForm({ page, onSave, t }: { page: VendorStorePage; onSave: (b: Record<string, unknown>) => void; t: (k: string) => string }) {
  const p = page.policy;
  const [f, setF] = useState({ offersPickup: p.offersPickup, offersDelivery: p.offersDelivery, deliveryFee: rs(p.deliveryFee), lowOrderThreshold: rs(p.lowOrderThreshold), lowOrderDeliveryFee: rs(p.lowOrderDeliveryFee), freeDeliveryAbove: rs(p.freeDeliveryAbove), platformFee: rs(p.platformFee), handlingFee: rs(p.handlingFee), visitingFee: rs(p.visitingFee), partialPaymentEnabled: p.partialPaymentEnabled, partialPercent: String(p.partialPercent) });
  const set = (k: keyof typeof f, v: string | boolean) => setF({ ...f, [k]: v });
  const num = (k: keyof typeof f, label: string) => <Field label={`${label} (₹)`} keyboardType="number-pad" value={f[k] as string} onChangeText={(v) => set(k, v)} />;
  return (
    <Card>
      <T bold>Fulfilment</T>
      <Row><Switch value={f.offersPickup} onValueChange={(v) => { if (v || f.offersDelivery) set('offersPickup', v); }} /><T>Customer pickup</T></Row>
      <Row><Switch value={f.offersDelivery} onValueChange={(v) => { if (v || f.offersPickup) set('offersDelivery', v); }} /><T>Home delivery</T></Row>
      <T small muted>At least one must stay enabled. Pickup customers never pay a delivery fee.</T>
      {f.offersDelivery && <>{num('deliveryFee', 'Delivery fee')}{num('lowOrderThreshold', 'Low-order limit')}{num('lowOrderDeliveryFee', 'Fee below limit')}{num('freeDeliveryAbove', 'Free delivery above')}</>}
      <T bold>Charges</T>{num('platformFee', 'Platform fee')}{num('handlingFee', 'Handling charge')}{num('visitingFee', 'Visiting charge (services)')}
      <T bold>Payments</T>
      <Row><Switch value={f.partialPaymentEnabled} onValueChange={(v) => set('partialPaymentEnabled', v)} /><T>Allow part payment (full is always available)</T></Row>
      {f.partialPaymentEnabled && <Field label="Part payment % upfront" keyboardType="number-pad" value={f.partialPercent} onChangeText={(v) => set('partialPercent', v)} />}
      <Btn title={t('common.save')} onPress={() => onSave({
        offersPickup: f.offersPickup, offersDelivery: f.offersDelivery, deliveryFee: paise(f.deliveryFee) ?? 0, lowOrderThreshold: paise(f.lowOrderThreshold), lowOrderDeliveryFee: paise(f.lowOrderDeliveryFee),
        freeDeliveryAbove: paise(f.freeDeliveryAbove), platformFee: paise(f.platformFee) ?? 0, handlingFee: paise(f.handlingFee) ?? 0, visitingFee: paise(f.visitingFee) ?? 0, partialPaymentEnabled: f.partialPaymentEnabled, partialPercent: +f.partialPercent || 30,
      })} />
    </Card>
  );
}
