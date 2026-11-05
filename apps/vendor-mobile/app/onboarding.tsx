import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { LAYOUT_TEMPLATES, LANGUAGES, LANGUAGE_LABELS, STORE_CATEGORIES, getTemplate, rupees, suggestTemplates, type Language, type StorePage } from '@busyfrnd/shared';
import type { OnboardingDraft } from '@busyfrnd/api-client';
import { Badge, Btn, Card, Err, Field, Row, Screen, StoreView, T, useApp, useLocation } from '@busyfrnd/mobile-core';
import { VoiceInput, speak } from '@busyfrnd/mobile-core/src/voice';
import { Pressable, ScrollView } from 'react-native';

export default function Onboarding() {
  const { api, lang, setLang, t } = useApp();
  const router = useRouter();
  const { loc, detect } = useLocation('bf.vendor.loc');
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [tpl, setTpl] = useState('');
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const understand = async (text: string) => {
    setBusy(true); setErr('');
    try {
      const d = await api.ai.onboarding(text, lang);
      setDraft(d); setTpl(d.templateIds[0]); speak(d.reply, lang); setStep(2);
      api.vendor.layouts().then((l) => setLocked(new Set(l.filter((x) => x.locked).map((x) => x.id)))).catch(() => undefined);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const preview = useMemo<StorePage | null>(() => {
    if (!draft) return null;
    const tp = getTemplate(tpl) ?? LAYOUT_TEMPLATES[0];
    return {
      id: 'preview', name: draft.name || 'Your Store', category: draft.category, description: draft.description, logoUrl: null, village: draft.village ?? null, lat: loc.lat, lng: loc.lng,
      offersPickup: draft.offersPickup, offersDelivery: draft.offersDelivery, templateId: tp.id, theme: tp.theme, sections: tp.sections, hours: '9 AM – 9 PM', phone: null, address: null,
      policy: { offersPickup: draft.offersPickup, offersDelivery: draft.offersDelivery, deliveryFee: draft.deliveryFeePaise ?? 0, lowOrderThreshold: null, lowOrderDeliveryFee: null, freeDeliveryAbove: null, platformFee: 0, handlingFee: 0, visitingFee: 0, partialPaymentEnabled: false, partialPercent: 30 },
      items: draft.items.map((i, n) => ({ id: String(n), storeId: 'preview', name: i.name, description: null, kind: i.kind, pricePaise: i.pricePaise, imageUrl: null, category: null, inStock: true })),
    };
  }, [draft, tpl, loc]);

  const create = async () => {
    if (!draft) return;
    setBusy(true); setErr('');
    try {
      const s = await api.vendor.createStore({ name: draft.name, category: draft.category, description: draft.description, village: draft.village, phone: draft.phone, language: lang, templateId: tpl, lat: loc.lat, lng: loc.lng, offersPickup: draft.offersPickup, offersDelivery: draft.offersDelivery, deliveryFee: draft.deliveryFeePaise ?? 0 });
      if (draft.items.length) await api.vendor.addItems(s.id, draft.items);
      router.replace(`/store/${s.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  const setItem = (n: number, p: Partial<OnboardingDraft['items'][number]>) => setDraft({ ...draft!, items: draft!.items.map((x, i) => (i === n ? { ...x, ...p } : x)) });

  return (
    <Screen>
      <Row>{['Language', 'Tell us', 'Check', 'Look', 'Location'].map((s, i) => <Badge key={s} text={`${i + 1}. ${s}`} tone={i === step ? 'orange' : 'gray'} />)}</Row>
      <Err msg={err} />

      {step === 0 && <Card>
        <T bold size={18}>भाषा चुनें · மொழியைத் தேர்ந்தெடுக்கவும் · Choose language</T>
        <Row>{LANGUAGES.map((l) => <Btn key={l} kind={lang === l ? 'primary' : 'secondary'} title={LANGUAGE_LABELS[l as Language]} onPress={() => setLang(l as Language)} />)}</Row>
        <Btn title={`${t('common.next')} →`} onPress={() => setStep(1)} />
      </Card>}

      {step === 1 && <Card>
        <T bold size={18}>🎤 {t('vendor.speak')}</T>
        <T muted>Tell me about your shop: its name, what you sell with prices, where it is, and whether you deliver. Example: “My shop is Kumar Bakery. Cake 300 rupees, bread 40 rupees. We do home delivery.”</T>
        <VoiceInput onSubmit={understand} busy={busy} />
      </Card>}

      {step === 2 && draft && <Card>
        <Card style={{ backgroundColor: '#FFF7E6' }}><T>🤖 {draft.reply}</T></Card>
        <Field label="Store name" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} />
        <T small muted bold>Category</T>
        <ScrollView horizontal contentContainerStyle={{ gap: 6 }}>{STORE_CATEGORIES.map((c) => <Pressable key={c} onPress={() => setDraft({ ...draft, category: c })}><Badge text={c} tone={draft.category === c ? 'orange' : 'gray'} /></Pressable>)}</ScrollView>
        <Field label="Village / town" value={draft.village ?? ''} onChangeText={(v) => setDraft({ ...draft, village: v })} />
        <Row>
          <Btn kind={draft.offersPickup ? 'primary' : 'secondary'} title={`${draft.offersPickup ? '✓ ' : ''}${t('cart.pickup')}`} onPress={() => (!draft.offersPickup || draft.offersDelivery) && setDraft({ ...draft, offersPickup: !draft.offersPickup })} />
          <Btn kind={draft.offersDelivery ? 'primary' : 'secondary'} title={`${draft.offersDelivery ? '✓ ' : ''}${t('cart.delivery')}`} onPress={() => (!draft.offersDelivery || draft.offersPickup) && setDraft({ ...draft, offersDelivery: !draft.offersDelivery })} />
        </Row>
        <T small muted>At least one of pickup / delivery must stay on.</T>
        <T bold>Items ({draft.items.length})</T>
        {draft.items.map((it, n) => (
          <Row key={n}>
            <Field style={{ minWidth: 150 }} value={it.name} onChangeText={(v) => setItem(n, { name: v })} />
            <Field style={{ width: 90 }} keyboardType="number-pad" value={String(it.pricePaise / 100)} onChangeText={(v) => setItem(n, { pricePaise: Math.round((+v || 0) * 100) })} />
            <Btn kind="secondary" title="✕" onPress={() => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== n) })} />
          </Row>))}
        <Btn kind="ghost" title="＋ Add item" onPress={() => setDraft({ ...draft, items: [...draft.items, { name: '', pricePaise: 0, kind: 'PRODUCT' }] })} />
        <Row><Btn kind="secondary" title={t('common.back')} onPress={() => setStep(1)} /><Btn title={`${t('common.next')} →`} disabled={!draft.name.trim()} onPress={() => setStep(3)} /></Row>
      </Card>}

      {step === 3 && draft && preview && <>
        <Card>
          <T bold>Pick how your store looks</T>
          <Row>{suggestTemplates(draft.category, 4).map((tp) => <Btn key={tp.id} kind={tpl === tp.id ? 'primary' : 'secondary'} disabled={locked.has(tp.id)} title={tp.name} onPress={() => setTpl(tp.id)} />)}</Row>
        </Card>
        <StoreView page={preview} t={t} />
        <Row><Btn kind="secondary" title={t('common.back')} onPress={() => setStep(2)} /><Btn title={`${t('common.next')} →`} onPress={() => setStep(4)} /></Row>
      </>}

      {step === 4 && draft && <Card>
        <T bold size={17}>📍 Where is your shop?</T>
        <T muted small>Customers within their search radius of this point will see your store.</T>
        <Btn kind="secondary" title="Use my current location" onPress={() => detect().catch((e) => setErr(e.message))} />
        <T small>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)} · {loc.label}</T>
        <Row><Btn kind="secondary" title={t('common.back')} onPress={() => setStep(3)} /><Btn title={`${t('common.save')} ✓ (${draft.items.length} items · ${rupees(draft.items.reduce((s, i) => s + i.pricePaise, 0))})`} loading={busy} onPress={create} /></Row>
      </Card>}
    </Screen>
  );
}
