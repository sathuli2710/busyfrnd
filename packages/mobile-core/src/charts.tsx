import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './theme';

function Bar({ pct, i, active }: { pct: number; i: number; active: boolean }) {
  const h = useSharedValue(0);
  useEffect(() => { h.value = withDelay(i * 60, withSpring(Math.max(0.03, pct), { damping: 16, stiffness: 120 })); }, [pct, i, h]);
  const s = useAnimatedStyle(() => ({ height: `${h.value * 100}%` }));
  return <Animated.View style={[{ width: '100%', borderRadius: 8, overflow: 'hidden' }, s]}><LinearGradient colors={active ? [colors.brand, '#FF8A50'] : ['#FFD2BD', '#FFE6DA']} style={{ flex: 1 }} /></Animated.View>;
}
/** Animated bar chart (no chart library needed). */
export function BarChart({ data, height = 120 }: { data: Array<{ label: string; value: number }>; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <View style={{ height, width: '100%', justifyContent: 'flex-end' }}><Bar pct={d.value / max} i={i} active={i === data.length - 1} /></View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>{d.label}</Text>
        </View>))}
    </View>
  );
}
