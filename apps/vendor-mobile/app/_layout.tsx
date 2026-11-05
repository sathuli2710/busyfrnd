import { useEffect } from 'react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, Loading, ToastProvider, useApp } from '@busyfrnd/mobile-core';

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
    <Stack screenOptions={{ headerTintColor: '#0B0B0F', headerShadowVisible: false, headerStyle: { backgroundColor: '#F7F7F8' }, headerTitleStyle: { fontWeight: '800' }, animation: 'slide_from_right', contentStyle: { backgroundColor: '#F7F7F8' } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="store/[id]" options={{ title: 'My store', headerBackTitle: 'Back' }} />
    </Stack>
  );
}

export default function Root() {
  return (
    <SafeAreaProvider>
      <AppProvider storageKey="bf.vendor" apiUrl={API_URL}>
        <ToastProvider>
          <StatusBar style="dark" />
          <Gate />
        </ToastProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
