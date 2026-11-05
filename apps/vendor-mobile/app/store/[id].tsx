import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { categoryMeta, rupees, type Item, type LayoutTemplate } from '@busyfrnd/shared';
import type { VendorStorePage } from '@busyfrnd/api-client';
import { Badge, Btn, Card, Chip, EmptyState, Enter, Field, Icon, ProductThumb, Row, Screen, Skeleton, StoreCover, StoreView, T, Tap, Toggle, ToggleRow, colors, shadow, useApp, useToast } from '@busyfrnd/mobile-core';
import { LayoutThumb } from '../../components/LayoutThumb';
import { StatusSteps } from '../../components/StatusSteps';

type Tab = 'items' | 'layout' | 'fees' | 'publish' | 'preview';
const rs = (p: number | null | undefined) => (p == null ? '' : String(p / 100));
const paise = (v: string) => (v.trim() === '' ? null : Math.round(+v * 100));
const TABS: Array<[Tab, string]> = [['items', 'Items'], ['layout', 'Layout'], ['fees', 'Fees'], ['publish', 'Publish'], ['preview', 'Preview']];

export default function StoreAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, t } = useApp();
  const toast = useToast();
  const [page, setPage] = useState<VendorStorePage | null>(null);
  const [layouts, setLayouts] = useState<Array<LayoutTemplate & { locked: boolean }>>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<Tab>('items');
  const [web, setWeb] = useState(true);
  const [app, setApp] = useState(true);
  const [nm, setNm] = useState('');
  const [pr, setPr] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => { const [p, it] = await Promise.all([api.vendor.preview(id), api.vendor.items(id)]); setPage(p); setItems(it); setWeb(p.wantWeb); setApp(p.wantApp); }, [api, id]);
  useEffect(() => { load().catch((e) => setErr(e.message)); api.vendor.layouts().then(setLayouts).catch(() => undefined); }, [api, load]);
  const act = async (fn: () => Promise<unknown>, ok = 'Saved') => { try { await fn(); await load(); toast.show(ok, 'ok'); } catch (e) { toast.show((e as Error).message, 'error'); } };

  if (err) return <Screen><EmptyState emoji="🏪" title="Couldn’t load this store" hint={err} /></Screen>;
  if (!page) return <Screen><Skeleton style={{ height: 160, borderRadius: 28 }} /><Skeleton style={{ height: 200, borderRadius: 28 }} /></Screen>;
  const live = page.status === 'PUBLISHED', cm = categoryMeta(page.category);

  return (
    <Screen onRefresh={load} bottomInset={40}>
      <Stack.Screen options={{ title: page.name }} />
      <StoreCover category={page.category} height={170} radius={30}>
        <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
          <Row gap={6}>{page.publishWeb && <Badge text="Web" icon="globe-outline" />}{page.publishApp && <Badge text="App" icon="phone-portrait-outline" />}</Row>
          <View><T variant="caption" color="rgba(255,255,255,0.85)">{cm.emoji} {cm.label}</T><T variant="display" color="#fff">{page.name}</T></View>
        </View>
      </StoreCover>
      <Card><StatusSteps status={page.status} /></Card>
      {page.rejectionReason ? <View style={{ backgroundColor: '#FDE8EC', padding: 14, borderRadius: 20 }}><T bold color="#BE123C">Admin feedback</T><T color="#BE123C">{page.rejectionReason}</T></View> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>{TABS.map(([k, l]) => <Chip key={k} label={l} active={tab === k} onPress={() => setTab(k)} />)}</ScrollView>

      {tab === 'items' && <>
        <Card><T variant="headline">New item</T><Field value={nm} onChangeText={setNm} placeholder="e.g. Chocolate cake" /><Field value={pr} onChangeText={setPr} placeholder="Price" keyboardType="number-pad" left={<T bold>₹</T>} /><Btn full icon="add" title="Add item" disabled={!nm || !pr} onPress={() => act(async () => { await api.vendor.addItems(id, [{ name: nm, pricePaise: Math.round(+pr * 100) }]); setNm(''); setPr(''); }, 'Item added')} /></Card>
        {!items.length ? <EmptyState emoji="📦" title="No items yet" hint="Add your first product or service above." /> : items.map((i, n) => (
          <Enter key={i.id} i={n}><Card><Row style={{ flexWrap: 'nowrap' }} gap={12}><ProductThumb id={i.id} name={i.name} category={page.category} kind={i.kind} size={56} radius={16} /><View style={{ flex: 1 }}><T variant="label" numberOfLines={1}>{i.name}</T><T small muted>{i.kind === 'SERVICE' ? 'Service' : 'Product'} · {rupees(i.pricePaise)}</T></View>
            <View style={{ alignItems: 'center', gap: 2 }}><Toggle value={i.inStock} onChange={(v) => act(() => api.vendor.updateItem(id, i.id, { inStock: v }), 'Updated')} /><T small muted>{i.inStock ? 'In stock' : 'Sold out'}</T></View></Row>
            <Btn kind="soft" size="sm" icon="trash-outline" title="Remove" onPress={() => act(() => api.vendor.removeItem(id, i.id), 'Removed')} /></Card></Enter>))}
      </>}

      {tab === 'layout' && layouts.map((l, n) => (
        <Enter key={l.id} i={n}><Tap disabled={l.locked} onPress={() => act(() => api.vendor.updateStore(id, { templateId: l.id }), 'Layout applied')} style={[{ backgroundColor: '#fff', borderRadius: 26, padding: 12, gap: 10, borderWidth: 2, borderColor: page.templateId === l.id ? colors.text : colors.line, opacity: l.locked ? 0.5 : 1 }, page.templateId === l.id && shadow.lift]}>
          <LayoutThumb tpl={l} /><Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="label">{l.name}</T>{page.templateId === l.id ? <Badge tone="dark" text="Active" icon="checkmark" /> : <Badge tone={l.tier === 'BASIC' ? 'green' : l.tier === 'PLUS' ? 'blue' : 'violet'} text={l.tier} icon={l.locked ? 'lock-closed' : undefined} />}</Row>
        </Tap></Enter>))}

      {tab === 'fees' && <FeesForm key={JSON.stringify(page.policy)} page={page} onSave={(b) => act(() => api.vendor.updateStore(id, b))} t={t} />}

      {tab === 'publish' && <Card>
        <T variant="headline">Where do you want to sell?</T>
        <ToggleRow label="Website" hint="Customers can order on the web" value={web} onChange={setWeb} /><ToggleRow label="Customer mobile app" hint="Listed in the BusyFrnd app" value={app} onChange={setApp} />
        {['DRAFT', 'REJECTED'].includes(page.status) && <Btn full size="lg" kind="ai" icon="rocket" title={t('vendor.publish')} onPress={() => act(() => api.vendor.submit(id, web, app), 'Sent to admin for review')} />}
        {page.status === 'IN_REVIEW' && <View style={{ backgroundColor: '#FFF0E8', padding: 14, borderRadius: 18 }}><T bold color="#C2410C">⏳ Waiting for admin review. We’ll notify you.</T></View>}
        {['APPROVED', 'PUBLISHED'].includes(page.status) && <Row style={{ flexWrap: 'nowrap' }}><Btn kind="brand" style={{ flex: 1 }} full size="lg" icon="rocket" title={live ? 'Update channels' : 'Publish now'} onPress={() => act(() => api.vendor.publish(id, web, app), 'Published! 🎉')} />{live ? <Btn kind="soft" size="lg" title="Unpublish" onPress={() => act(() => api.vendor.unpublish(id), 'Taken offline')} /> : null}</Row>}
        {page.status === 'SUSPENDED' && <T bold color={colors.danger}>This store is suspended. Please contact support.</T>}
      </Card>}

      {tab === 'preview' && <View style={{ borderWidth: 6, borderColor: colors.text, borderRadius: 40, padding: 2, backgroundColor: '#fff' }}><StoreView page={page} t={t} /></View>}
    </Screen>
  );
}

function FeesForm({ page, onSave, t }: { page: VendorStorePage; onSave: (b: Record<string, unknown>) => void; t: (k: string) => string }) {
  const p = page.policy;
  const [f, setF] = useState({ offersPickup: p.offersPickup, offersDelivery: p.offersDelivery, deliveryFee: rs(p.deliveryFee), lowOrderThreshold: rs(p.lowOrderThreshold), lowOrderDeliveryFee: rs(p.lowOrderDeliveryFee), freeDeliveryAbove: rs(p.freeDeliveryAbove), platformFee: rs(p.platformFee), handlingFee: rs(p.handlingFee), visitingFee: rs(p.visitingFee), partialPaymentEnabled: p.partialPaymentEnabled, partialPercent: String(p.partialPercent) });
  const set = (k: keyof typeof f, v: string | boolean) => setF({ ...f, [k]: v });
  const money = (k: keyof typeof f, label: string, hint?: string) => <Field label={label} hint={hint} keyboardType="number-pad" value={f[k] as string} onChangeText={(v) => set(k, v)} left={<T bold>₹</T>} />;
  return (
    <>
      <Card><T variant="headline">Fulfilment</T>
        <ToggleRow label="Customer pickup" hint="Pickup customers never pay a delivery fee" value={f.offersPickup} onChange={(v) => { if (v || f.offersDelivery) set('offersPickup', v); }} />
        <ToggleRow label="Home delivery" value={f.offersDelivery} onChange={(v) => { if (v || f.offersPickup) set('offersDelivery', v); }} />
        <T small muted>At least one must stay enabled.</T>
        {f.offersDelivery && <>{money('deliveryFee', 'Delivery fee')}{money('freeDeliveryAbove', 'Free delivery above', 'Leave empty for none')}{money('lowOrderThreshold', 'Small-order limit', 'e.g. ₹199')}{money('lowOrderDeliveryFee', 'Fee below that limit', 'e.g. ₹50')}</>}
      </Card>
      <Card><T variant="headline">Charges</T>{money('platformFee', 'Platform fee')}{money('handlingFee', 'Handling charge')}{money('visitingFee', 'Visiting charge', 'Services only')}</Card>
      <Card><T variant="headline">Payments</T><ToggleRow label="Allow part payment" hint="Full payment is always available" value={f.partialPaymentEnabled} onChange={(v) => set('partialPaymentEnabled', v)} />{f.partialPaymentEnabled && <Field label="Part payment % upfront" keyboardType="number-pad" value={f.partialPercent} onChangeText={(v) => set('partialPercent', v)} />}</Card>
      <Btn full size="lg" title={t('common.save')} onPress={() => onSave({ offersPickup: f.offersPickup, offersDelivery: f.offersDelivery, deliveryFee: paise(f.deliveryFee) ?? 0, lowOrderThreshold: paise(f.lowOrderThreshold), lowOrderDeliveryFee: paise(f.lowOrderDeliveryFee), freeDeliveryAbove: paise(f.freeDeliveryAbove), platformFee: paise(f.platformFee) ?? 0, handlingFee: paise(f.handlingFee) ?? 0, visitingFee: paise(f.visitingFee) ?? 0, partialPaymentEnabled: f.partialPaymentEnabled, partialPercent: +f.partialPercent || 30 })} />
    </>
  );
}
