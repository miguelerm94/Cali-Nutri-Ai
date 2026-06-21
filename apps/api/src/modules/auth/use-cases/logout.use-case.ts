import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { RedisKeys } from '../../../infrastructure/redis/redis-keys.enum';

/**
 * Revoca la sesión en Supabase + blacklist defensiva en Redis.
 * Nota (BackendArchitecture.md §8): JwtAuthGuard hoy NO consulta esta blacklist
 * (queda documentado como mejora futura); la revocación real de la sesión la
 * garantiza Supabase al invalidar el refresh token.
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly redis: RedisService,
  ) {}

  async execute(accessToken: string): Promise<void> {
    await this.supabaseService.signOut(accessToken);

    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    // TTL conservador: el access token de Supabase expira típicamente en 1h.
    await this.redis.set(RedisKeys.authBlacklist(tokenHash), '1', 3600);
  }
}
