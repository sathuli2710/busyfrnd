'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LAYOUT_TEMPLATES, LANGUAGES, LANGUAGE_LABELS, STORE_CATEGORIES, getTemplate, rupees, suggestTemplates, type Language, type StorePage } from '@busyfrnd/shared';
import type { OnboardingDraft } from '@busyfrnd/api-client';
import { StoreView, useApp, useLocation, useSpeech } from '@busyfrnd/web-ui';
import { VoiceInput } from '../voice';

export default function Onboarding() {
  const { api, lang, setLang, t } = useApp();
  const router = useRouter();
  const { loc, detect } = useLocation('bf:vendor:loc');
  const sp = useSpeech(lang);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [tpl, setTpl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [locks, setLocks] = useState<Set<string>>(new Set());

  const understand = async (text: string) => {
    setBusy(true); setErr('');
    try { const d = await api.ai.onboarding(text, lang); setDraft(d); setTpl(d.templateIds[0]); sp.speak(d.reply); setStep(2);
      api.vendor.layouts().then((l) => setLocks(new Set(l.filter((x) => x.locked).map((x) => x.id)))).catch(() => undefined);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const preview = useMemo<StorePage | null>(() => {
    if (!draft) return null;
    const template = getTemplate(tpl) ?? LAYOUT_TEMPLATES[0];
    return {
      id: 'preview', name: draft.name || 'Your Store', category: draft.category, description: draft.description, logoUrl: null, village: draft.village ?? null, lat: loc.lat, lng: loc.lng,
      offersPickup: draft.offersPickup, offersDelivery: draft.offersDelivery, templateId: template.id, theme: template.theme, sections: template.sections, hours: '9 AM – 9 PM', phone: null, address: null,
      policy: { offersPickup: draft.offersPickup, offersDelivery: draft.offersDelivery, deliveryFee: draft.deliveryFeePaise ?? 0, lowOrderThreshold: null, lowOrderDeliveryFee: null, freeDeliveryAbove: null, platformFee: 0, handlingFee: 0, visitingFee: 0, partialPaymentEnabled: false, partialPercent: 30 },
      items: draft.items.map((i, n) => ({ id: String(n), storeId: 'preview', name: i.name, description: null, kind: i.kind, pricePaise: i.pricePaise, imageUrl: null, category: null, inStock: true })),
    };
  }, [draft, tpl, loc]);

  const create = async () => {
    if (!draft) return;
    setBusy(true); setErr('');
    try {
      const store = await api.vendor.createStore({
        name: draft.name, category: draft.category, description: draft.description, village: draft.village, phone: draft.phone, language: lang, templateId: tpl, lat: loc.lat, lng: loc.lng,
        offersPickup: draft.offersPickup, offersDelivery: draft.offersDelivery, deliveryFee: draft.deliveryFeePaise ?? 0, platformFee: 0,
      });
      if (draft.items.length) await api.vendor.addItems(store.id, draft.items);
      router.replace(`/store/${store.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  const setItem = (n: number, p: Partial<OnboardingDraft['items'][number]>) => setDraft({ ...draft!, items: draft!.items.map((x, i) => (i === n ? { ...x, ...p } : x)) });

  return (
    <div className="col" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="row small muted">{['Language', 'Tell us', 'Check', 'Look', 'Location'].map((s, i) => <span key={s} className={`badge ${i === step ? 'orange' : ''}`}>{i + 1}. {s}</span>)}</div>
      {err && <div className="error">{err}</div>}

      {step === 0 && <div className="card col" style={{ alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Choose your language / भाषा चुनें / மொழியைத் தேர்ந்தெடுக்கவும்</h2>
        <div className="row">{LANGUAGES.map((l) => <button key={l} className={`btn big ${lang === l ? '' : 'secondary'}`} onClick={() => setLang(l as Language)}>{LANGUAGE_LABELS[l]}</button>)}</div>
        <button className="btn big" onClick={() => setStep(1)}>{t('common.next')} →</button>
      </div>}

      {step === 1 && <div className="card col">
        <h2 style={{ margin: 0 }}>🎤 {t('vendor.speak')}</h2>
        <p className="muted">Tell me about your shop in your own words — its name, what you sell with prices, where it is, and whether you deliver. Example: <i>“My shop is Kumar Bakery. Cake 300 rupees, bread 40 rupees. We do home delivery.”</i></p>
        <VoiceInput onSubmit={understand} busy={busy} />
        {busy && <div className="muted">{t('common.loading')}</div>}
      </div>}

      {step === 2 && draft && <div className="card col">
        <div className="card" style={{ background: '#fff7e6' }}>🤖 {draft.reply}</div>
        <label>Store name<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>Category<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{STORE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Village / town<input value={draft.village ?? ''} onChange={(e) => setDraft({ ...draft, village: e.target.value })} /></label>
        <div className="row">
          <label className="row" style={{ flexDirection: 'row' }}><input type="checkbox" style={{ width: 'auto' }} checked={draft.offersPickup} onChange={(e) => (e.target.checked || draft.offersDelivery) && setDraft({ ...draft, offersPickup: e.target.checked })} /> {t('cart.pickup')}</label>
          <label className="row" style={{ flexDirection: 'row' }}><input type="checkbox" style={{ width: 'auto' }} checked={draft.offersDelivery} onChange={(e) => (e.target.checked || draft.offersPickup) && setDraft({ ...draft, offersDelivery: e.target.checked })} /> {t('cart.delivery')}</label>
          <span className="small muted">(at least one must stay on)</span>
        </div>
        <b>Items ({draft.items.length})</b>
        {draft.items.map((it, n) => (
          <div key={n} className="row">
            <input style={{ flex: 2, minWidth: 140 }} value={it.name} onChange={(e) => setItem(n, { name: e.target.value })} />
            <input style={{ width: 100 }} type="number" value={it.pricePaise / 100} onChange={(e) => setItem(n, { pricePaise: Math.round(+e.target.value * 100) })} />
            <select style={{ width: 120 }} value={it.kind} onChange={(e) => setItem(n, { kind: e.target.value as 'PRODUCT' | 'SERVICE' })}><option>PRODUCT</option><option>SERVICE</option></select>
            <button className="btn secondary" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== n) })}>✕</button>
          </div>))}
        <button className="btn ghost" onClick={() => setDraft({ ...draft, items: [...draft.items, { name: '', pricePaise: 0, kind: 'PRODUCT' }] })}>＋ Add item</button>
        <div className="row"><button className="btn secondary" onClick={() => setStep(1)}>{t('common.back')}</button><button className="btn big" disabled={!draft.name.trim()} onClick={() => setStep(3)}>{t('common.next')} →</button></div>
      </div>}

      {step === 3 && draft && preview && <div className="col">
        <div className="card"><b>Pick how your store looks</b> <span className="muted small">— tap one, preview updates instantly. You can change it later.</span>
          <div className="row" style={{ marginTop: 10 }}>{[...suggestTemplates(draft.category, 4)].map((tp) => (
            <button key={tp.id} disabled={locks.has(tp.id)} className={`btn ${tpl === tp.id ? '' : 'secondary'}`} onClick={() => setTpl(tp.id)}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 6, background: tp.theme.primary, marginRight: 6 }} />{tp.name}</button>))}</div>
        </div>
        <StoreView page={preview} t={t} />
        <div className="row"><button className="btn secondary" onClick={() => setStep(2)}>{t('common.back')}</button><button className="btn big" onClick={() => setStep(4)}>{t('common.next')} →</button></div>
      </div>}

      {step === 4 && draft && <div className="card col">
        <h3 style={{ margin: 0 }}>📍 Where is your shop?</h3>
        <p className="muted small">Customers within their search radius of this point will see your store.</p>
        <button className="btn secondary" onClick={() => detect().catch((e) => setErr(e.message))}>Use my current location</button>
        <div className="row"><label>Latitude<input value={loc.lat} readOnly /></label><label>Longitude<input value={loc.lng} readOnly /></label></div>
        <div className="small muted">{loc.label}</div>
        <div className="row"><button className="btn secondary" onClick={() => setStep(3)}>{t('common.back')}</button><button className="btn big" disabled={busy} onClick={create}>{t('common.save')} ✓ ({draft.items.length} items · {rupees(draft.items.reduce((s, i) => s + i.pricePaise, 0))} total value)</button></div>
      </div>}
    </div>
  );
}
