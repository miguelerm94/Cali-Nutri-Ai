import { registerAs } from '@nestjs/config';

/**
 * SEAM DE AUTENTICACIÓN LOCAL — SOLO DESARROLLO. NO viola FD-ARCH-01.
 *
 * FD-ARCH-01 (Capa 0) exige que Supabase sea el único emisor de JWT EN
 * PRODUCCIÓN. Este seam está completamente desactivado salvo que
 * `DEV_AUTH_ENABLED=true` (default: false), variable que NUNCA debe
 * activarse en producción. Permite probar la app end-to-end sin un proyecto
 * Supabase: emite y valida JWT HS256 firmados con un secreto local.
 *
 * Guard de seguridad adicional: aunque DEV_AUTH_ENABLED sea true, el seam se
 * niega a operar si NODE_ENV === 'production' (ver DevAuthService).
 */
export default registerAs('devAuth', () => ({
  enabled: process.env.DEV_AUTH_ENABLED === 'true',
  secret: process.env.DEV_AUTH_SECRET ?? 'cali-nutri-dev-only-secret-change-me',
  // 7 días — sesión cómoda para pruebas manuales.
  expiresInSeconds: 60 * 60 * 24 * 7,
  issuer: 'cali-nutri-dev-auth',
}));
