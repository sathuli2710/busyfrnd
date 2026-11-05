import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, FadeOutUp, LinearTransition, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AI_GRADIENT } from '@busyfrnd/shared';
import { colors, radius, shadow } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export const Icon = ({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) => <Ionicons name={name} size={size} color={color} />;

export const haptic = {
  tap: () => { Haptics.selectionAsync().catch(() => undefined); },
  light: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); },
  success: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); },
  error: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined); },
};

/** Entrance animation helper: <Enter i={n}> staggers list items. */
export function Enter({ children, i = 0, style }: { children: ReactNode; i?: number; style?: StyleProp<ViewStyle> }) {
  return <Animated.View entering={FadeInDown.delay(Math.min(i, 10) * 55).springify().damping(18)} style={style}>{children}</Animated.View>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
/** Pressable with a spring scale + haptic tick. Use for everything tappable. */
export function Tap({ children, onPress, style, scale = 0.96, haptics = true, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scale?: number; haptics?: boolean }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable {...rest} onPressIn={() => { s.value = withSpring(scale, { damping: 14, stiffness: 420 }); }} onPressOut={() => { s.value = withSpring(1, { damping: 12, stiffness: 320 }); }}
      onPress={(e) => { if (haptics) haptic.tap(); onPress?.(e); }} style={[style, anim]}>{children}</AnimatedPressable>
  );
}

/* ---------- Layout ---------- */
export function Screen({ children, scroll = true, pad = true, footer, title, subtitle, right, onRefresh, bg, bottomInset = 0, edges = ['top', 'left', 'right'] }: {
  children: ReactNode; scroll?: boolean; pad?: boolean; footer?: ReactNode; title?: string; subtitle?: string; right?: ReactNode; onRefresh?: () => Promise<unknown> | void; bg?: string; bottomInset?: number; edges?: Array<'top' | 'left' | 'right' | 'bottom'>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const head = title ? (
    <View style={{ paddingHorizontal: pad ? 18 : 0, paddingTop: 8, paddingBottom: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
      <View style={{ flex: 1 }}>{subtitle ? <T variant="caption" muted>{subtitle}</T> : null}<T variant="display">{title}</T></View>{right}
    </View>
  ) : null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg ?? colors.bg }} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: pad ? 18 : 0, paddingTop: title ? 4 : pad ? 18 : 0, paddingBottom: 120 + bottomInset, gap: 14 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} tintColor={colors.brand} onRefresh={async () => { setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); } }} /> : undefined}>
          {head}{children}
        </ScrollView>
      ) : <View style={{ flex: 1, padding: pad ? 18 : 0, gap: 14 }}>{head}{children}</View>}
      {footer}
    </SafeAreaView>
  );
}

const VARIANTS: Record<string, { size: number; weight: TextStyle['fontWeight']; lh?: number; ls?: number }> = {
  display: { size: 32, weight: '900', lh: 36, ls: -0.8 }, title: { size: 24, weight: '800', lh: 29, ls: -0.4 }, headline: { size: 18, weight: '800', lh: 23, ls: -0.2 },
  body: { size: 15, weight: '500', lh: 21 }, label: { size: 14, weight: '700' }, caption: { size: 12.5, weight: '600' },
};
export function T({ children, variant = 'body', bold, muted, small, size, color, center, style, numberOfLines }: { children: ReactNode; variant?: keyof typeof VARIANTS; bold?: boolean; muted?: boolean; small?: boolean; size?: number; color?: string; center?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const v = VARIANTS[small ? 'caption' : variant];
  return <Text numberOfLines={numberOfLines} style={[{ color: color ?? (muted ? colors.muted : colors.text), fontSize: size ?? v.size, fontWeight: bold ? '800' : v.weight, lineHeight: v.lh, letterSpacing: v.ls }, center && { textAlign: 'center' }, style]}>{children}</Text>;
}

export function Row({ children, style, gap = 10 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Card({ children, style, onPress, flat }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; flat?: boolean }) {
  const s: StyleProp<ViewStyle> = [{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line }, !flat && shadow.soft, style];
  return onPress ? <Tap onPress={onPress} style={s} scale={0.985}>{children}</Tap> : <View style={s}>{children}</View>;
}

/* ---------- Controls ---------- */
const BTN = {
  primary: { bg: colors.primary, fg: '#fff' }, brand: { bg: colors.brand, fg: '#fff' }, soft: { bg: 'rgba(11,11,15,0.06)', fg: colors.text }, outline: { bg: '#fff', fg: colors.text },
  danger: { bg: colors.danger, fg: '#fff' }, ghost: { bg: 'transparent', fg: colors.text }, ai: { bg: colors.ai, fg: '#fff' }, secondary: { bg: 'rgba(11,11,15,0.06)', fg: colors.text },
} as const;
export function Btn({ title, onPress, kind = 'primary', disabled, loading, style, icon, size = 'md', full }: { title: string; onPress: () => void; kind?: keyof typeof BTN; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>; icon?: IconName; size?: 'sm' | 'md' | 'lg'; full?: boolean }) {
  const c = BTN[kind], h = size === 'lg' ? 58 : size === 'sm' ? 38 : 48;
  const inner = (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', height: h, paddingHorizontal: size === 'sm' ? 16 : 22 }}>
      {loading ? <ActivityIndicator color={c.fg} /> : <>{icon ? <Icon name={icon} size={18} color={c.fg} /> : null}<Text style={{ color: c.fg, fontWeight: '800', fontSize: size === 'sm' ? 14 : 16 }}>{title}</Text></>}
    </View>
  );
  return (
    <Tap onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityLabel={title}
      style={[{ borderRadius: radius.full, overflow: 'hidden', backgroundColor: kind === 'ai' ? undefined : c.bg, opacity: disabled ? 0.45 : 1, borderWidth: kind === 'outline' ? 1 : 0, borderColor: colors.line, alignSelf: full ? 'stretch' : 'flex-start' }, kind === 'ai' && shadow.ai, kind === 'brand' && { shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } }, style]}>
      {kind === 'ai' ? <LinearGradient colors={AI_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>{inner}</LinearGradient> : inner}
    </Tap>
  );
}

export function IconBtn({ name, onPress, size = 40, color = colors.text, bg = 'rgba(11,11,15,0.06)', label }: { name: IconName; onPress: () => void; size?: number; color?: string; bg?: string; label?: string }) {
  return <Tap onPress={onPress} accessibilityLabel={label ?? String(name)} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon name={name} size={size * 0.5} color={color} /></Tap>;
}

export function Field({ label, error, hint, left, ...p }: TextInputProps & { label?: string; error?: string; hint?: string; left?: ReactNode }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <T variant="caption" bold color={colors.textSoft}>{label}</T> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1.5, borderColor: error ? colors.danger : focus ? colors.text : colors.line, paddingHorizontal: 14 }}>
        {left}
        <TextInput placeholderTextColor="#9A9AA6" {...p} onFocus={(e) => { setFocus(true); p.onFocus?.(e); }} onBlur={(e) => { setFocus(false); p.onBlur?.(e); }} style={[{ flex: 1, height: 52, fontSize: 16, fontWeight: '600', color: colors.text }, p.multiline && { height: 90, textAlignVertical: 'top', paddingTop: 12 }, p.style]} />
      </View>
      {error ? <T small color={colors.danger}>{error}</T> : hint ? <T small muted>{hint}</T> : null}
    </View>
  );
}

const TONES = { gray: ['#EEEEF1', '#374151'], green: ['#E6F6EC', '#0B6B3A'], orange: ['#FFF0E8', '#C2410C'], red: ['#FDE8EC', '#BE123C'], blue: ['#E0F2FE', '#0369A1'], violet: ['#F1EEFF', '#5B49D6'], dark: ['#0B0B0F', '#fff'] } as const;
export type Tone = keyof typeof TONES;
export function Badge({ text, tone = 'gray', icon }: { text: string; tone?: Tone; icon?: IconName }) {
  const [bg, fg] = TONES[tone];
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 }}>{icon ? <Icon name={icon} size={12} color={fg} /> : null}<Text style={{ color: fg, fontSize: 12, fontWeight: '800' }}>{text}</Text></View>;
}

export function Chip({ label, active, onPress, emoji }: { label: string; active?: boolean; onPress: () => void; emoji?: string }) {
  return <Tap onPress={onPress} style={{ paddingHorizontal: 16, height: 40, borderRadius: 999, borderWidth: 1, borderColor: active ? colors.text : colors.line, backgroundColor: active ? colors.text : '#fff', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    {emoji ? <Text style={{ fontSize: 16 }}>{emoji}</Text> : null}<Text style={{ fontWeight: '700', color: active ? '#fff' : colors.text }}>{label}</Text></Tap>;
}

export function Segmented<V extends string>({ value, onChange, options }: { value: V; onChange: (v: V) => void; options: Array<{ value: V; label: string; icon?: IconName; disabled?: boolean }> }) {
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const x = useSharedValue(0);
  useEffect(() => { x.value = withSpring(idx * (w / options.length), { damping: 20, stiffness: 260 }); }, [idx, w, options.length, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width - 8)} style={{ flexDirection: 'row', backgroundColor: 'rgba(11,11,15,0.06)', borderRadius: 999, padding: 4 }}>
      {w > 0 && <Animated.View style={[{ position: 'absolute', top: 4, left: 4, width: w / options.length, bottom: 4, borderRadius: 999, backgroundColor: '#fff' }, shadow.soft, pill]} />}
      {options.map((o) => (
        <Tap key={o.value} disabled={o.disabled} onPress={() => onChange(o.value)} style={{ flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, opacity: o.disabled ? 0.4 : 1 }}>
          {o.icon ? <Icon name={o.icon} size={16} color={value === o.value ? colors.text : colors.muted} /> : null}<Text style={{ fontWeight: '800', color: value === o.value ? colors.text : colors.muted }}>{o.label}</Text>
        </Tap>
      ))}
    </View>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => { x.value = withSpring(value ? 1 : 0, { damping: 16, stiffness: 320 }); }, [value, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 20 }] }));
  return (
    <Tap onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} style={{ width: 50, height: 30, borderRadius: 15, padding: 3, backgroundColor: value ? colors.text : 'rgba(11,11,15,0.18)' }}>
      <Animated.View style={[{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' }, knob]} />
    </Tap>
  );
}
export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14 }}><View style={{ flex: 1 }}><T variant="label">{label}</T>{hint ? <T small muted>{hint}</T> : null}</View><Toggle value={value} onChange={onChange} /></View>;
}

export function QtyStepper({ qty, onChange, addLabel = 'Add' }: { qty: number; onChange: (n: number) => void; addLabel?: string }) {
  if (qty <= 0) return <Tap onPress={() => onChange(1)} style={{ height: 38, paddingHorizontal: 20, borderRadius: 19, borderWidth: 1.5, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase', fontSize: 13 }}>{addLabel}</Text></Tap>;
  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ flexDirection: 'row', alignItems: 'center', height: 38, borderRadius: 19, backgroundColor: colors.text }}>
      <Tap onPress={() => onChange(qty - 1)} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}><Icon name="remove" size={18} color="#fff" /></Tap>
      <Text style={{ color: '#fff', fontWeight: '900', minWidth: 22, textAlign: 'center' }}>{qty}</Text>
      <Tap onPress={() => onChange(Math.min(99, qty + 1))} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}><Icon name="add" size={18} color="#fff" /></Tap>
    </Animated.View>
  );
}

/* ---------- Feedback ---------- */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.55);
  useEffect(() => { o.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.55, { duration: 700 })), -1); }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ backgroundColor: '#E9E9EE', borderRadius: radius.md, height: 20 }, style, a]} />;
}
export const Loading = () => <View style={{ padding: 32, alignItems: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
export const Err = ({ msg }: { msg: string }) => (msg ? <T small color={colors.danger}>{msg}</T> : null);

export function EmptyState({ emoji = '✨', title, hint, action }: { emoji?: string; title: string; hint?: string; action?: ReactNode }) {
  return <Animated.View entering={FadeInUp.springify()} style={{ alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24, borderRadius: radius.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, backgroundColor: '#fff' }}>
    <Text style={{ fontSize: 52 }}>{emoji}</Text><T variant="headline" center>{title}</T>{hint ? <T muted center>{hint}</T> : null}{action ? <View style={{ marginTop: 8 }}>{action}</View> : null}</Animated.View>;
}

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}><Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" /></Animated.View>
      <Animated.View entering={SlideInDown.springify().damping(22).stiffness(190)} exiting={SlideOutDown.duration(180)} style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 24 + insets.bottom, gap: 14, maxHeight: '88%' }, shadow.lift]}>
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(11,11,15,0.12)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}><T variant="title" style={{ flex: 1 }}>{title ?? ''}</T><IconBtn name="close" size={34} onPress={onClose} label="Close" /></View>
        {children}
      </Animated.View>
    </Modal>
  );
}

/* ---------- Toast ---------- */
type ToastMsg = { id: number; text: string; tone: 'ok' | 'error' | 'info' };
const ToastCtx = createContext<{ show: (text: string, tone?: ToastMsg['tone']) => void }>({ show: () => undefined });
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ToastMsg[]>([]);
  const insets = useSafeAreaInsets();
  const show = useCallback((text: string, tone: ToastMsg['tone'] = 'info') => {
    const id = Date.now() + Math.random();
    if (tone === 'ok') haptic.success(); else if (tone === 'error') haptic.error();
    setList((l) => [...l.slice(-2), { id, text, tone }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 2800);
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, gap: 8 }}>
        {list.map((m) => (
          <Animated.View key={m.id} entering={FadeInDown.springify().damping(16)} exiting={FadeOutUp} layout={LinearTransition} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.text, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20 }, shadow.lift]}>
            <Icon name={m.tone === 'ok' ? 'checkmark-circle' : m.tone === 'error' ? 'alert-circle' : 'information-circle'} size={20} color={m.tone === 'ok' ? '#34D399' : m.tone === 'error' ? '#FB7185' : '#fff'} />
            <Text style={{ color: '#fff', fontWeight: '700', flex: 1 }}>{m.text}</Text>
          </Animated.View>))}
      </View>
    </ToastCtx.Provider>
  );
}
