import { create } from 'zustand';
import { AuthResponseDto } from '@cali-nutri/shared-types';
import { secureTokenStorage } from '../services/secure-token-storage';

interface AuthState {
  accessToken: string | null; // Solo en memoria — Architecture.md
  user: AuthResponseDto['user'] | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setSession: (auth: AuthResponseDto) => Promise<void>;
  setAccessToken: (token: string) => void;
  updateUser: (partial: Partial<AuthResponseDto['user']>) => void;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isHydrating: true,

  setSession: async (auth) => {
    await secureTokenStorage.setRefreshToken(auth.tokens.refresh_token);
    set({ accessToken: auth.tokens.access_token, user: auth.user, isAuthenticated: true, isHydrating: false });
  },

  setAccessToken: (token) => set({ accessToken: token }),

  /** Parchea campos del usuario en memoria SIN tocar tokens (ej: onboarding_completed tras S2). */
  updateUser: (partial) => set((state) => (state.user ? { user: { ...state.user, ...partial } } : state)),

  clearSession: async () => {
    await secureTokenStorage.clearRefreshToken();
    set({ accessToken: null, user: null, isAuthenticated: false, isHydrating: false });
  },
}));
