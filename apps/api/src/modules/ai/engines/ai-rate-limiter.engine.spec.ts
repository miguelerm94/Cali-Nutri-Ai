import { AiRateLimiterEngine } from './ai-rate-limiter.engine';
import { RedisService } from '../../../infrastructure/redis/redis.service';

describe('AiRateLimiterEngine (FD-ARCH-04)', () => {
  function makeEngine(count: number) {
    const redisService = { increment: jest.fn().mockResolvedValue(count) } as unknown as RedisService;
    return { engine: new AiRateLimiterEngine(redisService), redisService };
  }

  it('permite el mensaje cuando el contador está bajo el límite free (10)', async () => {
    const { engine } = makeEngine(3);
    const result = await engine.checkAndIncrement('user-1', 'free');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(10);
  });

  it('bloquea el mensaje al superar el límite free (10)', async () => {
    const { engine } = makeEngine(11);
    const result = await engine.checkAndIncrement('user-1', 'free');
    expect(result.allowed).toBe(false);
  });

  it('usa el límite premium (100) para usuarios premium', async () => {
    const { engine } = makeEngine(50);
    const result = await engine.checkAndIncrement('user-1', 'premium');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
  });

  it('bloquea exactamente al exceder el límite, no al igualarlo', async () => {
    const atLimit = await makeEngine(10).engine.checkAndIncrement('user-1', 'free');
    expect(atLimit.allowed).toBe(true);

    const overLimit = await makeEngine(11).engine.checkAndIncrement('user-1', 'free');
    expect(overLimit.allowed).toBe(false);
  });
});
