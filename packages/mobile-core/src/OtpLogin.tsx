import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Btn, Field, Icon, IconBtn, Screen, T, haptic, useToast } from './kit';
import { useApp } from './app';
import { colors, radius } from './theme';

function Otp({ value, onChange, onDone }: { value: string; onChange: (v: string) => void; onDone?: (v: string) => void }) {
  const ref = useRef<TextInput>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 58, borderRadius: radius.md, borderWidth: 1.5, borderColor: value.length === i ? colors.text : value[i] ? colors.text : colors.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '900' }}>{value[i] ?? ''}</Text>
        </View>))}
      <TextInput ref={ref} value={value} onChangeText={(t) => { const v = t.replace(/\D/g, '').slice(0, 6); onChange(v); if (v.length === 6) onDone?.(v); }} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" maxLength={6} autoFocus style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
    </Pressable>
  );
}

/** Customer: mobile OTP only (email optional). Vendor: mobile OTP + email OTP, both mandatory. */
export function OtpLogin({ role, onDone }: { role: 'CUSTOMER' | 'VENDOR'; onDone: () => void }) {
  const { api, setSession, t, lang, apiUrl, setApiUrl } = useApp();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const vendor = role === 'VENDOR';
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pCode, setPCode] = useState('');
  const [eCode, setECode] = useState('');
  const [sent, setSent] = useState(false);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [server, setServer] = useState(apiUrl);
  const [showServer, setShowServer] = useState(false);
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e) { toast.show((e as Error).message, 'error'); } finally { setBusy(false); } };
  const okPhone = phone.replace(/\D/g, '').length >= 10, okEmail = /.+@.+\..+/.test(email);

  return (
    <Screen scroll pad={false} bg="#fff" edges={['left', 'right']}>
      <LinearGradient colors={vendor ? ['#0B0B0F', '#2A2160'] : ['#0B0B0F', '#3A1A0C']} style={{ paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: 36, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '900', fontSize: 22 }}>B</Text></View><Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>BusyFrnd{vendor ? ' Vendor' : ''}</Text></View>
        <Animated.View entering={FadeInDown.delay(100).springify()}><Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', lineHeight: 40, letterSpacing: -1 }}>{vendor ? 'Talk to your phone.\nGet your shop online.' : 'Your neighbourhood,\none tap away.'}</Text></Animated.View>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' }}>{vendor ? 'Speak in English, हिन्दी or தமிழ் — free for 60 days.' : 'Order from the shops you trust. Pickup or delivery.'}</Text>
        <Text style={{ fontSize: 30, letterSpacing: 6 }}>{vendor ? '🎙️ 🏪 ✨' : '🛒 🎂 📱 💇'}</Text>
      </LinearGradient>

      <View style={{ padding: 24, gap: 16 }}>
        {!sent ? (
          <Animated.View key="a" entering={FadeInRight.springify()} style={{ gap: 16 }}>
            <T variant="title">{t('app.welcome')} {vendor ? '🏪' : '👋'}</T>
            <Field label={t('auth.phone')} keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="98765 43210" left={<Text style={{ fontWeight: '800', fontSize: 16 }}>+91</Text>} />
            <Field label={vendor ? t('auth.email') : t('auth.emailOptional')} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="you@shop.com" />
            <Btn full size="lg" title={t('auth.sendOtp')} loading={busy} disabled={!okPhone || (vendor && !okEmail)}
              onPress={() => run(async () => { const r = await api.auth.requestOtp({ phone, role, email: vendor ? email : undefined }); setDemo(!!r.devHint); setSent(true); haptic.success(); })} />
          </Animated.View>
        ) : (
          <Animated.View key="b" entering={FadeInRight.springify()} style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><IconBtn name="arrow-back" size={36} onPress={() => { setSent(false); setPCode(''); setECode(''); }} /><T variant="title">{vendor ? 'Verify both' : t('auth.otp')}</T></View>
            <T muted>Code sent by SMS to +91 {phone.replace(/\D/g, '').slice(-10)}</T>
            <Otp value={pCode} onChange={setPCode} onDone={!vendor ? (c) => run(async () => { const r = await api.auth.verifyOtp({ phone, code: c, role, email: email || undefined, language: lang }); await setSession(r.token, r.user); haptic.success(); onDone(); }) : undefined} />
            {vendor && <><T muted>Code sent to {email}</T><Otp value={eCode} onChange={setECode} /></>}
            {demo && <Badge tone="violet" icon="sparkles" text={`Demo mode · OTP is 123456`} />}
            <Btn full size="lg" title={t('auth.verify')} loading={busy} disabled={pCode.length < 6 || (vendor && eCode.length < 6)}
              onPress={() => run(async () => { const r = await api.auth.verifyOtp({ phone, code: pCode, role, email: email || undefined, emailCode: vendor ? eCode : undefined, language: lang }); await setSession(r.token, r.user); haptic.success(); onDone(); })} />
          </Animated.View>
        )}
        <Pressable onPress={() => setShowServer(!showServer)} style={{ alignSelf: 'center', padding: 8 }}><Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12 }}><Icon name="settings-outline" size={12} color={colors.muted} /> Server settings</Text></Pressable>
        {showServer && <View style={{ gap: 10 }}><Field label="API server URL (testing)" autoCapitalize="none" value={server} onChangeText={setServer} placeholder="http://192.168.1.10:4000" /><Btn kind="soft" title="Use this server" onPress={() => { setApiUrl(server); toast.show('Server updated', 'ok'); }} /></View>}
      </View>
    </Screen>
  );
}
