import * as SecureStore from 'expo-secure-store';

let memoryFallback: Record<string, string> = {};

/**
 * Mobile Hardware Secure Storage
 * Uses iOS Keychain and Android KeyStore / EncryptedSharedPreferences
 * to ensure sensitive refresh tokens are protected at rest.
 */
export const SecureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryFallback[key] = value;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryFallback[key] || null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      delete memoryFallback[key];
    }
  },
};
