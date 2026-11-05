import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tap } from './kit';
import { colors } from './theme';

interface TabBarProps {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  descriptors: Record<string, { options: { title?: string; tabBarIcon?: (p: { focused: boolean; color: string; size: number }) => ReactNode; tabBarBadge?: string | number } }>;
  navigation: { emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean }; navigate: (name: string) => void };
}

/** Frosted tab bar with a sliding indicator — drop into <Tabs tabBar={(p) => <TabBar {...p} />}>. */
export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const n = state.routes.length, itemW = w / Math.max(1, n);
  const x = useSharedValue(0);
  useEffect(() => { x.value = withSpring(state.index * itemW, { damping: 20, stiffness: 240 }); }, [state.index, itemW, x]);
  const bar = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <BlurView intensity={Platform.OS === 'ios' ? 60 : 90} tint="extraLight" experimentalBlurMethod="dimezisBlurView" style={{ paddingBottom: insets.bottom, borderTopWidth: 0.5, borderTopColor: colors.line, backgroundColor: 'rgba(255,255,255,0.88)' }}>
        {itemW > 0 && <Animated.View style={[{ position: 'absolute', top: 0, width: itemW, alignItems: 'center' }, bar]}><View style={{ width: 28, height: 4, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.text }} /></Animated.View>}
        <View style={{ flexDirection: 'row', paddingTop: 8, paddingBottom: 4 }}>
          {state.routes.map((r, i) => {
            const o = descriptors[r.key].options, focused = state.index === i, color = focused ? colors.text : colors.muted;
            return (
              <Tap key={r.key} style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 }} accessibilityRole="button" accessibilityLabel={o.title ?? r.name} accessibilityState={{ selected: focused }} scale={0.88}
                onPress={() => { const e = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true }); if (!focused && !e.defaultPrevented) navigation.navigate(r.name); }}>
                <View>{o.tabBarIcon?.({ focused, color, size: 24 })}{o.tabBarBadge ? <View style={{ position: 'absolute', top: -4, right: -10, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{o.tabBarBadge}</Text></View> : null}</View>
                <Text style={{ fontSize: 11, fontWeight: focused ? '800' : '600', color }}>{o.title ?? r.name}</Text>
              </Tap>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
