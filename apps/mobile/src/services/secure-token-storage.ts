import * as SecureStore from 'expo-secure-store';

/**
 * Refresh token → Keychain (iOS) / EncryptedSharedPreferences (Android) via expo-secure-store.
 * Fuente: Architecture.md "Especificaciones de Seguridad — Almacenamiento RT en móvil".
 * El access_token NUNCA se persiste — vive solo en memoria (Zustand, ver auth.store.ts).
 */
const REFRESH_TOKEN_KEY = 'cali_refresh_token';

export const secureTokenStorage = {
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },
  async clearRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
