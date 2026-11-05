'use client';
import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { LANGUAGE_LABELS } from '@busyfrnd/shared';
import { AiOrb, Button, Input, useApp, useSpeech } from '@busyfrnd/web-ui';

/** Orb-based voice capture with typed fallback. Submits the final transcript. */
export function VoiceCapture({ onSubmit, busy, hint, orbSize = 132 }: { onSubmit: (text: string) => void; busy?: boolean; hint?: string; orbSize?: number }) {
  const { lang, t } = useApp();
  const sp = useSpeech(lang);
  const [txt, setTxt] = useState('');
  const was = useRef(false);
  useEffect(() => {
    if (was.current && !sp.listening && sp.transcript.trim() && !busy) { const x = sp.transcript.trim(); sp.setTranscript(''); onSubmit(x); }
    was.current = sp.listening; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.listening]);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      {sp.supported && <AiOrb size={orbSize} listening={sp.listening} busy={busy} onClick={sp.listening ? sp.stop : sp.start} label={t('vendor.tapSpeak')} />}
      <div className="text-center"><div className="font-bold">{busy ? t('ai.thinking') : sp.listening ? t('vendor.listening') : sp.supported ? t('vendor.tapSpeak') : 'Type below'}</div><div className="text-xs text-muted">{LANGUAGE_LABELS[lang]}{hint ? ` · ${hint}` : ''}</div></div>
      {sp.transcript && <div className="w-full rounded-3xl bg-ai-50 px-5 py-4 text-center font-semibold text-ai-600">“{sp.transcript}”</div>}
      <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); if (txt.trim()) { onSubmit(txt.trim()); setTxt(''); } }}>
        <Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="…or type here" disabled={busy} className="rounded-full" />
        <Button type="submit" size="icon" disabled={busy || !txt.trim()} aria-label="Send" className="h-12 w-12 shrink-0"><Send size={18} /></Button>
      </form>
    </div>
  );
}
