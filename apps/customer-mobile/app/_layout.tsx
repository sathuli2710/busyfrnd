import { useEffect } from 'react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AppProvider, Loading, useApp } from '@busyfrnd/mobile-core';

export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string) ?? 'http://10.0.2.2:4000';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });

function Gate() {
  const { user, ready, api } = useApp();
  const seg = useSegments();
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const perm = await Notifications.requestPermissionsAsync();
        if (!perm.granted) return;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const tok = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        await api.me.update({ pushToken: tok.data });
      } catch { /* push is optional (needs EAS projectId + device) */ }
    })();
  }, [user, api]);
  if (!ready) return <Loading />;
  if (!user && seg[0] !== 'login') return <Redirect href="/login" />;
  return (
    <Stack screenOptions={{ headerTintColor: '#F57C00' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="store/[id]" options={{ title: 'Store' }} />
      <Stack.Screen name="checkout/[storeId]" options={{ title: 'Checkout' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
    </Stack>
  );
}

export default function Root() {
  return (
    <AppProvider storageKey="bf.customer" apiUrl={API_URL}>
      <StatusBar style="dark" />
      <Gate />
    </AppProvider>
  );
}
