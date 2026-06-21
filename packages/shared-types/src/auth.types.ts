/**
 * Tipos del módulo Auth. Fuente: API.md §2 + BackendArchitecture.md §7 (Auth DTOs).
 */
export interface DeviceInfo {
  device_id: string;
  os: string;
  app_version: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  accept_terms: true;
  accept_privacy: true;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_info?: DeviceInfo;
}

export interface OAuthLoginRequest {
  id_token: string;
  provider: 'google' | 'apple';
  device_info: DeviceInfo;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}

export interface TokensDto {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface UserSummaryDto {
  id: string;
  email: string;
  first_name: string;
  last_name?: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface AuthResponseDto {
  user: UserSummaryDto;
  tokens: TokensDto;
  is_new_user?: boolean;
}

/** Payload del JWT de acceso (RS256), firmado por el backend — no por Supabase. */
export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  tier: UserTierLiteral;
  onboarding_complete: boolean;
  iat: number;
  exp: number;
}

export type UserTierLiteral = 'free' | 'premium';
