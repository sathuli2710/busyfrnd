import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from './theme';

export function Screen({ children, scroll = true, pad = true, footer }: { children: ReactNode; scroll?: boolean; pad?: boolean; footer?: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      {scroll
        ? <ScrollView contentContainerStyle={{ padding: pad ? 16 : 0, gap: 12 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        : <View style={{ flex: 1, padding: pad ? 16 : 0, gap: 12 }}>{children}</View>}
      {footer}
    </SafeAreaView>
  );
}

export function T({ children, style, bold, muted, small, size, color }: { children: ReactNode; style?: StyleProp<TextStyle>; bold?: boolean; muted?: boolean; small?: boolean; size?: number; color?: string }) {
  return <Text style={[{ color: color ?? (muted ? colors.muted : colors.text), fontSize: size ?? (small ? 13 : 15) }, bold && { fontWeight: '700' }, style]}>{children}</Text>;
}

export function Btn({ title, onPress, kind = 'primary', disabled, loading, style }: { title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger' | 'ghost'; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle> }) {
  const bg = kind === 'primary' ? colors.primary : kind === 'danger' ? colors.danger : kind === 'ghost' ? 'transparent' : colors.chip;
  const fg = kind === 'secondary' ? colors.text : kind === 'ghost' ? colors.primary : '#fff';
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button"
      style={[{ backgroundColor: bg, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center', opacity: disabled ? 0.5 : 1, borderWidth: kind === 'ghost' ? 1 : 0, borderColor: colors.primary }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const s: StyleProp<ViewStyle> = [{ backgroundColor: colors.surface, borderRadius: radius, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 6 }, style];
  return onPress ? <Pressable onPress={onPress} style={s}>{children}</Pressable> : <View style={s}>{children}</View>;
}

export function Field({ label, ...p }: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 4 }}>
      {label ? <T small muted bold>{label}</T> : null}
      <TextInput placeholderTextColor="#9CA3AF" {...p} style={[{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff', color: colors.text }, p.style]} />
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Badge({ text, tone = 'gray' }: { text: string; tone?: 'gray' | 'green' | 'orange' | 'red' | 'blue' }) {
  const m = { gray: ['#EEF0F3', '#374151'], green: ['#E3F4E5', '#1B5E20'], orange: ['#FFF0DC', '#B45309'], red: ['#FDE7E7', '#B71C1C'], blue: ['#E1F0FB', '#075985'] }[tone];
  return <View style={{ backgroundColor: m[0], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}><Text style={{ color: m[1], fontSize: 12, fontWeight: '700' }}>{text}</Text></View>;
}

export function Stepper({ qty, onChange, addLabel }: { qty: number; onChange: (n: number) => void; addLabel: string }) {
  if (qty <= 0) return <Btn title={addLabel} onPress={() => onChange(1)} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />;
  const b = (t: string, n: number) => <Pressable onPress={() => onChange(n)} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20, color: colors.primary, fontWeight: '700' }}>{t}</Text></Pressable>;
  return <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 10 }}>{b('−', qty - 1)}<Text style={{ minWidth: 26, textAlign: 'center', fontWeight: '700' }}>{qty}</Text>{b('+', qty + 1)}</View>;
}

export const Err = ({ msg }: { msg: string }) => (msg ? <T color={colors.danger} small>{msg}</T> : null);
export const Loading = () => <View style={{ padding: 24 }}><ActivityIndicator color={colors.primary} /></View>;
export const styles = StyleSheet.create({ flex1: { flex: 1 } });
