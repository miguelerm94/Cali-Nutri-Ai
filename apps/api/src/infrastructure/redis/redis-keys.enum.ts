/**
 * Namespace centralizado de keys de Redis — evita "magic strings" dispersos.
 * Fuente: BackendArchitecture.md §15 "Namespace de Keys".
 * Se amplía progresivamente en cada sprint (S4 hidratación, S5b IA, etc.).
 */
export const RedisKeys = {
  rateLimitIp: (scope: 'auth' | 'general', ip: string) => `rate:ip:${scope}:${ip}`,
  rateLimitApi: (userId: string) => `rate:api:${userId}`,
  rateLimitAi: (userId: string, date: string) => `rate:ai:${userId}:${date}`,
  authBlacklist: (tokenHash: string) => `auth:blacklist:${tokenHash}`,
  hydrationTarget: (userId: string, date: string) => `hydration:target:${userId}:${date}`,
  cacheExercisesAll: () => 'cache:exercises:all',
  cacheProgramActive: (userId: string) => `cache:program:${userId}`,
  cacheNutritionTargets: (userId: string, date: string) => `cache:nutrition:targets:${userId}:${date}`,
} as const;
