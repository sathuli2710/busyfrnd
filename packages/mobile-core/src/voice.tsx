import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { LANGUAGE_LABELS, SPEECH_LOCALES, type Language } from '@busyfrnd/shared';
import { Btn, Field, Row, T } from './ui';
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

/** Big mic button + typed fallback. */
export function VoiceInput({ onSubmit, busy }: { onSubmit: (text: string) => void; busy?: boolean }) {
  const { lang, t } = useApp();
  const v = useVoice(lang, onSubmit);
  const [txt, setTxt] = useState('');
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <Pressable onPress={v.listening ? v.stop : v.start} disabled={busy} accessibilityLabel={t('vendor.speak')}
        style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: v.listening ? colors.danger : colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, opacity: busy ? 0.5 : 1 }}>
        <Text style={{ fontSize: 44 }}>🎤</Text>
      </Pressable>
      <T muted small>{v.listening ? t('vendor.listening') : `${t('vendor.speak')} (${LANGUAGE_LABELS[lang]})`}</T>
      {v.partial ? <T>{v.partial}</T> : null}
      <Row style={{ width: '100%' }}>
        <View style={{ flex: 1 }}><Field value={txt} onChangeText={setTxt} placeholder="…or type here" editable={!busy} /></View>
        <Btn title="➤" disabled={!txt.trim() || busy} onPress={() => { onSubmit(txt.trim()); setTxt(''); }} />
      </Row>
    </View>
  );
}
