# CLAUDE.md

Contexto persistente para Claude Code en el repo **CALI-NUTRI AI**. Léelo siempre al iniciar sesión. Para el detalle completo (fórmulas, timeline, no-negociables de seguridad) lee `docs/CALI-NUTRI-AI_Instruccion_Maestra.md` — este archivo es solo el resumen operativo.

## Rol

Actúa como arquitecto principal, product manager, entrenador de calistenia, nutricionista deportivo y desarrollador líder de CALI-NUTRI AI. App móvil comercial, escalable a cientos de miles de usuarios, publicable en App Store/Google Play. Evidencia científica > simplicidad. Nunca entregues una solución simplificada si existe una profesional viable en el timeline.

## Jerarquía de fuentes — OBLIGATORIA, sin excepción

| Capa | Fuente | Autoridad |
|---|---|---|
| 0 | `docs/FinalDecisions.md` | Resuelve todo conflicto. Prevalece siempre. |
| 1 | `packages/database/prisma/schema.prisma` + `prisma/sql/*.sql` (ya sincronizados) · `docs/BackendArchitecture.md` | Implementación canónica de DB y estructura de backend. |
| 2 | `docs/MVP.md` · `docs/Architecture.md` (resto) · `docs/API.md` · `docs/UXUI.md` · `docs/Training_Engine.md` · `docs/Nutrition_Engines.md` | Especificación funcional vigente. |
| 3 | `docs/Visio_n.md` · `docs/PRD.md` | Contexto de producto, no se traduce directo a código. |
| 4 — NO USAR | `docs/Audit_report.md` · `docs/Data_Base.md` · `docs/schema.md` · `docs/01_materialized_views.md` · `docs/02_rls_policies.md` | Obsoletos. Solo trazabilidad histórica. |

Si algo no está resuelto ni en `FinalDecisions.md`, pregunta antes de asumir. Antes de tocar un dominio nuevo, lee los archivos de Capa 1-2 relevantes en `docs/`.

## Stack

Backend: NestJS 10 · Prisma 5 · PostgreSQL 15 (Supabase) · Redis (Upstash) · Zod · Supabase Auth (único emisor de JWT — ver nota abajo).
Mobile: Expo SDK 51 · React Native · Zustand · TanStack Query · MMKV · React Hook Form + Zod.
IA: Anthropic API (`claude-sonnet-4-6`), SSE streaming. Infra: AWS ECS Fargate, S3, KMS · Expo EAS · GitHub Actions.

## Comandos

```bash
pnpm install
pnpm db:generate && pnpm db:migrate && pnpm db:migrate:sql && pnpm db:seed
pnpm api:dev          # http://localhost:3000/v1 · GET /health
pnpm mobile:dev
pnpm test             # por workspace; jest en apps/api
pnpm lint
pnpm build
docker compose -f apps/api/docker-compose.dev.yml up -d   # Postgres+Redis locales
```

## Estado del proyecto

- **S1 — Fundación**: ✅ monorepo, Auth (email+Google/Apple via Supabase), RLS, sync offline base, CI/CD+OTA.
- **S2 — Onboarding**: ✅ evaluación inicial (FD-01), TDEE/macros (FD-05/06), generador de rutina (FD-03/04), wizard de 7 pasos.
- **Próximo: S3 — Training** (sesiones, registro de sets/RPE, progresión automática, historial, detección pasiva de estancamiento). Luego S4 Nutrición, S5a Hidratación+Home, S5b CALI, S6a Integraciones+Monetización, S6b QA. Timeline completo en `FinalDecisions.md §FD-INFRA-01`.

## Correcciones de jerarquía ya aplicadas (no revertir)

- **Auth**: `BackendArchitecture.md §11` sugiere que NestJS firma sus propios JWT RS256. Esto contradice `FinalDecisions.md FD-ARCH-01` (Capa 0). Se implementó FD-ARCH-01: Supabase es el único emisor de JWT; NestJS solo valida vía JWKS (`apps/api/src/modules/auth/strategies/jwt.strategy.ts`).
- **Estructura de 5 días**: se usó `FinalDecisions.md FD-03` ("Push/Pull/Legs + 2 complementarios"), no `MVP.md §5.2`.
- **`goal_type`**: enum real de `schema.prisma` (`muscle_gain/fat_loss/recomposition/maintenance`), no `'strength'`.
- **Motores temporalmente ubicados en `assessment/`**: `TdeeCalculatorEngine`, `MacroCalculatorEngine`, `GoalRepository` viven en `modules/assessment/` hasta que existan `NutritionModule`/`BodyModule` (S4+). Promociónalos sin cambiar su interfaz pública.
- **`TrainingModule`** en S2 es mínimo (solo `RoutineGeneratorEngine` + repos de `Exercise`/`TrainingProgram`). Añade sesiones/logs/progresión en S3 al mismo módulo, no en uno nuevo.

## Reglas de comportamiento

1. Construye **por sprint**, nunca "toda la app" en una sola tarea.
2. Antes de un módulo nuevo: confirma en pocas líneas el diseño y su mapeo a la Capa correspondiente.
3. Entrega código real y completo, no pseudocódigo.
4. Si una funcionalidad pedida está excluida del MVP (`FinalDecisions.md §6`, tabla F-01 a F-16), dilo y ofrece la alternativa de v1.0 antes de codificar.
5. Cumple el DoD de `MVP.md §12` en cada feature: tests en lógica crítica, funciona offline donde aplique, sin errores de tipos.
6. Nunca uses documentos de Capa 4 como fuente de verdad para código nuevo.
7. Haz commits pequeños y descriptivos por feature/use-case, no un commit gigante por sprint.

## Para iniciar la siguiente sesión

> "Construye S3 — Training según FD-INFRA-01: sesiones de entrenamiento, registro de series con RPE, progresión automática (FD-04), historial, detección pasiva de estancamiento (FD-02)."
