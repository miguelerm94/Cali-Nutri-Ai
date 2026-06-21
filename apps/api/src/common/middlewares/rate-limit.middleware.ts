import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ErrorCode } from '@cali-nutri/shared-types';

/**
 * Primera línea de defensa — rate limit por IP, ANTES de autenticación.
 * Límites (BackendArchitecture.md §10): /auth/* → 20 req/min | resto → 200 req/min.
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly redis: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const isAuthRoute = req.path.startsWith('/v1/auth');
    const limit = isAuthRoute ? 20 : 200;
    const key = `rate:ip:${isAuthRoute ? 'auth' : 'general'}:${ip}`;

    let count: number;
    try {
      count = await this.redis.increment(key, 60); // TTL 1 min
    } catch {
      // Degradación elegante: si Redis cae, no se bloquea el tráfico (FD-Sección error handling).
      return next();
    }

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

    if (count > limit) {
      res.setHeader('Retry-After', '60');
      throw new ServiceUnavailableException({
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Demasiadas solicitudes desde esta IP. Intenta más tarde.',
        retry_after_seconds: 60,
      });
    }
    next();
  }
}
