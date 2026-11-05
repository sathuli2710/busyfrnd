import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CATEGORY_META, LAYOUT_TEMPLATES, LANGUAGES, LANGUAGE_LABELS, getTemplate, rupees, suggestTemplates, type Language, type StorePage } from '@busyfrnd/shared';
import type { OnboardingDraft } from '@busyfrnd/api-client';
import { AiBadge, Btn, Card, Chip, Field, Icon, IconBtn, ProductThumb, Row, Screen, StoreView, T, Tap, ToggleRow, colors, haptic, shadow, useApp, useLocation, useToast } from '@busyfrnd/mobile-core';
import { VoiceInput, speak } from '@busyfrnd/mobile-core/src/voice';
import { LayoutThumb } from '../components/LayoutThumb';

const STEPS = 5;
const PROCESSING = ['Listening to what you said…', 'Finding your products and prices…', 'Choosing the best layouts for you…'];

function Thinking({ text }: { text: string }) {
  const r = useSharedValue(0);
  useEffect(() => { r.value = withRepeat(withTiming(360, { duration: 1800, easing: Easing.linear }), -1); }, [r]);
  const s = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <View style={{ alignItems: 'center', gap: 18, paddingVertical: 30 }}>
      <Animated.View style={[{ width: 110, height: 110, borderRadius: 55, overflow: 'hidden' }, shadow.ai, s]}><LinearGradient colors={['#6C5CE7', '#C55CFF', '#FF5A1F']} style={{ flex: 1 }} /></Animated.View>
      <Animated.Text key={text} entering={FadeIn} exiting={FadeOut} style={{ color: '#5B49D6', fontWeight: '800', fontSize: 16 }}>{text}</Animated.Text>
    </View>
  );
}

export default function Onboarding() {
  const { api, lang, setLang, t } = useApp();
  const router = useRouter();
  const toast = useToast();
  const { loc, detect } = useLocation('bf.vendor.loc');
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [tpl, setTpl] = useState('');
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [pi, setPi] = useState(0);
  useEffect(() => { if (!busy) return; setPi(0); const i = setInterval(() => setPi((n) => Math.min(n + 1, PROCESSING.length - 1)), 1100); return () => clearInterval(i); }, [busy]);

  const understand = async (text: string) => {
    setBusy(true);
    try {
      const d = await api.ai.onboarding(text, lang); setDraft(d); setTpl(d.templateIds[0]); speak(d.reply, lang); haptic.success(); setStep(2);
      api.vendor.layouts().then((l) => setLocked(new Set(l.filter((x) => x.locked).map((x) => x.id)))).catch(() => undefined);
    } catch (e) { toast.show((e as Error).message, 'error'); } finally { setBusy(false); }
  };
  const preview = useMemo<StorePage | null>(() => {
    if (!draft) return null;
    const tp = getTemplate(tpl) ?? LAYOUT_TEMPLATES[0];
    return {
      id: 'preview', name: draft.name || 'Your Store', category: draft.category, description: draft.description, logoUrl: null, village: draft.village ?? null, lat: loc.lat, lng: loc.lng,
      offersPickup: draft.offersPickup, offersDelivery: draft.offersDelivery, templateId: tp.id, theme: tp.theme, sections: tp.sections, hours: '9 AM – 9 PM', phone: null, address: null,
      policy: { offersPickup: draft.offersPickup, offersDelivery: draft.offersDelivery, deliveryFee: draft.deliveryFeePaise ?? 0, lowOrderThreshold: null, lowOrderDeliveryFee: null, freeDeliveryAbove: null, platformFee: 0, handlingFee: 0, visitingFee: 0, partialPaymentEnabled: false, partialPercent: 30 },
      items: draft.items.map((i, n) => ({ id: `p${n}`, storeId: 'preview', name: i.name, description: null, kind: i.kind, pricePaise: i.pricePaise, imageUrl: null, category: null, inStock: true })),
    };
  }, [draft, tpl, loc]);
  const create = async () => {
    if (!draft) return; setBusy(true);
    try {
      const s = await api.vendor.createStore({ name: draft.name, category: draft.category, description: draft.description, village: draft.village, phone: draft.phone, language: lang, templateId: tpl, lat: loc.lat, lng: loc.lng, offersPickup: draft.offersPickup, offersDelivery: draft.offersDelivery, deliveryFee: draft.deliveryFeePaise ?? 0 });
      if (draft.items.length) await api.vendor.addItems(s.id, draft.items);
      haptic.success(); toast.show('Your store is ready! 🎉', 'ok'); router.replace(`/store/${s.id}`);
    } catch (e) { toast.show((e as Error).message, 'error'); setBusy(false); }
  };
  const setItem = (n: number, p: Partial<OnboardingDraft['items'][number]>) => setDraft({ ...draft!, items: draft!.items.map((x, i) => (i === n ? { ...x, ...p } : x)) });
  const back = () => (step === 0 ? router.back() : setStep(step === 2 ? 1 : step - 1));

  return (
    <Screen bg="#F7F7F8">
      <Row style={{ flexWrap: 'nowrap' }} gap={10}>
        <IconBtn name={step === 0 ? 'close' : 'arrow-back'} onPress={back} />
        <Row gap={5} style={{ flex: 1, flexWrap: 'nowrap' }}>{Array.from({ length: STEPS }).map((_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? colors.text : 'rgba(11,11,15,0.1)' }} />)}</Row>
        <T bold muted>{step + 1}/{STEPS}</T>
      </Row>

      <Animated.View key={step} entering={FadeInRight.springify().damping(20)} exiting={FadeOutLeft.duration(120)} style={{ gap: 16 }}>
        {step === 0 && <>
          <T center style={{ fontSize: 56 }}>🗣️</T><T variant="display" center>Which language do you speak?</T><T muted center>Talk to us in this language — we’ll understand.</T>
          {LANGUAGES.map((l) => <Tap key={l} onPress={() => setLang(l as Language)} style={[{ padding: 20, borderRadius: 26, borderWidth: 2, borderColor: lang === l ? colors.text : colors.line, backgroundColor: lang === l ? colors.text : '#fff', alignItems: 'center' }, lang === l && shadow.lift]}><Text style={{ fontSize: 28, fontWeight: '900', color: lang === l ? '#fff' : colors.text }}>{LANGUAGE_LABELS[l as Language]}</Text></Tap>)}
          <Btn full size="lg" title={`${t('common.next')} →`} onPress={() => setStep(1)} />
        </>}

        {step === 1 && <>
          <View style={{ alignItems: 'center', gap: 10 }}><AiBadge text="AI Buddy" /><T variant="display" center>Tell me about your shop</T></View>
          <T muted center>What’s it called? What do you sell, and for how much? Do you deliver?{'\n'}“My shop is Kumar Bakery. Cake 300 rupees, bread 40. We do home delivery.”</T>
          {busy ? <Thinking text={PROCESSING[pi]} /> : <VoiceInput onSubmit={understand} />}
        </>}

        {step === 2 && draft && <>
          <View style={{ backgroundColor: colors.aiSoft, padding: 16, borderRadius: 24, gap: 8 }}><AiBadge text="Here’s what I understood" /><T bold>{draft.reply}</T></View>
          <Card>
            <Field label="Store name" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} />
            <T variant="caption" bold color={colors.textSoft}>Category</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{CATEGORY_META.map((c) => <Chip key={c.key} emoji={c.emoji} label={c.label} active={draft.category === c.key} onPress={() => setDraft({ ...draft, category: c.key })} />)}</ScrollView>
            <Field label="Village / town" value={draft.village ?? ''} onChangeText={(v) => setDraft({ ...draft, village: v })} />
            <ToggleRow label={t('cart.pickup')} hint="Customers collect from your shop" value={draft.offersPickup} onChange={(v) => (v || draft.offersDelivery) && setDraft({ ...draft, offersPickup: v })} />
            <ToggleRow label={t('cart.delivery')} hint="You deliver to customers" value={draft.offersDelivery} onChange={(v) => (v || draft.offersPickup) && setDraft({ ...draft, offersDelivery: v })} />
            <T small muted>At least one of pickup or delivery must stay on.</T>
          </Card>
          <Card>
            <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="headline">Items ({draft.items.length})</T><Btn size="sm" kind="soft" icon="add" title="Add" onPress={() => setDraft({ ...draft, items: [...draft.items, { name: '', pricePaise: 0, kind: 'PRODUCT' }] })} /></Row>
            {draft.items.map((it, n) => (
              <Row key={n} style={{ flexWrap: 'nowrap' }} gap={8}>
                <ProductThumb id={`d${n}`} name={it.name} category={draft.category} kind={it.kind} size={44} radius={14} />
                <View style={{ flex: 1 }}><Field value={it.name} onChangeText={(v) => setItem(n, { name: v })} placeholder="Item name" /></View>
                <View style={{ width: 92 }}><Field value={String(it.pricePaise / 100)} onChangeText={(v) => setItem(n, { pricePaise: Math.round((+v || 0) * 100) })} keyboardType="number-pad" left={<Text style={{ fontWeight: '800' }}>₹</Text>} /></View>
                <IconBtn name="trash-outline" size={34} onPress={() => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== n) })} />
              </Row>))}
          </Card>
          <Btn full size="lg" title={`${t('common.next')} →`} disabled={!draft.name.trim()} onPress={() => setStep(3)} />
        </>}

        {step === 3 && draft && preview && <>
          <T variant="display">Pick your look</T><T muted>Tap a layout — the preview updates instantly.</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 6 }}>
            {suggestTemplates(draft.category, 4).map((tp) => (
              <Tap key={tp.id} disabled={locked.has(tp.id)} onPress={() => setTpl(tp.id)} style={[{ width: 150, padding: 10, borderRadius: 24, borderWidth: 2, borderColor: tpl === tp.id ? colors.text : colors.line, backgroundColor: '#fff', gap: 8, opacity: locked.has(tp.id) ? 0.4 : 1 }, tpl === tp.id && shadow.lift]}>
                <LayoutThumb tpl={tp} /><Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><T variant="label" numberOfLines={1} style={{ flex: 1 }}>{tp.name}</T>{tpl === tp.id ? <Icon name="checkmark-circle" size={18} /> : null}</Row>
              </Tap>))}
          </ScrollView>
          <View style={{ borderWidth: 6, borderColor: colors.text, borderRadius: 40, padding: 2, backgroundColor: '#fff' }}><StoreView page={preview} t={t} /></View>
          <Btn full size="lg" title={`${t('common.next')} →`} onPress={() => setStep(4)} />
        </>}

        {step === 4 && draft && <>
          <T center style={{ fontSize: 56 }}>📍</T><T variant="display" center>Where is your shop?</T><T muted center>Customers within their search radius of this point will find you.</T>
          <Card><Btn full kind="soft" icon="locate" title="Use my current location" onPress={() => detect().then(() => toast.show('Location set', 'ok')).catch((e) => toast.show(e.message, 'error'))} /><T center bold>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</T><T small muted center>{loc.label}</T></Card>
          <Btn full size="lg" kind="ai" icon="sparkles" title={`Create my store`} loading={busy} onPress={create} />
          <T small muted center>{draft.items.length} items · {rupees(draft.items.reduce((s, i) => s + i.pricePaise, 0))} stock value</T>
        </>}
      </Animated.View>
    </Screen>
  );
}
