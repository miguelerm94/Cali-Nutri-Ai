import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

const LIMITS: Record<'free' | 'premium', number> = { free: 10, premium: 100 };

/** GET /ai/usage — consumo del límite diario de mensajes (FD-ARCH-04). */
@Injectable()
export class GetAiUsageUseCase {
  constructor(private readonly redisService: RedisService) {}

  async execute(user: AuthUser) {
    const today = new Date().toISOString().slice(0, 10);
    const key = `rate:ai:${user.id}:${today}`;
    const raw = await this.redisService.get(key);
    const count = raw ? Number(raw) : 0;
    const limit = LIMITS[user.tier];

    return {
      tier: user.tier,
      messages_used_today: count,
      daily_limit: limit,
      remaining: Math.max(limit - count, 0),
    };
  }
}
