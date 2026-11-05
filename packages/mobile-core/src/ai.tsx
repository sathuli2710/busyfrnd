import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AI_GRADIENT } from '@busyfrnd/shared';
import { Icon, Tap, T, haptic } from './kit';
import { colors, shadow } from './theme';

export function AiBadge({ text = 'AI' }: { text?: string }) {
  return <LinearGradient colors={AI_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 }}><Icon name="sparkles" size={11} color="#fff" /><Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }}>{text}</Text></LinearGradient>;
}

function Ring({ delay }: { delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1)); }, [p, delay]);
  const s = useAnimatedStyle(() => ({ opacity: 0.65 * (1 - p.value), transform: [{ scale: 1 + p.value * 0.9 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, borderRadius: 999, borderWidth: 2, borderColor: colors.ai }, s]} />;
}

/** Voice orb: breathing gradient sphere; ripples while listening; spins while the AI is working. */
export function AiOrb({ listening, busy, onPress, size = 120 }: { listening?: boolean; busy?: boolean; onPress?: () => void; size?: number }) {
  const breathe = useSharedValue(1), spin = useSharedValue(0);
  useEffect(() => {
    breathe.value = withRepeat(withSequence(withTiming(listening ? 1.1 : 1.04, { duration: listening ? 450 : 1500 }), withTiming(1, { duration: listening ? 450 : 1500 })), -1);
  }, [listening, breathe]);
  useEffect(() => { spin.value = busy ? withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1) : 0; }, [busy, spin]);
  const orb = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }, { rotate: `${spin.value}deg` }] }));
  return (
    <Pressable onPress={() => { haptic.light(); onPress?.(); }} disabled={busy} accessibilityRole="button" accessibilityLabel={listening ? 'Stop listening' : 'Talk to AI'} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {listening ? [0, 600, 1200].map((d) => <Ring key={d} delay={d} />) : null}
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, shadow.ai, orb]}>
        <LinearGradient colors={['#6C5CE7', '#C55CFF', '#FF5A1F']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1 }} />
        <View style={{ position: 'absolute', top: size * 0.1, left: size * 0.18, width: size * 0.34, height: size * 0.2, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.28)' }} />
      </Animated.View>
      <View pointerEvents="none" style={{ position: 'absolute' }}><Icon name={busy ? 'sparkles' : listening ? 'stop' : 'mic'} size={size * 0.34} color="#fff" /></View>
    </Pressable>
  );
}

/** "Ask AI" search pill with suggestion chips. */
export function AiPromptBar({ value, onChange, onSubmit, placeholder, busy, suggestions, onPick }: { value: string; onChange: (v: string) => void; onSubmit: (v: string) => void; placeholder: string; busy?: boolean; suggestions?: string[]; onPick?: (s: string) => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 999, paddingLeft: 16, paddingRight: 6, height: 58, borderWidth: 1.5, borderColor: focus ? colors.ai : colors.line, gap: 10 }, focus ? shadow.ai : shadow.soft]}>
        <Icon name="sparkles" size={20} color={colors.ai} />
        <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#9A9AA6" onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} returnKeyType="send" onSubmitEditing={() => value.trim() && onSubmit(value.trim())} style={{ flex: 1, fontSize: 15.5, fontWeight: '600', color: colors.text, height: 56 }} />
        <Tap onPress={() => value.trim() && onSubmit(value.trim())} disabled={busy || !value.trim()} style={{ opacity: !value.trim() ? 0.4 : 1 }}>
          <LinearGradient colors={AI_GRADIENT} style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }}>{busy ? <Icon name="sparkles" size={20} color="#fff" /> : <Icon name="arrow-up" size={22} color="#fff" />}</LinearGradient>
        </Tap>
      </View>
      {suggestions?.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{suggestions.map((s) => <Tap key={s} onPress={() => onPick?.(s)} style={{ backgroundColor: colors.aiSoft, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 }}><Text style={{ color: '#5B49D6', fontWeight: '700', fontSize: 13 }}>{s}</Text></Tap>)}</ScrollView> : null}
    </View>
  );
}

export function AiBubble({ who, children }: { who: 'me' | 'ai'; children: ReactNode }) {
  const me = who === 'me';
  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={[{ maxWidth: '86%', alignSelf: me ? 'flex-end' : 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, gap: 6 }, me ? { backgroundColor: colors.text, borderBottomRightRadius: 8 } : [{ backgroundColor: '#fff', borderBottomLeftRadius: 8, borderWidth: 1, borderColor: colors.line }, shadow.soft]]}>
      {!me && <AiBadge text="BusyFrnd AI" />}
      {typeof children === 'string' ? <T color={me ? '#fff' : colors.text}>{children}</T> : children}
    </Animated.View>
  );
}

export function TypingDots() {
  return <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 18, paddingVertical: 16, backgroundColor: '#fff', borderRadius: 24, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.line }}>{[0, 1, 2].map((i) => <Dot key={i} delay={i * 150} />)}</View>;
}
function Dot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => { y.value = withDelay(delay, withRepeat(withSequence(withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })), -1)); }, [y, delay]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ai }, s]} />;
}
