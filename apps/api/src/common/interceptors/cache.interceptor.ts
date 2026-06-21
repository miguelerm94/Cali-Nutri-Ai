import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../infrastructure/redis/redis.service';

export const CACHE_KEY_METADATA = 'cacheKey';
export const CACHE_TTL_METADATA = 'cacheTtl';

/**
 * Caché Redis selectiva para GET endpoints (BackendArchitecture.md §9).
 * Uso: @SetMetadata('cacheKey', (req) => `cache:exercises:all`) + @SetMetadata('cacheTtl', 86400)
 * En S1 solo se deja la infraestructura lista; los endpoints concretos que la usan
 * (training/exercises, nutrition/targets, etc.) llegan en S3/S4.
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const handler = context.getHandler();
    const keyFn = Reflect.getMetadata(CACHE_KEY_METADATA, handler);
    const ttl = Reflect.getMetadata(CACHE_TTL_METADATA, handler) ?? 300;
    if (!keyFn) return next.handle();

    const request = context.switchToHttp().getRequest();
    const cacheKey = keyFn(request);
    const cached = await this.redis.get(cacheKey);
    if (cached) return of(JSON.parse(cached));

    return next.handle().pipe(
      tap(async (response) => {
        await this.redis.set(cacheKey, JSON.stringify(response), ttl);
      }),
    );
  }
}
