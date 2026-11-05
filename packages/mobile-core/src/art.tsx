import type { ReactNode } from 'react';
import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { categoryMeta, emojiFor, softGradient } from '@busyfrnd/shared';
import { Tap } from './kit';
import { colors } from './theme';

export function ProductThumb({ id, name, category, kind, imageUrl, size = 64, radius = 18, style }: { id: string; name: string; category?: string | null; kind?: string; imageUrl?: string | null; size?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  if (imageUrl) return <Image source={{ uri: imageUrl }} style={[{ width: size, height: size, borderRadius: radius }, style as never]} />;
  const [a, b] = softGradient(id || name);
  return (
    <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.5 }}>{emojiFor(name, category, kind)}</Text>
    </LinearGradient>
  );
}

export function StoreCover({ category, height = 140, radius = 26, big, children, style }: { category?: string | null; height?: number; radius?: number; big?: boolean; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const m = categoryMeta(category);
  return (
    <LinearGradient colors={m.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ minHeight: height, borderRadius: radius, overflow: 'hidden' }, style]}>
      <Text style={{ position: 'absolute', right: -14, top: -22, fontSize: 130, opacity: 0.22 }}>{m.emoji}</Text>
      <View style={{ position: 'absolute', left: -30, bottom: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.16)' }} />
      <Text style={{ position: 'absolute', right: 18, bottom: 12, fontSize: big ? 64 : 46 }}>{m.emoji}</Text>
      {children}
    </LinearGradient>
  );
}

export function CategoryTile({ emoji, label, gradient, active, onPress }: { emoji: string; label: string; gradient: [string, string]; active?: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} style={{ width: 76, alignItems: 'center', gap: 8 }} scale={0.92}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: gradient[1], shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 }, active && { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.06 }] }]}>
        <Text style={{ fontSize: 30 }}>{emoji}</Text>
      </LinearGradient>
      <Text style={{ fontSize: 12, fontWeight: active ? '900' : '700', color: active ? colors.text : colors.textSoft }}>{label}</Text>
    </Tap>
  );
}
