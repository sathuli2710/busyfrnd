'use client';
import { useEffect } from 'react';
import { LANGUAGE_LABELS } from '@busyfrnd/shared';
import { useApp, useSpeech } from '@busyfrnd/web-ui';

/** Big mic button + typed fallback. Calls onSubmit with the final text. */
export function VoiceInput({ onSubmit, busy, placeholder }: { onSubmit: (text: string) => void; busy?: boolean; placeholder?: string }) {
  const { lang, t } = useApp();
  const sp = useSpeech(lang);
  useEffect(() => { if (!sp.listening && sp.transcript.trim() && !busy) { const x = sp.transcript.trim(); sp.setTranscript(''); onSubmit(x); } /* eslint-disable-next-line */ }, [sp.listening]);
  return (
    <div className="col" style={{ alignItems: 'center' }}>
      {sp.supported ? (
        <button className={`mic ${sp.listening ? 'on' : ''}`} onClick={sp.listening ? sp.stop : sp.start} disabled={busy} aria-label={t('vendor.speak')}>🎤</button>
      ) : <div className="small muted">Voice input is not supported in this browser — please type.</div>}
      <div className="muted small">{sp.listening ? t('vendor.listening') : `${t('vendor.speak')} (${LANGUAGE_LABELS[lang]})`}</div>
      {sp.transcript && <div className="card" style={{ width: '100%' }}>{sp.transcript}</div>}
      <TypeBox onSubmit={onSubmit} busy={busy} placeholder={placeholder} />
    </div>
  );
}

function TypeBox({ onSubmit, busy, placeholder }: { onSubmit: (t: string) => void; busy?: boolean; placeholder?: string }) {
  const submit = (form: HTMLFormElement) => { const f = new FormData(form); const v = String(f.get('q') ?? '').trim(); if (v) { onSubmit(v); form.reset(); } };
  return (
    <form className="row" style={{ width: '100%' }} onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget); }}>
      <input name="q" style={{ flex: 1 }} placeholder={placeholder ?? '…or type here'} disabled={busy} />
      <button className="btn" disabled={busy}>➤</button>
    </form>
  );
}
