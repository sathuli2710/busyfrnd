import { Tabs } from 'expo-router';
import { Icon, TabBar, useApp } from '@busyfrnd/mobile-core';

export default function TabsLayout() {
  const { t } = useApp();
  return (
    <Tabs tabBar={(p) => <TabBar {...(p as unknown as Parameters<typeof TabBar>[0])} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('nav.dashboard'), tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'grid' : 'grid-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: t('nav.orders'), tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="assistant" options={{ title: 'AI Buddy', tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'sparkles' : 'sparkles-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: t('nav.plans'), tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'person-circle' : 'person-circle-outline'} size={26} color={color} /> }} />
    </Tabs>
  );
}
