import { apiClient } from './api-client';
import {
  AuthResponseDto,
  LoginRequest,
  OAuthLoginRequest,
  RegisterRequest,
} from '@cali-nutri/shared-types';

/** Llamadas REST del módulo Auth — API.md §2. Cada función retorna `data.data` ya desempaquetado. */
export const authApi = {
  async register(payload: RegisterRequest): Promise<AuthResponseDto> {
    const { data } = await apiClient.post('/auth/register', payload);
    return data.data;
  },

  async login(payload: LoginRequest): Promise<AuthResponseDto> {
    const { data } = await apiClient.post('/auth/login', payload);
    return data.data;
  },

  async oauthLogin(provider: 'google' | 'apple', payload: OAuthLoginRequest): Promise<AuthResponseDto> {
    const { data } = await apiClient.post(`/auth/oauth/${provider}`, payload);
    return data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
