import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infrastructure/redis/redis.service';

/**
 * FD-ARCH-04: contadores Redis con TTL 24h. El tier "Admin" mencionado en la FD
 * no existe en `UserTier` (schema.prisma solo define free/premium) — Layer 1
 * prevalece para esta decisión puntual, así que aquí solo se modelan esos dos.
 */
const LIMITS: Record<'free' | 'premium', number> = {
  free: 10,
  premium: 100,
};

const DAY_SECONDS = 86400;

@Injectable()
export class AiRateLimiterEngine {
  constructor(private readonly redisService: RedisService) {}

  async checkAndIncrement(userId: string, tier: 'free' | 'premium'): Promise<{ allowed: boolean; count: number; limit: number; resetAt: Date }> {
    const today = new Date().toISOString().slice(0, 10);
    const key = `rate:ai:${userId}:${today}`;
    const count = await this.redisService.increment(key, DAY_SECONDS);
    const limit = LIMITS[tier];
    const resetAt = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1));
    return { allowed: count <= limit, count, limit, resetAt };
  }
}
