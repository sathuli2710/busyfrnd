import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useApp } from '@busyfrnd/mobile-core';

const icon = (e: string) => () => <Text style={{ fontSize: 20 }}>{e}</Text>;

export default function TabsLayout() {
  const { t } = useApp();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#F57C00' }}>
      <Tabs.Screen name="index" options={{ title: t('nav.dashboard'), tabBarIcon: icon('📊'), headerShown: false }} />
      <Tabs.Screen name="orders" options={{ title: t('nav.orders'), tabBarIcon: icon('📦') }} />
      <Tabs.Screen name="assistant" options={{ title: t('nav.assistant'), tabBarIcon: icon('🎙️') }} />
      <Tabs.Screen name="account" options={{ title: t('nav.plans'), tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
