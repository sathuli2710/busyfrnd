import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AiBadge, AiBubble, Card, EmptyState, Row, Screen, T, Tap, TypingDots, colors, haptic, useApp } from '@busyfrnd/mobile-core';
import { VoiceInput, speak } from '@busyfrnd/mobile-core/src/voice';

export default function Assistant() {
  const { api, lang, t } = useApp();
  const [chat, setChat] = useState<Array<{ who: 'me' | 'ai'; text: string }>>([]);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const ask = async (text: string) => {
    haptic.light(); setChat((c) => [...c, { who: 'me', text }]); setBusy(true);
    try { const r = await api.ai.assistant(text, lang); setChat((c) => [...c, { who: 'ai', text: r.reply }]); speak(r.reply, lang); }
    catch (e) { setChat((c) => [...c, { who: 'ai', text: (e as Error).message }]); } finally { setBusy(false); setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 100); }
  };
  const quick = [t('vendor.quick1'), t('vendor.quick2'), t('vendor.quick3')];
  return (
    <Screen scroll={false} title="AI Buddy" subtitle="Ask in your own language" right={<AiBadge text="Live data" />}>
      <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 12 }} showsVerticalScrollIndicator={false} onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}>
        {!chat.length && <EmptyState emoji="🎙️" title="Ask me anything" hint="Sales, top items, pending orders — I read your shop data and answer out loud." action={<Row style={{ justifyContent: 'center' }}>{quick.map((q) => <Tap key={q} onPress={() => ask(q)} style={{ backgroundColor: colors.aiSoft, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 }}><T bold color="#5B49D6" small>✨ {q}</T></Tap>)}</Row>} />}
        {chat.map((m, i) => <AiBubble key={i} who={m.who}>{m.text}</AiBubble>)}
        {busy && <TypingDots />}
      </ScrollView>
      <View style={{ marginBottom: 96 }}><Card style={{ paddingVertical: 14 }}><VoiceInput onSubmit={ask} busy={busy} orbSize={80} /></Card></View>
    </Screen>
  );
}
