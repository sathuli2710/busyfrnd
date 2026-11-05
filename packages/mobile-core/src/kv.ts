import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Key-value storage: SecureStore on devices, localStorage on web (Expo Web preview). */
export const kv = {
  get: async (k: string): Promise<string | null> => { try { return Platform.OS === 'web' ? window.localStorage.getItem(k) : await SecureStore.getItemAsync(k); } catch { return null; } },
  set: async (k: string, v: string): Promise<void> => { try { if (Platform.OS === 'web') window.localStorage.setItem(k, v); else await SecureStore.setItemAsync(k, v); } catch { /* ignore */ } },
  del: async (k: string): Promise<void> => { try { if (Platform.OS === 'web') window.localStorage.removeItem(k); else await SecureStore.deleteItemAsync(k); } catch { /* ignore */ } },
};
