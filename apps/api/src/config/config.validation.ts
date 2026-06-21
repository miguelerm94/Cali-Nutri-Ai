import { z } from 'zod';

/**
 * Valida TODAS las variables de entorno al arrancar la aplicación (fail-fast).
 * Fuente: BackendArchitecture.md Apéndice B, corregido según FD-ARCH-01
 * (sin JWT_PRIVATE_KEY/JWT_PUBLIC_KEY — Supabase es el único emisor de JWT).
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('3000'),
  API_VERSION: z.string().default('1'),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  REDIS_URL: z.string().min(1),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, 'ENCRYPTION_KEY debe ser 32 bytes en hex (64 caracteres)'),

  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),

  ANTHROPIC_API_KEY: z.string().optional(), // Requerido a partir de S5b
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),

  USDA_API_KEY: z.string().optional(), // Requerido a partir de S4
  REVENUECAT_API_KEY: z.string().optional(), // Requerido a partir de S6a
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(), // Push notifications (S6a) — opcional (modo enhanced security)

  SENTRY_DSN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`❌ Variables de entorno inválidas:\n${issues}`);
  }
  return parsed.data;
}
