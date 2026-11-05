import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { rupees, type Cart, type Fulfillment, type PaymentMode, type Quote, type StorePage } from '@busyfrnd/shared';
import { Btn, Card, Err, Field, Loading, Row, Screen, T, openCheckout, useApp } from '@busyfrnd/mobile-core';

export default function Checkout() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { api, t } = useApp();
  const router = useRouter();
  const [store, setStore] = useState<StorePage | null>(null);
  const [cart, setCart] = useState<Cart | null | undefined>(undefined);
  const [f, setF] = useState<Fulfillment>('PICKUP');
  const [mode, setMode] = useState<PaymentMode>('FULL');
  const [address, setAddress] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.catalog.store(storeId).then((s) => { setStore(s); setF(s.policy.offersPickup ? 'PICKUP' : 'DELIVERY'); }).catch((e) => setErr(e.message));
    api.cart.list().then((cs) => setCart(cs.find((c) => c.storeId === storeId) ?? null));
  }, [api, storeId]);
  useEffect(() => { if (cart) api.cart.quote({ storeId, fulfillment: f, paymentMode: mode }).then((q) => { setQuote(q); setErr(''); }).catch((e) => setErr(e.message)); }, [api, storeId, f, mode, cart]);

  if (cart === undefined || !store) return <Screen><Err msg={err} />{!err && <Loading />}</Screen>;
  if (!cart) return <Screen><T muted>{t('cart.empty')}</T></Screen>;

  const pay = async () => {
    setBusy(true); setErr('');
    try {
      const returnUrl = 'busyfrnd-customer://pay-result';
      const r = await api.cart.checkout({ storeId, fulfillment: f, paymentMode: mode, address: address || undefined, next: returnUrl });
      await openCheckout(r.checkoutUrl, returnUrl);
      router.replace(`/order/${r.orderId}`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: store.name }} />
      <Card>{cart.lines.map((l) => <Row key={l.itemId} style={{ justifyContent: 'space-between' }}><T>{l.qty} × {l.name}</T><T>{rupees(l.qty * l.pricePaise)}</T></Row>)}</Card>
      <Card>
        <T bold>Pickup or delivery?</T>
        <Row>
          {store.policy.offersPickup && <Btn kind={f === 'PICKUP' ? 'primary' : 'secondary'} title={`🏪 ${t('cart.pickup')} · free`} onPress={() => setF('PICKUP')} />}
          {store.policy.offersDelivery && <Btn kind={f === 'DELIVERY' ? 'primary' : 'secondary'} title={`🛵 ${t('cart.delivery')}`} onPress={() => setF('DELIVERY')} />}
        </Row>
        {f === 'DELIVERY' && <Field label="Delivery address" value={address} onChangeText={setAddress} multiline />}
      </Card>
      <Card>
        <T bold>Payment</T>
        <Row>
          <Btn kind={mode === 'FULL' ? 'primary' : 'secondary'} title={t('cart.fullPay')} onPress={() => setMode('FULL')} />
          {store.policy.partialPaymentEnabled && <Btn kind={mode === 'PARTIAL' ? 'primary' : 'secondary'} title={`${t('cart.partPay')} (${store.policy.partialPercent}%)`} onPress={() => setMode('PARTIAL')} />}
        </Row>
      </Card>
      {quote && (
        <Card>
          {quote.lines.map((l) => <Row key={l.key} style={{ justifyContent: 'space-between' }}><T>{t('fee.' + l.key)}</T><T>{rupees(l.amount)}</T></Row>)}
          <Row style={{ justifyContent: 'space-between' }}><T bold>{t('cart.total')}</T><T bold>{rupees(quote.total)}</T></Row>
          <Row style={{ justifyContent: 'space-between' }}><T>{t('cart.payNow')}</T><T bold color="#2E7D32">{rupees(quote.payNow)}</T></Row>
          {quote.payLater > 0 && <Row style={{ justifyContent: 'space-between' }}><T muted>{t('cart.payLater')}</T><T muted>{rupees(quote.payLater)}</T></Row>}
        </Card>)}
      <Err msg={err} />
      <Btn title={`${t('cart.payNow')} ${quote ? rupees(quote.payNow) : ''}`} loading={busy} disabled={!quote || (f === 'DELIVERY' && !address.trim())} onPress={pay} />
    </Screen>
  );
}
