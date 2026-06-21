# scripts/

- `db-health-check.sh` — espera a que PostgreSQL esté disponible (Docker/CI).

**Nota:** `generate-rsa-keys.sh` (mencionado en BackendArchitecture.md §2) NO
se incluye. Bajo FD-ARCH-01 (Capa 0, autoridad sin excepción), Supabase es el
ÚNICO emisor de JWT — NestJS solo valida contra su JWKS público. No existe
ningún par de llaves RS256 propio que generar. Ver corrección documentada en
`apps/api/src/config/jwt.config.ts`.
