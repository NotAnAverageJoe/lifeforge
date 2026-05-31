import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Missing required env vars: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// expo-secure-store has a 2048-byte limit per key on iOS; chunk large values.
const CHUNK_SIZE = 1900;

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}_count`).catch(() => null);
    if (!countStr) return null;
    const count = parseInt(countStr, 10);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${key}_${i}`).catch(() => null)
      )
    );
    if (chunks.some(c => c === null)) return null;
    return (chunks as string[]).join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}_count`, String(chunks.length));
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk)));
  },

  async removeItem(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(`${key}_count`).catch(() => null);
    if (!countStr) return;
    const count = parseInt(countStr, 10);
    await Promise.all([
      SecureStore.deleteItemAsync(`${key}_count`),
      ...Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)),
    ]);
  },
};

export const supabase = createClient(url, key, {
  auth: {
    // On web, AsyncStorage maps to localStorage (JavaScript-readable). This is acceptable
    // for a dev/internal web target. If web becomes a production target, swap for a
    // server-side cookie adapter (e.g., @supabase/ssr) to get httpOnly cookie storage.
    storage: Platform.OS === 'web' ? AsyncStorage : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
