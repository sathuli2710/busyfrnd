import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { rupees } from '@busyfrnd/shared';
import { Icon, Tap, shadow, useApp } from '@busyfrnd/mobile-core';
import { useCart } from '../lib/cart';

/** Floating cart summary — springs up from the bottom like a native sheet. */
export function CartBar({ storeId, bottom = 16 }: { storeId: string; bottom?: number }) {
  const { t } = useApp();
  const router = useRouter();
  const cart = useCart().cartFor(storeId);
  const n = cart?.lines.reduce((s, l) => s + l.qty, 0) ?? 0;
  if (!cart || !n) return null;
  return (
    <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown} style={{ position: 'absolute', left: 16, right: 16, bottom }}>
      <Tap onPress={() => router.push(`/checkout/${storeId}`)} style={[{ backgroundColor: '#0B0B0F', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, shadow.lift]} scale={0.97}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}><Icon name="bag-handle" size={20} color="#fff" />
          <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#FF5A1F', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>{n}</Text></View></View>
        <View style={{ flex: 1 }}><Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>{n} {t('cart.items')}</Text><Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{rupees(cart.subtotal)}</Text></View>
        <Text style={{ color: '#fff', fontWeight: '800' }}>{t('cart.view')}</Text><Icon name="arrow-forward" size={18} color="#fff" />
      </Tap>
    </Animated.View>
  );
}
