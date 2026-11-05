import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useApp } from '@busyfrnd/mobile-core';

const icon = (e: string) => () => <Text style={{ fontSize: 20 }}>{e}</Text>;

export default function TabsLayout() {
  const { t } = useApp();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#F57C00', headerTintColor: '#1B1F24' }}>
      <Tabs.Screen name="index" options={{ title: t('nav.home'), tabBarIcon: icon('🏠'), headerShown: false }} />
      <Tabs.Screen name="cart" options={{ title: t('nav.cart'), tabBarIcon: icon('🛒') }} />
      <Tabs.Screen name="orders" options={{ title: t('nav.orders'), tabBarIcon: icon('📦') }} />
      <Tabs.Screen name="settings" options={{ title: t('nav.settings'), tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
