import { registerAs } from '@nestjs/config';

/**
 * FD-ARCH-01 (FinalDecisions.md — autoridad máxima, Capa 0):
 * "Supabase Auth es el único emisor de JWT. NestJS valida contra la clave
 * pública de Supabase (RS256)" via su endpoint JWKS.
 *
 * CORRECCIÓN DE JERARQUÍA: BackendArchitecture.md §11 sugiere que NestJS
 * firma sus PROPIOS JWT RS256 — esto CONTRADICE FD-ARCH-01. Se resuelve a
 * favor de FinalDecisions.md (Capa 0, autoridad sin excepción): NestJS NO
 * firma tokens de sesión; solo los valida. No hay JWT_PRIVATE_KEY.
 */
export default registerAs('jwt', () => ({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  issuer: `${process.env.SUPABASE_URL}/auth/v1`,
  audience: 'authenticated',
  algorithms: ['RS256'] as const,
}));
