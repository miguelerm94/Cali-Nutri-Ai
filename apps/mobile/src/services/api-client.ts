import axios, { AxiosError, AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { ApiErrorResponse } from '@cali-nutri/shared-types';
import { useAuthStore } from '../store/auth.store';
import { secureTokenStorage } from './secure-token-storage';

const baseURL = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://api.calinutri.app/v1';

export const apiClient: AxiosInstance = axios.create({ baseURL, timeout: 10_000 });

// Inyecta el access_token (memoria) en cada request — API.md "Authorization: Bearer <token>"
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-App-Version'] = '1.0.0';
  config.headers['X-Platform'] = Constants.platform?.ios ? 'ios' : 'android';
  return config;
});

let refreshPromise: Promise<string> | null = null;

/** Refresh-on-401 con cola única (evita refrescar en paralelo por múltiples requests). */
async function refreshAccessToken(): Promise<string> {
  const refreshToken = await secureTokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

  const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken });
  const tokens = data.data;
  await secureTokenStorage.setRefreshToken(tokens.refresh_token);
  useAuthStore.getState().setAccessToken(tokens.access_token);
  return tokens.access_token;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !(original as any)._retried) {
      (original as any)._retried = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        refreshPromise = null;
        await useAuthStore.getState().clearSession();
      }
    }
    return Promise.reject(error);
  },
);

/** Extrae el código/mensaje canónico de error del envelope de la API. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const apiError = (error.response.data as ApiErrorResponse).error;
    return apiError?.message ?? 'Ocurrió un error inesperado.';
  }
  return 'No se pudo conectar con el servidor. Revisa tu conexión.';
}
