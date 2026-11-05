import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { rupees, type Fulfillment, type PaymentMode, type Quote, type StorePage } from '@busyfrnd/shared';
import { Btn, Card, EmptyState, Field, Icon, ProductThumb, Row, Screen, Segmented, Skeleton, T, Tap, colors, haptic, openCheckout, useApp, useToast } from '@busyfrnd/mobile-core';
import { useCart } from '../../lib/cart';

export default function Checkout() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { api, t } = useApp();
  const toast = useToast();
  const router = useRouter();
  const { cartFor, loaded, refresh } = useCart();
  const cart = cartFor(storeId);
  const [store, setStore] = useState<StorePage | null>(null);
  const [f, setF] = useState<Fulfillment>('PICKUP');
  const [mode, setMode] = useState<PaymentMode>('FULL');
  const [address, setAddress] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.catalog.store(storeId).then((s) => { setStore(s); setF(s.policy.offersPickup ? 'PICKUP' : 'DELIVERY'); }).catch((e) => toast.show(e.message, 'error')); }, [api, storeId, toast]);
  useEffect(() => { if (cart) api.cart.quote({ storeId, fulfillment: f, paymentMode: mode }).then(setQuote).catch((e) => toast.show(e.message, 'error')); }, [api, storeId, f, mode, cart, toast]);

  if (!loaded || !store) return <Screen><Skeleton style={{ height: 200, borderRadius: 24 }} /></Screen>;
  if (!cart) return <Screen><EmptyState emoji="🛒" title={t('cart.empty')} /></Screen>;

  const pay = async () => {
    setBusy(true);
    try {
      const returnUrl = 'busyfrnd-customer://pay-result';
      const r = await api.cart.checkout({ storeId, fulfillment: f, paymentMode: mode, address: address || undefined, next: returnUrl });
      await openCheckout(r.checkoutUrl, returnUrl);
      refresh(); haptic.success(); router.replace(`/order/${r.orderId}`);
    } catch (e) { toast.show((e as Error).message, 'error'); } finally { setBusy(false); }
  };
  const payOptions: Array<[PaymentMode, string, string]> = [['FULL', t('cart.fullPay'), 'Pay the full amount now'], ...(store.policy.partialPaymentEnabled ? [['PARTIAL', t('cart.partPay'), `Pay ${store.policy.partialPercent}% now, rest at the store`] as [PaymentMode, string, string]] : [])];

  return (
    <Screen bottomInset={30} footer={
      <View style={{ padding: 16, paddingBottom: 28, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: colors.line }}>
        <Btn full size="lg" title={`${t('cart.payNow')} ${quote ? rupees(quote.payNow) : ''}`} loading={busy} disabled={!quote || (f === 'DELIVERY' && !address.trim())} onPress={pay} />
        <T small muted center style={{ marginTop: 8 }}>🔒 Secure payment by Cashfree</T>
      </View>}>
      <Stack.Screen options={{ title: store.name }} />
      <Card>
        <T variant="headline">How do you want it?</T>
        <Segmented value={f} onChange={setF} options={[{ value: 'PICKUP', label: t('cart.pickup'), icon: 'storefront', disabled: !store.policy.offersPickup }, { value: 'DELIVERY', label: t('cart.delivery'), icon: 'bicycle', disabled: !store.policy.offersDelivery }]} />
        {f === 'PICKUP' ? <Animated.View entering={FadeIn} exiting={FadeOut} style={{ backgroundColor: '#E6F6EC', padding: 12, borderRadius: 16 }}><T bold color="#0B6B3A">🎉 No delivery fee — we’ll notify you when it’s ready.</T></Animated.View>
          : <Animated.View entering={FadeIn} exiting={FadeOut}><Field label="Delivery address" value={address} onChangeText={setAddress} multiline placeholder="House no, street, landmark" /></Animated.View>}
      </Card>
      <Card>
        <T variant="headline">Payment</T>
        {payOptions.map(([v, label, hint]) => (
          <Tap key={v} onPress={() => setMode(v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 2, borderColor: mode === v ? colors.text : colors.line, backgroundColor: mode === v ? '#F7F7F8' : '#fff' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: mode === v ? colors.text : colors.line, backgroundColor: mode === v ? colors.text : '#fff', alignItems: 'center', justifyContent: 'center' }}>{mode === v && <Icon name="checkmark" size={14} color="#fff" />}</View>
            <View style={{ flex: 1 }}><T variant="label">{label}</T><T small muted>{hint}</T></View>
          </Tap>))}
      </Card>
      <Card>
        <T variant="headline">Order summary</T>
        {cart.lines.map((l) => <Row key={l.itemId} style={{ flexWrap: 'nowrap' }}><ProductThumb id={l.itemId} name={l.name} kind={l.kind} size={40} radius={12} /><T variant="label" numberOfLines={1} style={{ flex: 1 }}>{l.qty} × {l.name}</T><T variant="label">{rupees(l.qty * l.pricePaise)}</T></Row>)}
        {quote && <Animated.View layout={LinearTransition} style={{ gap: 8, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.line }}>
          {quote.lines.map((l) => <Row key={l.key} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T muted>{t('fee.' + l.key)}</T><T bold>{rupees(l.amount)}</T></Row>)}
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="headline">{t('cart.total')}</T><T variant="headline">{rupees(quote.total)}</T></Row>
          {quote.payLater > 0 && <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', backgroundColor: '#F7F7F8', padding: 12, borderRadius: 14 }}><T muted>{t('cart.payLater')}</T><T bold>{rupees(quote.payLater)}</T></Row>}
        </Animated.View>}
      </Card>
    </Screen>
  );
}
