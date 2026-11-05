'use client';
import { useState } from 'react';
import { useApp, useSpeech } from '@busyfrnd/web-ui';
import { VoiceInput } from '../voice';

export default function Assistant() {
  const { api, lang, t } = useApp();
  const sp = useSpeech(lang);
  const [chat, setChat] = useState<Array<{ who: 'me' | 'ai'; text: string }>>([]);
  const [busy, setBusy] = useState(false);
  const ask = async (text: string) => {
    setChat((c) => [...c, { who: 'me', text }]); setBusy(true);
    try { const r = await api.ai.assistant(text, lang); setChat((c) => [...c, { who: 'ai', text: r.reply }]); sp.speak(r.reply); }
    catch (e) { setChat((c) => [...c, { who: 'ai', text: (e as Error).message }]); } finally { setBusy(false); }
  };
  return (
    <div className="col" style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{ margin: 0 }}>🎙️ {t('nav.assistant')}</h2>
      <p className="muted small">Ask in your language: “aaj kitna becha?”, “இன்று எவ்வளவு விற்பனை?”, “how many orders are pending?”</p>
      <div className="col" style={{ minHeight: 160 }}>{chat.map((m, i) => <div key={i} className={`bubble ${m.who}`}>{m.text}</div>)}{busy && <div className="muted">…</div>}</div>
      <VoiceInput onSubmit={ask} busy={busy} />
    </div>
  );
}
