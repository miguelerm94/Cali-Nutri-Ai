import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseAuthSession {
  supabaseUserId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Wrapper inyectable sobre el cliente admin de Supabase (service_role_key).
 * FD-ARCH-01: Supabase es el ÚNICO emisor de JWT de sesión — este servicio
 * es el único punto del backend que habla con Supabase Auth.
 *
 * Nota de seguridad: service_role_key NUNCA llega al cliente móvil
 * (BackendArchitecture.md §11).
 */
@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient(
      this.configService.get<string>('supabase.url') as string,
      this.configService.get<string>('supabase.serviceRoleKey') as string,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  /** Crea el usuario en Supabase Auth (registro con email/password). */
  async createAuthUser(email: string, password: string, metadata?: Record<string, unknown>) {
    const { data, error } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // MVP: sin verificación de email por link (se evalúa en v1.1)
      user_metadata: metadata,
    });
    if (error || !data.user) {
      throw new Error(`Supabase createUser falló: ${error?.message ?? 'sin usuario devuelto'}`);
    }
    return data.user;
  }

  /** Login email/password — Supabase valida credenciales y emite el JWT de sesión. */
  async signInWithPassword(email: string, password: string): Promise<SupabaseAuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      throw new InvalidCredentialsError(error?.message ?? 'Credenciales inválidas');
    }
    return {
      supabaseUserId: data.user.id,
      email: data.user.email as string,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  /** Verifica un id_token de OAuth (Google/Apple) y emite sesión Supabase. */
  async signInWithIdToken(
    provider: 'google' | 'apple',
    idToken: string,
  ): Promise<
    SupabaseAuthSession & {
      isNewUser: boolean;
      profile: { fullName?: string; avatarUrl?: string; providerSub?: string };
    }
  > {
    const { data, error } = await this.client.auth.signInWithIdToken({ provider, token: idToken });
    if (error || !data.session || !data.user) {
      throw new InvalidCredentialsError(error?.message ?? 'Token OAuth inválido');
    }
    // Heurística de usuario nuevo: created_at === last_sign_in_at (primer login)
    const isNewUser = data.user.created_at === data.user.last_sign_in_at;
    const metadata = data.user.user_metadata ?? {};
    return {
      supabaseUserId: data.user.id,
      email: data.user.email as string,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      isNewUser,
      profile: {
        fullName: metadata.full_name ?? metadata.name,
        avatarUrl: metadata.avatar_url ?? metadata.picture,
        providerSub: metadata.sub ?? metadata.provider_id,
      },
    };
  }

  /**
   * Confirma un reset de password usando el token de recuperación enviado por
   * Supabase en el email (FD-ARCH-01: Supabase posee el password, no nosotros).
   * El reset_token recibido en POST /auth/reset-password es el token_hash que
   * el deep link de la app extrae del email de recuperación.
   */
  async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
    const { data, error } = await this.client.auth.verifyOtp({
      token_hash: resetToken,
      type: 'recovery',
    });
    if (error || !data.user) {
      throw new InvalidCredentialsError(error?.message ?? 'Token de recuperación inválido o expirado');
    }
    const { error: updateError } = await this.client.auth.admin.updateUserById(data.user.id, {
      password: newPassword,
    });
    if (updateError) {
      throw new Error(`No se pudo actualizar la contraseña: ${updateError.message}`);
    }
  }

  /** Refresh Token Rotation — delegado 100% a Supabase. */
  async refreshSession(refreshToken: string): Promise<SupabaseAuthSession> {
    const { data, error } = await this.client.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) {
      throw new InvalidCredentialsError(error?.message ?? 'Refresh token inválido o expirado');
    }
    return {
      supabaseUserId: data.user.id,
      email: data.user.email as string,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  /** Revoca la sesión en Supabase (logout). Best-effort. */
  async signOut(accessToken: string): Promise<void> {
    await this.client.auth.admin.signOut(accessToken, 'global').catch(() => undefined);
  }

  /** GDPR — elimina el usuario de Supabase Auth (usado en delete-account.use-case, S6). */
  async deleteAuthUser(supabaseUserId: string): Promise<void> {
    await this.client.auth.admin.deleteUser(supabaseUserId);
  }

  /** Alternativa nativa a una implementación propia de email de recuperación. */
  async sendPasswordResetEmail(email: string): Promise<void> {
    await this.client.auth.resetPasswordForEmail(email);
  }
}

export class InvalidCredentialsError extends Error {}
