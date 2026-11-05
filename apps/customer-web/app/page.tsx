'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Search as SearchIcon, X } from 'lucide-react';
import { CATEGORY_META, DEFAULT_RADIUS_KM, fill, greeting, rupees, type StoreSummary } from '@busyfrnd/shared';
import type { ShopAnswer } from '@busyfrnd/api-client';
import { AiBadge, AiBubble, AiPromptBar, Button, CategoryTile, EmptyState, ProductThumb, Reveal, Skeleton, Stagger, StaggerItem, TypingDots, toast, useApp, useLocation } from '@busyfrnd/web-ui';
import { StoreCard } from '../components/store-card';

const SUGGESTIONS = ['birthday cake under ₹500', 'phone charger near me', 'haircut and beard trim', 'rice and dal for the week'];

export default function Home() {
  const { api, user, t, ready } = useApp();
  const { loc } = useLocation();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [stores, setStores] = useState<StoreSummary[] | null>(null);
  const [ai, setAi] = useState<{ q: string; res?: ShopAnswer; busy: boolean } | null>(null);
  const radius = user?.radiusKm ?? DEFAULT_RADIUS_KM;
  const aiRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try { setStores(await api.catalog.stores({ ...loc, radius, category: cat || undefined })); } catch (e) { toast.error((e as Error).message); setStores([]); }
  }, [api, loc, radius, cat]);
  useEffect(() => { if (ready) { setStores(null); load(); } }, [ready, load]);

  const ask = async (text: string) => {
    if (!user) { router.push('/login'); return; }
    setAi({ q: text, busy: true });
    setTimeout(() => aiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    try { const res = await api.ai.shop({ text, ...loc, radius, language: user.language }); setAi({ q: text, res, busy: false }); }
    catch (e) { toast.error((e as Error).message); setAi(null); }
  };

  const hello = t(`hello.${greeting()}`);
  return (
    <div className="flex flex-col gap-8">
      <Reveal className="flex flex-col gap-5 pt-2">
        <div><p className="text-sm font-semibold text-muted">{hello}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</p>
          <h1 className="mt-1 text-[34px] font-black leading-[1.05] tracking-tight md:text-5xl">{t('home.categories')}</h1></div>
        <AiPromptBar value={q} onChange={setQ} onSubmit={ask} busy={ai?.busy} placeholder={t('ai.askPlaceholder')} suggestions={SUGGESTIONS} onPickSuggestion={(s) => { setQ(s); ask(s); }} />
      </Reveal>

      <AnimatePresence>
        {ai && (
          <motion.section ref={aiRef} key="ai" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-3 rounded-[32px] bg-gradient-to-br from-ai-50 to-white p-4 ring-1 ring-ai-100 md:p-6">
              <div className="flex items-center justify-between"><AiBadge>{t('ai.title')}</AiBadge><button onClick={() => setAi(null)} aria-label="Dismiss" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5"><X size={16} /></button></div>
              <AiBubble who="me">{ai.q}</AiBubble>
              {ai.busy ? <div className="self-start rounded-3xl border border-line bg-white px-4"><TypingDots /></div> : ai.res && (
                <>
                  <AiBubble who="ai">{ai.res.reply}</AiBubble>
                  {ai.res.items.length > 0 ? (
                    <Stagger className="grid gap-3 sm:grid-cols-2">
                      {ai.res.items.map((i) => (
                        <StaggerItem key={i.id}>
                          <Link href={`/store/${i.storeId}`} className="flex items-center gap-3 rounded-3xl border border-line bg-white p-3 shadow-soft transition hover:shadow-lift active:scale-[0.99]">
                            <ProductThumb id={i.id} name={i.name} kind={i.kind} size={56} />
                            <div className="min-w-0 flex-1"><div className="truncate font-bold">{i.name}</div><div className="truncate text-xs text-muted">{i.storeName} · {i.distanceKm} {t('store.km')}</div></div>
                            <div className="font-extrabold tabular-nums">{rupees(i.pricePaise)}</div>
                          </Link>
                        </StaggerItem>
                      ))}
                    </Stagger>
                  ) : <p className="px-1 text-sm text-muted">Try different words, or browse the stores below.</p>}
                </>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section aria-label="Categories">
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
          <CategoryTile emoji="✨" label="All" gradient={['#0B0B0F', '#3A3A44']} active={!cat} onClick={() => setCat('')} />
          {CATEGORY_META.filter((c) => c.key !== 'other').map((c) => <CategoryTile key={c.key} emoji={c.emoji} label={c.label} gradient={c.gradient} active={cat === c.key} onClick={() => setCat(cat === c.key ? '' : c.key)} />)}
        </div>
      </section>

      <section aria-label="Stores near you" className="flex flex-col gap-4">
        <div className="flex items-end justify-between"><h2 className="text-2xl font-black tracking-tight">{t('home.nearYou')}</h2>{stores && <span className="text-sm font-semibold text-muted">{stores.length} stores</span>}</div>
        {!stores ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="overflow-hidden rounded-[28px] border border-line bg-white"><Skeleton className="h-36 !rounded-none" /><div className="space-y-3 p-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></div></div>)}</div>
        ) : stores.length === 0 ? (
          <EmptyState emoji="🧭" title={t('home.noStores')} hint={`${fill('No stores within {n} km of this location.', { n: radius })} ${t('home.widen')}`} />
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{stores.map((s) => <StaggerItem key={s.id}><StoreCard s={s} kmLabel={t('store.km')} /></StaggerItem>)}</Stagger>
        )}
      </section>
    </div>
  );
}
