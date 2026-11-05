import { useCallback, useEffect, useRef, useState } from 'react';
import { SPEECH_LOCALES, type Language } from '@busyfrnd/shared';

/** Browser voice input/output via the Web Speech API (Chrome/Edge/Safari). Falls back to typing when unsupported. */
export function useSpeech(lang: Language) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const rec = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = SPEECH_LOCALES[lang];
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => setTranscript(Array.from(e.results).map((x: any) => x[0].transcript).join(' '));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setTranscript('');
    setListening(true);
    r.start();
  }, [lang]);

  const stop = useCallback(() => rec.current?.stop(), []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_LOCALES[lang];
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [lang]);

  return { supported, listening, transcript, setTranscript, start, stop, speak };
}
