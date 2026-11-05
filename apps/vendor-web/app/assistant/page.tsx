'use client';
import { useEffect, useRef, useState } from 'react';
import { AiBadge, AiBubble, EmptyState, TypingDots, useApp, useSpeech } from '@busyfrnd/web-ui';
import { Sparkles } from 'lucide-react';
import { VoiceCapture } from '../../components/voice';

export default function Assistant() {
  const { api, lang, t } = useApp();
  const sp = useSpeech(lang);
  const [chat, setChat] = useState<Array<{ who: 'me' | 'ai'; text: string }>>([]);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [chat, busy]);
  const ask = async (text: string) => {
    setChat((c) => [...c, { who: 'me', text }]); setBusy(true);
    try { const r = await api.ai.assistant(text, lang); setChat((c) => [...c, { who: 'ai', text: r.reply }]); sp.speak(r.reply); }
    catch (e) { setChat((c) => [...c, { who: 'ai', text: (e as Error).message }]); } finally { setBusy(false); }
  };
  const quick = [t('vendor.quick1'), t('vendor.quick2'), t('vendor.quick3')];
  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black tracking-tight">{t('nav.assistant')}</h1><p className="text-muted">Your shop assistant. Ask in your own language.</p></div><AiBadge>Live data</AiBadge></div>
      <div className="flex flex-1 flex-col gap-3">
        {!chat.length && <EmptyState emoji="🎙️" title="Ask me anything" hint="Sales, top items, pending orders — I read your shop data and answer out loud." action={<div className="flex flex-wrap justify-center gap-2">{quick.map((q) => <button key={q} onClick={() => ask(q)} className="rounded-full bg-ai-50 px-4 py-2 text-sm font-semibold text-ai-600 transition hover:bg-ai-100 active:scale-95"><Sparkles size={13} className="mr-1.5 inline" />{q}</button>)}</div>} />}
        {chat.map((m, i) => <AiBubble key={i} who={m.who}>{m.text}</AiBubble>)}
        {busy && <div className="self-start rounded-3xl border border-line bg-white px-4 shadow-soft"><TypingDots /></div>}
        <div ref={end} />
      </div>
      <div className="sticky bottom-24 rounded-[32px] border border-line bg-white/95 p-5 shadow-lift backdrop-blur md:bottom-6"><VoiceCapture onSubmit={ask} busy={busy} orbSize={88} /></div>
    </div>
  );
}
