import { useState } from 'react';
import { View } from 'react-native';
import { Screen, T, colors, useApp } from '@busyfrnd/mobile-core';
import { VoiceInput, speak } from '@busyfrnd/mobile-core/src/voice';

export default function Assistant() {
  const { api, lang, t } = useApp();
  const [chat, setChat] = useState<Array<{ who: 'me' | 'ai'; text: string }>>([]);
  const [busy, setBusy] = useState(false);
  const ask = async (text: string) => {
    setChat((c) => [...c, { who: 'me', text }]); setBusy(true);
    try { const r = await api.ai.assistant(text, lang); setChat((c) => [...c, { who: 'ai', text: r.reply }]); speak(r.reply, lang); }
    catch (e) { setChat((c) => [...c, { who: 'ai', text: (e as Error).message }]); } finally { setBusy(false); }
  };
  return (
    <Screen>
      <T muted small>Ask in your language: “aaj kitna becha?”, “இன்று எவ்வளவு விற்பனை?”, “how many orders are pending?”</T>
      {chat.map((m, i) => (
        <View key={i} style={{ alignSelf: m.who === 'me' ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: m.who === 'me' ? '#FFF0DC' : '#fff', borderWidth: m.who === 'ai' ? 1 : 0, borderColor: colors.border, padding: 10, borderRadius: 14 }}><T>{m.text}</T></View>))}
      {busy && <T muted>…</T>}
      <VoiceInput onSubmit={ask} busy={busy} />
      <T muted small>{t('nav.assistant')}</T>
    </Screen>
  );
}
