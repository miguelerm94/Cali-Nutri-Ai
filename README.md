# CALI-NUTRI AI — Monorepo

**Sprints entregados:** S1 — Fundación · S2 — Onboarding (semanas 1-4, `FD-INFRA-01`)
**Stack:** NestJS 10 · Prisma 5 · PostgreSQL 15 (Supabase) · Redis (Upstash) · Expo SDK 51 / React Native · Turborepo

## Qué incluye este entregable

| Deliverable | Sprint | Estado |
|---|---|---|
| Monorepo Turborepo + DB canónica + CI/CD/OTA | S1 | ✅ |
| Auth email + Google/Apple OAuth (delegado a Supabase, FD-ARCH-01) | S1 | ✅ |
| Offline queue base (`/sync/offline-queue`) | S1 | ✅ |
| Evaluación inicial — scoring FD-01 (dominadas/flexiones/sentadillas/core) | S2 | ✅ |
| Motor TDEE + macros (Mifflin-St Jeor, FD-05/FD-06) | S2 | ✅ |
| Generador de rutina inicial (FD-03 estructura + FD-04 series/reps/RPE) | S2 | ✅ |
| Catálogo de 20 ejercicios MVP con cadenas de progresión (MVP.md §5.2) | S2 | ✅ |
| Wizard de onboarding (7 pasos, retoma de sesión vía MMKV — A-08) | S2 | ✅ |
| Preferencia de unidades métrico/imperial (A-03) | S2 | ✅ |

Pendiente para S3 (Training completo: sesiones, logs, progresión, deload, detección de estancamiento), S4 (Nutrición: USDA, diario), S5a (Hidratación+Home), S5b (CALI), S6a-b (Integraciones, monetización, QA).

## Decisiones de arquitectura aplicadas en S2

- **Ubicación temporal de motores:** `TdeeCalculatorEngine` y `MacroCalculatorEngine` viven en `modules/assessment/engines/` (no en `modules/nutrition/` aún, porque ese módulo no existe hasta S4). Se promueven sin cambiar su interfaz pública. Mismo patrón para `GoalRepository` (vive en `assessment/`, se mueve a `BodyModule` cuando se construya).
- **TrainingModule mínimo:** en S2 solo expone `RoutineGeneratorEngine` + repositorios de `Exercise`/`TrainingProgram`, consistente con el mapa de dependencias de `BackendArchitecture.md` ("AssessmentModule importa TrainingModule"). Sesiones/logs/progresión llegan en S3 al mismo módulo.
- **Scoring de Sentadillas/Plancha:** `FinalDecisions.md` (FD-01) solo tabula Dominadas y Flexiones. Sentadillas/Core se interpolan desde las bandas de `MVP.md §5.1` con el mismo método matemático — documentado en `assessment-scoring.engine.ts` para revisión del equipo de ciencia del deporte.
- **Estructura de 5 días:** se usó `FinalDecisions.md FD-03` ("Push/Pull/Legs + 2 complementarios"), no la versión de `MVP.md §5.2` ("Push/Pull/Legs/Upper/Lower"), por jerarquía de capas.
- **`goal_type`:** se usa el enum real de `schema_v2.md` (`muscle_gain/fat_loss/recomposition/maintenance`), no `'strength'` (mencionado solo narrativamente en `BackendArchitecture.md §7`, inexistente en el schema).

## Setup local

```bash
pnpm install

cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp packages/database/.env.example packages/database/.env

docker compose -f apps/api/docker-compose.dev.yml up -d

pnpm db:generate
pnpm db:migrate
pnpm db:migrate:sql
pnpm db:seed          # siembra el catálogo de 20 ejercicios (S2)

pnpm api:dev           # http://localhost:3000/v1 · GET /health
pnpm mobile:dev         # en otra terminal
```

### Variables obligatorias antes de arrancar

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — proyecto Supabase (Auth + Postgres).
- `ENCRYPTION_KEY` — 32 bytes hex: `openssl rand -hex 32`.
- `AWS_*` / `S3_BUCKET_NAME` — credenciales de un bucket S3.

`ANTHROPIC_API_KEY`, `USDA_API_KEY` y `REVENUECAT_*` son opcionales hasta S4/S5b/S6a.

## Probar el flujo completo

```bash
# 1. Registro
curl -X POST http://localhost:3000/v1/auth/register -H "Content-Type: application/json" \
  -d '{"email":"test@cali.app","password":"Tr4in.Str0ng!","first_name":"Carlos","accept_terms":true,"accept_privacy":true}'

# 2. Onboarding (usa el access_token de la respuesta anterior)
curl -X POST http://localhost:3000/v1/assessment/initial \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
  -d '{"birth_date":"1995-05-20","sex":"male","height_cm":178,"weight_kg":75,"training_frequency":4,"unit_preference":"metric","goal_type":"muscle_gain","movement_tests":{"pull_ups_max":5,"push_ups_max":20,"squats_max":25,"plank_seconds":40}}'
```

## Continuar en Claude Code

Este repo ya incluye `CLAUDE.md` (raíz) y `docs/` (los 20 documentos fuente, incluida la Instrucción Maestra). Claude Code lee `CLAUDE.md` automáticamente al iniciar sesión — no necesitas pegar la jerarquía ni el stack de nuevo.

```bash
cd cali-nutri-ai
git init && git add -A && git commit -m "Baseline S1+S2"
claude
```

Dentro de Claude Code, simplemente pide el siguiente sprint: *"Construye S3 — Training según FD-INFRA-01"*. Si necesitas instalar Claude Code primero, revisa la guía oficial en code.claude.com — los pasos varían según tu sistema operativo.

## Estructura

```
CLAUDE.md           → Leído automáticamente por Claude Code en cada sesión
docs/               → Los 20 documentos fuente (jerarquía completa, incluida la Instrucción Maestra)
apps/api/           → Backend NestJS (auth, sync, assessment + training mínimo)
apps/mobile/         → App Expo (Auth + wizard de onboarding de 7 pasos)
packages/database/   → schema.prisma + SQL canónico + seed (20 ejercicios)
packages/shared-types/ → Tipos compartidos (DTOs, enums, error codes, conversión de unidades)
.github/workflows/    → ci.yml · api-deploy.yml (ECS Fargate) · eas-update.yml (OTA)
```

## Siguiente sprint

S3 — Training: sesiones de entrenamiento, registro de series con RPE, progresión automática (FD-04), historial, detección pasiva de estancamiento (FD-02).
