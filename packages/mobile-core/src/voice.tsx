import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { LANGUAGE_LABELS, SPEECH_LOCALES, type Language } from '@busyfrnd/shared';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Btn, Field, Row, T } from './kit';
import { AiOrb } from './ai';
import { colors } from './theme';
import { useApp } from './app';

export function speak(text: string, lang: Language) {
  Speech.stop();
  Speech.speak(text, { language: SPEECH_LOCALES[lang], rate: 0.95 });
}

/** On-device speech recognition in en-IN / hi-IN / ta-IN. */
export function useVoice(lang: Language, onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const last = useRef('');
  const cb = useRef(onFinal);
  cb.current = onFinal;
  useSpeechRecognitionEvent('start', () => { setListening(true); last.current = ''; setPartial(''); });
  useSpeechRecognitionEvent('result', (e) => { const t = e.results[0]?.transcript ?? ''; last.current = t; setPartial(t); });
  useSpeechRecognitionEvent('end', () => { setListening(false); const t = last.current.trim(); last.current = ''; setPartial(''); if (t) cb.current(t); });
  useSpeechRecognitionEvent('error', () => setListening(false));
  const start = useCallback(async () => {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) return;
    ExpoSpeechRecognitionModule.start({ lang: SPEECH_LOCALES[lang], interimResults: true, continuous: false });
  }, [lang]);
  const stop = useCallback(() => ExpoSpeechRecognitionModule.stop(), []);
  useEffect(() => () => { try { ExpoSpeechRecognitionModule.abort(); } catch { /* ignore */ } }, []);
  return { listening, partial, start, stop };
}

/** AI orb + typed fallback. */
export function VoiceInput({ onSubmit, busy, orbSize = 120 }: { onSubmit: (text: string) => void; busy?: boolean; orbSize?: number }) {
  const { lang, t } = useApp();
  const v = useVoice(lang, onSubmit);
  const [txt, setTxt] = useState('');
  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <AiOrb size={orbSize} listening={v.listening} busy={busy} onPress={v.listening ? v.stop : v.start} />
      <T variant="label">{busy ? t('ai.thinking') : v.listening ? t('vendor.listening') : t('vendor.tapSpeak')}</T>
      <T small muted>{LANGUAGE_LABELS[lang]}</T>
      {v.partial ? <Animated.View entering={FadeIn} style={{ backgroundColor: colors.aiSoft, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22 }}><T bold color="#5B49D6" center>“{v.partial}”</T></Animated.View> : null}
      <Row style={{ width: '100%', flexWrap: 'nowrap' }}>
        <View style={{ flex: 1 }}><Field value={txt} onChangeText={setTxt} placeholder="…or type here" editable={!busy} returnKeyType="send" onSubmitEditing={() => { if (txt.trim()) { onSubmit(txt.trim()); setTxt(''); } }} /></View>
        <Btn title="Send" icon="send" disabled={!txt.trim() || busy} onPress={() => { onSubmit(txt.trim()); setTxt(''); }} />
      </Row>
    </View>
  );
}
