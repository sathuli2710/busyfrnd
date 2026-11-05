'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Crosshair, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { CATEGORY_META, LAYOUT_TEMPLATES, LANGUAGES, LANGUAGE_LABELS, getTemplate, rupees, suggestTemplates, type Language, type StorePage } from '@busyfrnd/shared';
import type { OnboardingDraft } from '@busyfrnd/api-client';
import { AiBadge, Button, Card, Chip, Field, Input, ProductThumb, Select, StoreView, SwitchRow, cn, toast, useApp, useLocation, useSpeech } from '@busyfrnd/web-ui';
import { VoiceCapture } from '../../components/voice';
import { LayoutThumb } from '../../components/layout-thumb';

const STEPS = ['Language', 'Tell us', 'Check', 'Look', 'Location'];
const PROCESSING = ['Listening to what you said…', 'Finding your products and prices…', 'Choosing the best layouts for you…'];

export default function Onboarding() {
  const { api, lang, setLang, t } = useApp();
  const router = useRouter();
  const { loc, detect } = useLocation('bf:vendor:loc');
  const sp = useSpeech(lang);
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
      const d = await api.ai.onboarding(text, lang); setDraft(d); setTpl(d.templateIds[0]); sp.speak(d.reply); setStep(2);
      api.vendor.layouts().then((l) => setLocked(new Set(l.filter((x) => x.locked).map((x) => x.id)))).catch(() => undefined);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
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
      toast.success('Your store is ready! 🎉'); router.replace(`/store/${s.id}`);
    } catch (e) { toast.error((e as Error).message); setBusy(false); }
  };
  const setItem = (n: number, p: Partial<OnboardingDraft['items'][number]>) => setDraft({ ...draft!, items: draft!.items.map((x, i) => (i === n ? { ...x, ...p } : x)) });

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-10 pt-5 md:px-6">
      <header className="mb-6 flex items-center gap-3">
        <Button variant="soft" size="icon" aria-label="Close" onClick={() => (step === 0 ? router.push('/') : setStep(step === 2 ? 1 : step - 1))}>{step === 0 ? <X size={18} /> : <ArrowLeft size={18} />}</Button>
        <div className="flex flex-1 gap-1.5">{STEPS.map((s, i) => <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10"><motion.div className="h-full rounded-full bg-ink" initial={false} animate={{ width: i <= step ? '100%' : 0 }} transition={{ duration: 0.4 }} /></div>)}</div>
        <span className="text-sm font-bold text-muted">{step + 1}/{STEPS.length}</span>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 && (
          <motion.div key="0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-1 flex-col justify-center gap-8 text-center">
            <div><div className="text-6xl">🗣️</div><h1 className="mt-4 text-4xl font-black tracking-tight">Which language do you speak?</h1><p className="mt-2 text-muted">You can talk to us in this language — we’ll understand.</p></div>
            <div className="grid gap-3 sm:grid-cols-3">{LANGUAGES.map((l) => (
              <button key={l} onClick={() => setLang(l as Language)} className={cn('rounded-[28px] border-2 p-6 text-3xl font-black transition active:scale-95', lang === l ? 'border-ink bg-ink text-white shadow-lift' : 'border-line bg-white hover:border-ink/30')}>{LANGUAGE_LABELS[l as Language]}{lang === l && <Check className="mx-auto mt-2" />}</button>))}</div>
            <Button size="lg" onClick={() => setStep(1)} className="mx-auto min-w-48">{t('common.next')} →</Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <AiBadge>AI Buddy</AiBadge>
            <h1 className="text-4xl font-black tracking-tight">Tell me about your shop</h1>
            <p className="max-w-lg text-muted">What’s it called? What do you sell, and for how much? Do you deliver? <br /><i>“My shop is Kumar Bakery. Cake 300 rupees, bread 40. We do home delivery.”</i></p>
            {busy ? (
              <div className="flex flex-col items-center gap-5 py-6"><div className="relative h-28 w-28"><motion.div className="absolute inset-0 rounded-full bg-gradient-to-br from-ai-500 via-ai-pink to-brand-500 shadow-ai" animate={{ rotate: 360, scale: [1, 1.08, 1] }} transition={{ rotate: { duration: 2, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.2, repeat: Infinity } }} /><Sparkles className="absolute inset-0 m-auto text-white" size={36} /></div>
                <AnimatePresence mode="wait"><motion.p key={pi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="font-bold text-ai-600">{PROCESSING[pi]}</motion.p></AnimatePresence></div>
            ) : <VoiceCapture onSubmit={understand} />}
          </motion.div>
        )}

        {step === 2 && draft && (
          <motion.div key="2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col gap-5">
            <div className="rounded-3xl bg-ai-50 p-5 ring-1 ring-ai-100"><AiBadge>Here’s what I understood</AiBadge><p className="mt-2 font-semibold">{draft.reply}</p></div>
            <Card className="flex flex-col gap-4">
              <Field label="Store name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="text-lg font-bold" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category"><Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{CATEGORY_META.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}</Select></Field>
                <Field label="Village / town"><Input value={draft.village ?? ''} onChange={(e) => setDraft({ ...draft, village: e.target.value })} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SwitchRow label={t('cart.pickup')} hint="Customers collect from your shop" checked={draft.offersPickup} onChange={(v) => (v || draft.offersDelivery) && setDraft({ ...draft, offersPickup: v })} />
                <SwitchRow label={t('cart.delivery')} hint="You deliver to customers" checked={draft.offersDelivery} onChange={(v) => (v || draft.offersPickup) && setDraft({ ...draft, offersDelivery: v })} />
              </div>
              <p className="text-xs text-muted">At least one of pickup or delivery must stay on.</p>
            </Card>
            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between"><h2 className="font-extrabold">Items ({draft.items.length})</h2><Button variant="soft" size="sm" onClick={() => setDraft({ ...draft, items: [...draft.items, { name: '', pricePaise: 0, kind: 'PRODUCT' }] })}><Plus size={16} />Add</Button></div>
              <AnimatePresence initial={false}>
                {draft.items.map((it, n) => (
                  <motion.div layout key={n} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 overflow-hidden">
                    <ProductThumb id={`d${n}`} name={it.name} category={draft.category} kind={it.kind} size={48} />
                    <Input value={it.name} onChange={(e) => setItem(n, { name: e.target.value })} placeholder="Item name" className="h-11 flex-1" />
                    <div className="relative w-28"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted">₹</span><Input type="number" value={it.pricePaise / 100} onChange={(e) => setItem(n, { pricePaise: Math.round(+e.target.value * 100) })} className="h-11 pl-7" /></div>
                    <Button variant="ghost" size="iconSm" aria-label="Remove" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== n) })}><Trash2 size={16} /></Button>
                  </motion.div>))}
              </AnimatePresence>
              {!draft.items.length && <p className="py-4 text-center text-sm text-muted">No items yet — add a few, or go back and tell me again.</p>}
            </Card>
            <Button size="lg" disabled={!draft.name.trim()} onClick={() => setStep(3)}>{t('common.next')} →</Button>
          </motion.div>
        )}

        {step === 3 && draft && preview && (
          <motion.div key="3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col gap-5">
            <div><h1 className="text-3xl font-black tracking-tight">Pick your look</h1><p className="text-muted">Tap a layout — the preview updates instantly. You can change it anytime.</p></div>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {suggestTemplates(draft.category, 4).map((tp) => (
                <button key={tp.id} disabled={locked.has(tp.id)} onClick={() => setTpl(tp.id)} className={cn('w-40 shrink-0 rounded-3xl border-2 bg-white p-2.5 text-left transition active:scale-95 disabled:opacity-40', tpl === tp.id ? 'border-ink shadow-lift' : 'border-line')}>
                  <LayoutThumb tpl={tp} /><div className="mt-2 flex items-center justify-between px-1"><span className="truncate text-sm font-bold">{tp.name}</span>{tpl === tp.id && <Check size={16} />}</div>
                </button>))}
            </div>
            <div className="rounded-[36px] border-[6px] border-ink bg-white p-1 shadow-lift"><div className="max-h-[520px] overflow-y-auto rounded-[28px]"><StoreView page={preview} t={t} /></div></div>
            <Button size="lg" onClick={() => setStep(4)}>{t('common.next')} →</Button>
          </motion.div>
        )}

        {step === 4 && draft && (
          <motion.div key="4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-1 flex-col justify-center gap-6 text-center">
            <div><div className="text-6xl">📍</div><h1 className="mt-3 text-4xl font-black tracking-tight">Where is your shop?</h1><p className="mt-2 text-muted">Customers within their search radius of this point will find you.</p></div>
            <Card className="mx-auto flex w-full max-w-md flex-col gap-3"><Button variant="soft" onClick={() => detect().then(() => toast.success('Location set')).catch((e) => toast.error(e.message))}><Crosshair size={18} />Use my current location</Button>
              <div className="rounded-2xl bg-canvas px-4 py-3 text-sm font-semibold tabular-nums">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)} <span className="text-muted">· {loc.label}</span></div></Card>
            <Button size="lg" variant="ai" loading={busy} onClick={create} className="mx-auto min-w-64"><Sparkles size={18} />Create my store ({rupees(draft.items.reduce((s, i) => s + i.pricePaise, 0))} stock value)</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
