import { Tabs } from 'expo-router';
import { Icon, TabBar, useApp } from '@busyfrnd/mobile-core';
import { useCart } from '../../lib/cart';

export default function TabsLayout() {
  const { t } = useApp();
  const { count } = useCart();
  return (
    <Tabs tabBar={(p) => <TabBar {...(p as unknown as Parameters<typeof TabBar>[0])} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('nav.home'), tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'home' : 'home-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: t('nav.cart'), tabBarBadge: count || undefined, tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'bag-handle' : 'bag-handle-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: t('nav.orders'), tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Account', tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'person' : 'person-outline'} size={24} color={color} /> }} />
    </Tabs>
  );
}
