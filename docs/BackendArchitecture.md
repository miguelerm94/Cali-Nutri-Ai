# CALI-NUTRI AI — BackendArchitecture.md

**Versión:** 1.0  
**Clasificación:** Documento Técnico Interno — Lead Backend Architect  
**Estado:** Aprobado para Implementación  
**Fuentes canónicas:** FinalDecisions.md · Architecture.md · Data_Base.md · API.md  
**Última actualización:** Junio 2026

-----

## ÍNDICE

1. [Principios Arquitectónicos del Backend](#1-principios-arquitectónicos-del-backend)
1. [Estructura Completa de Carpetas](#2-estructura-completa-de-carpetas)
1. [Módulos NestJS](#3-módulos-nestjs)
1. [Servicios](#4-servicios)
1. [Casos de Uso](#5-casos-de-uso)
1. [Repositorios](#6-repositorios)
1. [DTOs](#7-dtos)
1. [Guards](#8-guards)
1. [Interceptors](#9-interceptors)
1. [Middlewares](#10-middlewares)
1. [Integración Supabase Auth](#11-integración-supabase-auth)
1. [Integración Claude API](#12-integración-claude-api)
1. [Integración Apple Health y Health Connect](#13-integración-apple-health-y-health-connect)
1. [Estrategia Offline Sync](#14-estrategia-offline-sync)
1. [Redis — Estrategia Completa](#15-redis--estrategia-completa)
1. [SSE para IA](#16-sse-para-ia)
1. [Rate Limiting](#17-rate-limiting)
1. [Logging](#18-logging)
1. [Manejo de Errores](#19-manejo-de-errores)

-----

## 1. PRINCIPIOS ARQUITECTÓNICOS DEL BACKEND

### Patrón Base: Monolito Modular con Event Bus Interno

Conforme a ADR-001 (Architecture.md), el backend es un **Monolito Modular** con los siguientes principios de diseño aplicados a la capa NestJS:

|Principio                        |Implementación en NestJS                                                                       |
|---------------------------------|-----------------------------------------------------------------------------------------------|
|**Separación de dominio**        |Cada módulo de negocio es un NestJS Dynamic Module con fronteras claras de importación         |
|**Inversión de dependencias**    |Los casos de uso dependen de interfaces de repositorio, nunca de implementaciones concretas    |
|**Event-Driven para IA**         |`EventEmitter2` como bus interno; las mutaciones de IA no bloquean el request HTTP             |
|**Privacy by Design**            |`EncryptionService` inyectado en `AIModule`; RLS en PostgreSQL como segunda línea de defensa   |
|**Observabilidad desde el día 1**|`LoggingInterceptor` global + `RequestContextMiddleware` generan `request_id` en cada operación|
|**Fail-Safe Degradation**        |Cada integración externa (Claude, USDA, HealthKit) tiene fallback documentado en su servicio   |

### Decisiones de Diseño Críticas (de FinalDecisions.md)

- **FD-ARCH-02:** SSE para streaming de IA, no WebSockets. Compatible con escalado horizontal en ECS sin sticky sessions.
- **FD-ARCH-04:** Rate limiting con Redis counters (TTL 24h), no con base de datos.
- **FD-ARCH-05:** Un único `AIModule` transversal con acceso a Training y Nutrition context.
- **FD-DB-03:** `daily_summary` es una Vista Materializada. El backend **nunca escribe** en ella directamente.
- **FD-DB-06:** Contenido de `ai_messages` encriptado con AES-256-GCM. `EncryptionService` obligatorio.

-----

## 2. ESTRUCTURA COMPLETA DE CARPETAS

```
cali-nutri-api/
│
├── src/
│   ├── main.ts                          # Bootstrap: configura helmet, cors, versioning, global pipes
│   ├── app.module.ts                    # Root Module: importa todos los módulos de dominio
│   │
│   ├── config/                          # Configuración tipada por entorno
│   │   ├── app.config.ts                # Puerto, prefijo global, versión API
│   │   ├── database.config.ts           # URL de Prisma/PostgreSQL
│   │   ├── redis.config.ts              # Upstash Redis URL y credenciales
│   │   ├── jwt.config.ts                # Secretos RS256, TTLs de access/refresh token
│   │   ├── aws.config.ts                # S3 bucket, región, credenciales
│   │   ├── anthropic.config.ts          # API key, modelo, max_tokens, prompt cache
│   │   ├── supabase.config.ts           # URL y service_role_key de Supabase
│   │   └── config.validation.ts         # Joi/Zod schema de validación de ENV vars al arrancar
│   │
│   ├── common/                          # Código transversal — sin lógica de negocio
│   │   │
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts      # @CurrentUser() extrae AuthUser del request
│   │   │   ├── public.decorator.ts            # @Public() marca rutas sin autenticación
│   │   │   ├── premium.decorator.ts           # @RequiresPremium() marca endpoints de tier premium
│   │   │   └── throttle-key.decorator.ts      # @ThrottleKey() personaliza la clave de rate limit
│   │   │
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts       # Formato canónico de error {success, error, meta}
│   │   │   ├── prisma-exception.filter.ts     # Mapea Prisma errors a HTTPException con códigos propios
│   │   │   └── validation-exception.filter.ts # Mapea errores de Zod/class-validator a 400 estructurado
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts              # Guard global: verifica JWT RS256 en cada request
│   │   │   ├── refresh-token.guard.ts         # Guard exclusivo del endpoint /auth/refresh
│   │   │   ├── premium.guard.ts               # Verifica users.tier = 'premium' — aplica @RequiresPremium()
│   │   │   └── ownership.guard.ts             # Verifica que el resource_id pertenece al user autenticado
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts         # Loguea método, path, status, latencia por request
│   │   │   ├── transform.interceptor.ts       # Envuelve respuestas en {success: true, data, meta}
│   │   │   ├── cache.interceptor.ts           # Caché Redis selectiva para GET endpoints
│   │   │   └── timeout.interceptor.ts         # Timeout configurable por ruta (default: 10s, AI: 30s)
│   │   │
│   │   ├── middlewares/
│   │   │   ├── request-context.middleware.ts  # Genera y adjunta request_id (ULID) a cada request
│   │   │   ├── correlation-id.middleware.ts   # Propaga X-Correlation-ID entre servicios internos
│   │   │   └── rate-limit.middleware.ts       # Primer filtro: rate limit por IP antes de autenticación
│   │   │
│   │   ├── pipes/
│   │   │   ├── zod-validation.pipe.ts         # Pipe global: valida body/query con Zod schemas
│   │   │   └── parse-uuid.pipe.ts             # Valida y transforma params UUID
│   │   │
│   │   ├── interfaces/
│   │   │   ├── auth-user.interface.ts         # { id, email, tier, onboarding_complete }
│   │   │   ├── paginated-response.interface.ts
│   │   │   ├── api-response.interface.ts      # Contrato de respuesta { success, data, meta, pagination }
│   │   │   └── repository.interface.ts        # Interfaz base para todos los repositorios
│   │   │
│   │   └── types/
│   │       ├── user-tier.type.ts              # 'free' | 'premium'
│   │       ├── subscription-status.type.ts
│   │       └── health-platform.type.ts        # 'healthkit' | 'health_connect'
│   │
│   ├── infrastructure/                  # Adaptadores de infraestructura externa
│   │   │
│   │   ├── database/
│   │   │   ├── prisma.service.ts              # PrismaClient singleton con lifecycle hooks
│   │   │   └── prisma.module.ts               # Global module — exporta PrismaService
│   │   │
│   │   ├── redis/
│   │   │   ├── redis.service.ts               # Wrapper sobre ioredis con métodos tipados
│   │   │   ├── redis.module.ts                # Global module — exporta RedisService
│   │   │   └── redis-keys.enum.ts             # Enum con todas las keys de Redis (evita magic strings)
│   │   │
│   │   ├── aws/
│   │   │   ├── s3.service.ts                  # Upload, pre-signed URLs, delete
│   │   │   └── aws.module.ts
│   │   │
│   │   ├── encryption/
│   │   │   ├── encryption.service.ts          # AES-256-GCM encrypt/decrypt para ai_messages.content
│   │   │   └── encryption.module.ts           # Global module
│   │   │
│   │   └── events/
│   │       ├── event-bus.module.ts            # EventEmitter2 configurado como bus interno
│   │       └── events.enum.ts                 # Enum de todos los eventos internos del sistema
│   │
│   └── modules/                         # Módulos de dominio de negocio
│       │
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── use-cases/
│       │   │   ├── register.use-case.ts
│       │   │   ├── login.use-case.ts
│       │   │   ├── refresh-token.use-case.ts
│       │   │   ├── logout.use-case.ts
│       │   │   ├── forgot-password.use-case.ts
│       │   │   ├── reset-password.use-case.ts
│       │   │   └── oauth-login.use-case.ts
│       │   ├── strategies/
│       │   │   ├── jwt.strategy.ts            # Passport JWT RS256 — valida access_token
│       │   │   └── refresh.strategy.ts        # Passport JWT — valida refresh_token
│       │   ├── repositories/
│       │   │   └── auth.repository.ts         # Operaciones de token en DB + Supabase Auth
│       │   └── dto/
│       │       ├── register.dto.ts
│       │       ├── login.dto.ts
│       │       ├── refresh-token.dto.ts
│       │       ├── forgot-password.dto.ts
│       │       ├── reset-password.dto.ts
│       │       └── oauth-login.dto.ts
│       │
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── use-cases/
│       │   │   ├── get-profile.use-case.ts
│       │   │   ├── update-profile.use-case.ts
│       │   │   ├── upload-avatar.use-case.ts
│       │   │   ├── add-body-measurement.use-case.ts
│       │   │   ├── get-body-measurements.use-case.ts
│       │   │   ├── change-password.use-case.ts
│       │   │   ├── delete-account.use-case.ts    # GDPR right to be forgotten
│       │   │   └── export-data.use-case.ts       # GDPR data export
│       │   ├── repositories/
│       │   │   ├── users.repository.ts
│       │   │   └── body-measurements.repository.ts
│       │   └── dto/
│       │       ├── update-profile.dto.ts
│       │       ├── add-body-measurement.dto.ts
│       │       └── change-password.dto.ts
│       │
│       ├── assessment/
│       │   ├── assessment.module.ts
│       │   ├── assessment.controller.ts
│       │   ├── assessment.service.ts
│       │   ├── use-cases/
│       │   │   ├── complete-initial-assessment.use-case.ts
│       │   │   └── retest-assessment.use-case.ts
│       │   ├── repositories/
│       │   │   └── assessment.repository.ts
│       │   └── dto/
│       │       ├── initial-assessment.dto.ts
│       │       └── retest-assessment.dto.ts
│       │
│       ├── training/
│       │   ├── training.module.ts
│       │   ├── training.controller.ts
│       │   ├── training.service.ts
│       │   ├── use-cases/
│       │   │   ├── get-active-program.use-case.ts
│       │   │   ├── get-today-workout.use-case.ts
│       │   │   ├── start-session.use-case.ts
│       │   │   ├── log-set.use-case.ts
│       │   │   ├── complete-session.use-case.ts
│       │   │   ├── cancel-session.use-case.ts
│       │   │   ├── get-session-history.use-case.ts
│       │   │   ├── get-personal-records.use-case.ts
│       │   │   └── get-progress-chart.use-case.ts
│       │   ├── engines/
│       │   │   ├── routine-generator.engine.ts      # Genera rutina inicial basada en assessment
│       │   │   ├── progression.engine.ts             # Evalúa 2 semanas OK → incremento
│       │   │   ├── stagnation-detector.engine.ts     # Detección pasiva — alerta, no acción (v1.0)
│       │   │   └── deload.engine.ts                  # Lógica semana de descarga cada 6-8 semanas
│       │   ├── repositories/
│       │   │   ├── training-programs.repository.ts
│       │   │   ├── workout-sessions.repository.ts
│       │   │   ├── workout-logs.repository.ts
│       │   │   └── exercises.repository.ts
│       │   └── dto/
│       │       ├── start-session.dto.ts
│       │       ├── log-set.dto.ts
│       │       └── complete-session.dto.ts
│       │
│       ├── nutrition/
│       │   ├── nutrition.module.ts
│       │   ├── nutrition.controller.ts
│       │   ├── nutrition.service.ts
│       │   ├── use-cases/
│       │   │   ├── get-nutrition-targets.use-case.ts
│       │   │   ├── search-food.use-case.ts          # USDA API + base local fallback
│       │   │   ├── log-food.use-case.ts
│       │   │   ├── get-food-diary.use-case.ts
│       │   │   ├── update-food-entry.use-case.ts
│       │   │   ├── delete-food-entry.use-case.ts
│       │   │   ├── get-macro-summary.use-case.ts
│       │   │   └── get-nutrition-history.use-case.ts
│       │   ├── engines/
│       │   │   ├── tdee-calculator.engine.ts         # Mifflin-St Jeor + factor actividad
│       │   │   ├── macro-calculator.engine.ts        # Proteína 1.8-2.4g/kg, grasas 0.8-1.0g/kg
│       │   │   └── auto-adjust.engine.ts             # Sin cambio de peso en 14 días + adherencia >80%
│       │   ├── adapters/
│       │   │   └── usda-api.adapter.ts               # Normaliza respuesta de USDA al modelo interno
│       │   ├── repositories/
│       │   │   ├── food-diary.repository.ts
│       │   │   └── foods.repository.ts
│       │   └── dto/
│       │       ├── search-food.dto.ts
│       │       ├── log-food.dto.ts
│       │       └── update-food-entry.dto.ts
│       │
│       ├── hydration/
│       │   ├── hydration.module.ts
│       │   ├── hydration.controller.ts
│       │   ├── hydration.service.ts
│       │   ├── use-cases/
│       │   │   ├── get-hydration-today.use-case.ts   # Calcula target en runtime + cachea en Redis
│       │   │   ├── log-water.use-case.ts
│       │   │   ├── get-water-history.use-case.ts
│       │   │   └── delete-water-log.use-case.ts
│       │   ├── repositories/
│       │   │   └── water-logs.repository.ts
│       │   └── dto/
│       │       └── log-water.dto.ts
│       │
│       ├── body/
│       │   ├── body.module.ts
│       │   ├── body.controller.ts
│       │   ├── body.service.ts
│       │   ├── use-cases/
│       │   │   ├── get-goals.use-case.ts
│       │   │   ├── set-goal.use-case.ts
│       │   │   └── get-progress-summary.use-case.ts
│       │   ├── repositories/
│       │   │   └── goals.repository.ts
│       │   └── dto/
│       │       └── set-goal.dto.ts
│       │
│       ├── dashboard/
│       │   ├── dashboard.module.ts
│       │   ├── dashboard.controller.ts
│       │   ├── dashboard.service.ts
│       │   └── use-cases/
│       │       ├── get-today-summary.use-case.ts     # Calcula desde tablas fuente, NO desde MV
│       │       └── get-weekly-summary.use-case.ts    # Usa daily_summary_mv para historial
│       │
│       ├── ai/
│       │   ├── ai.module.ts
│       │   ├── ai.controller.ts                      # SSE endpoint para streaming
│       │   ├── ai.service.ts
│       │   ├── use-cases/
│       │   │   ├── list-conversations.use-case.ts
│       │   │   ├── create-conversation.use-case.ts
│       │   │   ├── send-message.use-case.ts          # Orquesta context-builder + Claude + action-executor
│       │   │   ├── stream-response.use-case.ts       # SSE: Observable<MessageEvent>
│       │   │   └── get-conversation-history.use-case.ts
│       │   ├── context-builder/
│       │   │   ├── context-builder.service.ts        # Construye el prompt de sistema dinámico
│       │   │   ├── user-profile-context.ts           # Perfil + objetivo + peso actual
│       │   │   ├── training-context.ts               # Últimas 10 sesiones + programa activo
│       │   │   ├── nutrition-context.ts              # Últimos 14 días + consumo del día
│       │   │   ├── hydration-context.ts              # Estado hoy
│       │   │   └── historical-summary.ts             # Resumen comprimido cacheado 24h en Redis
│       │   ├── action-executor/
│       │   │   ├── action-executor.service.ts        # Parsea tool_calls de Claude y los ejecuta
│       │   │   ├── log-workout.action.ts             # Llama internamente a TrainingService
│       │   │   ├── log-food.action.ts                # Llama internamente a NutritionService
│       │   │   ├── log-water.action.ts               # Llama internamente a HydrationService
│       │   │   ├── update-recovery.action.ts
│       │   │   └── trigger-program-adjustment.action.ts
│       │   ├── anthropic/
│       │   │   ├── anthropic.client.ts               # Wrapper tipado del Anthropic SDK
│       │   │   ├── prompt-cache.service.ts           # Gestiona Anthropic Prompt Caching del system prompt
│       │   │   └── tools.definition.ts               # Definición de los 6 tool calls para Claude
│       │   ├── repositories/
│       │   │   ├── conversations.repository.ts
│       │   │   └── ai-messages.repository.ts          # Encripta/desencripta content con EncryptionService
│       │   └── dto/
│       │       ├── create-conversation.dto.ts
│       │       └── send-message.dto.ts
│       │
│       ├── health-sync/
│       │   ├── health-sync.module.ts
│       │   ├── health-sync.controller.ts
│       │   ├── health-sync.service.ts
│       │   ├── use-cases/
│       │   │   ├── process-health-sync.use-case.ts   # Recibe payload del cliente y persiste
│       │   │   ├── get-health-data.use-case.ts
│       │   │   ├── get-permissions-status.use-case.ts
│       │   │   ├── update-permissions.use-case.ts
│       │   │   └── export-to-health.use-case.ts
│       │   ├── processors/
│       │   │   ├── steps.processor.ts                # Normaliza y persiste pasos
│       │   │   ├── weight.processor.ts               # Persiste en body_measurements si hay cambio
│       │   │   ├── sleep.processor.ts                # Persiste datos de sueño
│       │   │   └── calories.processor.ts
│       │   ├── repositories/
│       │   │   └── health-data.repository.ts
│       │   └── dto/
│       │       ├── health-sync.dto.ts
│       │       └── update-permissions.dto.ts
│       │
│       ├── notifications/
│       │   ├── notifications.module.ts
│       │   ├── notifications.service.ts              # Envía via FCM (Android) y APNs (iOS)
│       │   ├── use-cases/
│       │   │   └── send-notification.use-case.ts
│       │   ├── repositories/
│       │   │   └── notification-logs.repository.ts
│       │   └── templates/
│       │       ├── hydration-reminder.template.ts
│       │       └── training-reminder.template.ts
│       │
│       ├── subscriptions/
│       │   ├── subscriptions.module.ts
│       │   ├── subscriptions.controller.ts           # Webhook de RevenueCat: POST /webhooks/revenuecat
│       │   ├── subscriptions.service.ts
│       │   ├── use-cases/
│       │   │   ├── process-revenuecat-webhook.use-case.ts
│       │   │   └── get-subscription-status.use-case.ts
│       │   ├── repositories/
│       │   │   └── subscriptions.repository.ts
│       │   └── dto/
│       │       └── revenuecat-webhook.dto.ts
│       │
│       └── analytics/
│           ├── analytics.module.ts
│           ├── analytics.controller.ts
│           ├── analytics.service.ts
│           └── use-cases/
│               ├── get-training-adherence.use-case.ts
│               ├── get-nutrition-adherence.use-case.ts
│               └── get-streak.use-case.ts
│
├── prisma/
│   ├── schema.prisma                    # Schema canónico — fuente única para migraciones
│   ├── migrations/                      # Migraciones generadas por Prisma Migrate
│   └── seed/
│       ├── seed.ts                      # Script de seed inicial
│       └── data/
│           ├── exercises.json           # Catálogo de 50+ ejercicios de calistenia
│           └── foods-base.json          # Base curada de 500 alimentos comunes (fallback USDA)
│
├── test/
│   ├── unit/                            # Tests por módulo, co-ubicados con el módulo
│   ├── integration/                     # Tests de integración con DB real (Docker)
│   └── e2e/                             # Tests end-to-end con Supertest
│
├── scripts/
│   ├── generate-rsa-keys.sh             # Genera el par RS256 para JWT
│   └── db-health-check.sh
│
├── .env.example                         # Template de variables de entorno (sin secrets)
├── .env.development
├── docker-compose.dev.yml               # PostgreSQL + Redis locales
├── Dockerfile
├── nest-cli.json
├── tsconfig.json
└── package.json
```

-----

## 3. MÓDULOS NESTJS

### Mapa de Dependencias entre Módulos

```
AppModule (root)
│
├── GlobalModules (forRoot, disponibles en toda la app)
│   ├── PrismaModule          → exporta PrismaService
│   ├── RedisModule           → exporta RedisService
│   ├── EncryptionModule      → exporta EncryptionService
│   ├── EventBusModule        → exporta EventEmitter2
│   └── ConfigModule          → exporta ConfigService (variables de entorno)
│
├── AuthModule
│   └── importa: PrismaModule, RedisModule, JwtModule (RS256)
│
├── UsersModule
│   └── importa: PrismaModule, AwsModule (para avatar upload)
│
├── AssessmentModule
│   └── importa: PrismaModule, TrainingModule (genera rutina post-assessment)
│
├── TrainingModule
│   └── importa: PrismaModule, EventBusModule
│
├── NutritionModule
│   └── importa: PrismaModule, RedisModule (caché USDA), HttpModule (USDA API)
│
├── HydrationModule
│   └── importa: PrismaModule, RedisModule (caché de water target)
│
├── BodyModule
│   └── importa: PrismaModule
│
├── DashboardModule
│   └── importa: TrainingModule, NutritionModule, HydrationModule, HealthSyncModule
│
├── AIModule (transversal — accede a Training, Nutrition, Hydration)
│   └── importa: PrismaModule, RedisModule, EncryptionModule, TrainingModule,
│               NutritionModule, HydrationModule, HttpModule (Anthropic SDK)
│
├── HealthSyncModule
│   └── importa: PrismaModule, UsersModule, HydrationModule, EventBusModule
│
├── NotificationsModule
│   └── importa: PrismaModule, HttpModule (FCM), RedisModule
│
├── SubscriptionsModule
│   └── importa: PrismaModule, UsersModule
│
└── AnalyticsModule
    └── importa: PrismaModule, RedisModule
```

### Configuración del AppModule

```
AppModule configura globalmente:
  - JwtAuthGuard     → aplica a TODAS las rutas (las públicas usan @Public())
  - TransformInterceptor → envuelve todas las respuestas en {success, data, meta}
  - LoggingInterceptor  → loguea cada request
  - TimeoutInterceptor  → default 10s
  - HttpExceptionFilter → formato canónico de errores
  - ZodValidationPipe   → validación global de inputs
  - RequestContextMiddleware → genera request_id por request
```

### Diagrama de Módulo: AIModule (el más complejo)

```
AIModule
├── Controllers
│   └── AIController
│       ├── GET  /ai/conversations
│       ├── POST /ai/conversations
│       ├── GET  /ai/conversations/:id
│       ├── GET  /ai/conversations/:id/messages
│       ├── POST /ai/conversations/:id/messages  (202 Accepted → SSE)
│       └── GET  /ai/conversations/:id/stream    (@Sse() → Observable<MessageEvent>)
│
├── Services
│   ├── AIService              (orquestador principal)
│   ├── ContextBuilderService  (construye prompt dinámico)
│   ├── ActionExecutorService  (ejecuta tool_calls de Claude)
│   ├── AnthropicClient        (wrapper del SDK)
│   └── PromptCacheService     (gestiona caché de system prompt)
│
└── Repositories
    ├── ConversationsRepository
    └── AIMessagesRepository   (con encrypt/decrypt)
```

-----

## 4. SERVICIOS

### AuthService

Responsabilidades únicas y acotadas:

|Método                          |Descripción                                                                                          |
|--------------------------------|-----------------------------------------------------------------------------------------------------|
|`register(dto)`                 |Crea usuario en PostgreSQL + Supabase Auth. Genera access + refresh token RS256.                     |
|`login(dto)`                    |Verifica credenciales. Implementa timing-safe comparison para prevenir timing attacks.               |
|`refreshTokens(userId, token)`  |Refresh Token Rotation: invalida el token anterior, emite nuevo par.                                 |
|`logout(userId, refreshToken)`  |Hash del refresh token → marca como usado en DB + invalida en Redis blacklist.                       |
|`forgotPassword(email)`         |Genera reset token con TTL de 15 min. Siempre responde 200 (no revela si email existe).              |
|`resetPassword(token, password)`|Valida token, actualiza password_hash bcrypt(cost=12), invalida todos los refresh tokens del usuario.|
|`oauthLogin(provider, idToken)` |Verifica id_token con Google/Apple. Upsert de usuario. Devuelve tokens + is_new_user.                |

### UsersService

|Método                           |Descripción                                                                                                                         |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
|`getProfile(userId)`             |Llama a función PostgreSQL `get_user_profile()` — retorna usuario + peso actual (de body_measurements) + objetivo activo (de goals).|
|`updateProfile(userId, dto)`     |PATCH parcial. Invalida caché de perfil en Redis.                                                                                   |
|`uploadAvatar(userId, file)`     |Sube a S3 bajo `users/{userId}/profile-photo/`. Devuelve pre-signed URL con TTL 1h.                                                 |
|`addBodyMeasurement(userId, dto)`|Persiste en body_measurements. Emite evento `BODY_WEIGHT_UPDATED` al bus.                                                           |
|`deleteAccount(userId)`          |Soft delete: `deleted_at = NOW()`. Encola job de hard delete en 30 días (GDPR).                                                     |
|`exportData(userId)`             |Genera JSON con todos los datos del usuario. Sube a S3 con URL pre-firmada de 24h.                                                  |

### TrainingService

|Método                              |Descripción                                                                                                                            |
|------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
|`getActiveProgram(userId)`          |Recupera programa con días y ejercicios. Cachea en Redis 5 min.                                                                        |
|`getTodayWorkout(userId)`           |Determina el día del ciclo correspondiente a hoy.                                                                                      |
|`startSession(userId, dto)`         |Crea `workout_sessions` con `status: 'in_progress'`.                                                                                   |
|`logSet(sessionId, userId, dto)`    |Persiste en `workout_logs`. Compara con récord histórico.                                                                              |
|`completeSession(sessionId, userId)`|Cierra sesión. Ejecuta `ProgressionEngine.evaluate()`. Emite `SESSION_COMPLETED`.                                                      |
|`evaluateProgression(userId)`       |Motor de progresión: si 2 semanas consecutivas completadas al objetivo → incremento.                                                   |
|`detectStagnation(userId)`          |Detección pasiva: si 3+ semanas sin mejora → actualiza `stagnation_alert: true` en programa. No modifica rutina automáticamente (v1.0).|

### NutritionService

|Método                         |Descripción                                                                                                                |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------|
|`getNutritionTargets(userId)`  |Calcula TDEE con Mifflin-St Jeor. Distribuye macros (proteína 1.8-2.4g/kg, grasas 0.8-1.0g/kg). Cachea por user_id + fecha.|
|`searchFood(query, userId)`    |Busca en USDA API (con retry). Si USDA falla → base local curada. Fusiona resultados con fuzzy search.                     |
|`logFood(userId, dto)`         |Persiste en food_diary con macros desnormalizados (intencional — FD-DB-04).                                                |
|`getMacroSummary(userId, date)`|Suma macros del día desde food_diary. Calcula % de cumplimiento.                                                           |
|`evaluateAutoAdjust(userId)`   |Compara peso de últimas 2 semanas + adherencia nutricional >80%. Ajusta calorías si sin cambio.                            |

### HydrationService

|Método                         |Descripción                                                                                                                                   |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
|`getTodayTarget(userId)`       |Calcula target: peso(kg) × 35ml. Ajusta por pasos del día (desde health_data). Cachea en Redis key: `hydration:target:{userId}:{date}` TTL 6h.|
|`logWater(userId, dto)`        |Persiste en water_logs. Invalida caché de daily_summary del día.                                                                              |
|`getHistory(userId, from, to)` |Historial desde water_logs.                                                                                                                   |
|`invalidateTargetCache(userId)`|Llamado por HealthSyncService cuando cambia el peso o se registra entrenamiento.                                                              |

### AIService

|Método                               |Descripción                                                                               |
|-------------------------------------|------------------------------------------------------------------------------------------|
|`createConversation(userId, dto)`    |Crea registro en ai_conversations. Genera mensaje de bienvenida con contexto del día.     |
|`sendMessage(userId, convId, dto)`   |Orquesta: ContextBuilder → AnthropicClient → ActionExecutor → persiste mensaje encriptado.|
|`streamResponse(userId, convId, dto)`|Retorna `Observable<MessageEvent>` para SSE. Emite tokens en tiempo real.                 |
|`buildContext(userId)`               |Llama a ContextBuilderService. Respeta límites FD-ARCH-03: 800 tokens de contexto.        |
|`executeActions(userId, toolCalls)`  |Delega cada tool_call al ActionExecutorService. Ejecuta en paralelo con Promise.all().    |

### HealthSyncService

|Método                                   |Descripción                                                                               |
|-----------------------------------------|------------------------------------------------------------------------------------------|
|`processSync(userId, dto)`               |Punto de entrada único. Valida plataforma (healthkit/health_connect). Delega a processors.|
|`processSteps(userId, data)`             |Persiste o actualiza steps en health_data. Invalida caché de hydration target.            |
|`processWeight(userId, data)`            |Si el peso difiere >0.1kg del último registro → crea body_measurement.                    |
|`processSleep(userId, data)`             |Persiste sleep data. Emite evento `SLEEP_DATA_UPDATED`.                                   |
|`exportToHealth(userId, platform, types)`|Construye payload de exportación (workouts, peso) en formato HealthKit/Health Connect.    |

-----

## 5. CASOS DE USO

Los casos de uso encapsulan **una sola operación de negocio**. Son clases con un único método `execute()`. Dependen de repositorios (inyectados) y servicios de infraestructura, nunca de controladores ni de otros casos de uso directamente.

### Mapa de Casos de Uso por Dominio

#### Auth — 7 casos de uso

```
RegisterUseCase          → Valida DTO → VerificaEmailÚnico → HashPassword → CreaSuapabaseUser → PersistUser → GeneraTokens
LoginUseCase             → BuscaUser → VerificaPassword → ChecaPremiumStatus → GeneraTokens → RegistraDevice
RefreshTokenUseCase      → ValidaRefreshToken → ChecaBlacklist → RotaToken → EmitenNuevoPar
LogoutUseCase            → HashToken → AgregaBlacklist Redis → MarkAsUsed DB
ForgotPasswordUseCase    → BuscaEmail → GeneraResetToken (UUID + TTL) → EncolaEmail → SiempResponde200
ResetPasswordUseCase     → ValidaToken → HashNuevaPassword → InvalidaTodosRefreshTokens
OAuthLoginUseCase        → VerificaIdToken(Google|Apple) → UpsertUser → GeneraTokens → is_new_user?
```

#### Training — 9 casos de uso

```
GetActiveProgramUseCase     → BuscaPrograma → [Cache Hit Redis?] → RetornaPrograma+Días+Ejercicios
GetTodayWorkoutUseCase      → DeterminaÍndiceDelCiclo → FiltraEjerciciosDelDía → AgregarRecords
StartSessionUseCase         → ValidaSinSesiónActiva → CreaWorkoutSession(status:in_progress)
LogSetUseCase               → PersistWorkoutLog → ComparaConRecord → [NuevoRecord?→EmiteEvento]
CompleteSessionUseCase      → CierraSesión → EvaluaProgression → [Progresa?→ActualizaPrograma]
CancelSessionUseCase        → CierraSesión(status:cancelled) → NoEvalúaProgresión
GetSessionHistoryUseCase    → PaginaDesdeDB → MapeaAResponseDTO
GetPersonalRecordsUseCase   → AgregarMaxPorEjercicio → ComparaConObjetivo
GetProgressChartUseCase     → SerieTemporal de volumenpor ejercicio → Cachea 15min
```

#### AI — 5 casos de uso

```
ListConversationsUseCase    → PaginaConversaciones → Preview del último mensaje
CreateConversationUseCase   → CreaConversación → ContextBuilder para bienvenida → GeneraMensajeBienvenida
SendMessageUseCase          → ValidaRateLimit → ContextBuilder → [Cache?] → AnthropicCall → ActionExecutor → PersisteMensajes
StreamResponseUseCase       → ValidaRateLimit → ContextBuilder → AnthropicStream → Observable<MessageEvent>
GetConversationHistoryUseCase → PaginaMensajes → Desencripta content → RetornaHistorial
```

#### Health Sync — 5 casos de uso

```
ProcessHealthSyncUseCase    → ValidaPayload → [Steps,Weight,Sleep,Calories] en paralelo → ReturnaAccionesTomadas
GetHealthDataUseCase        → Filtra por tipo y rango → PaginadesdeDB
GetPermissionsStatusUseCase → Lee configuración de permisos del usuario
UpdatePermissionsUseCase    → Actualiza config → SiHabilitaSync→EncolarSync Inicial
ExportToHealthUseCase       → [RequierePremium] → BuildPayload → RetornaFormatoPlataforma
```

#### Flows Cross-Domain (ejecutados por el Event Bus)

```
OnSessionCompleted          → (evento SESSION_COMPLETED)
                              → EvaluaProgresión
                              → [Progresión?] → NotificaLogro
                              → [Estancamiento?] → MarcaAlerta

OnBodyWeightUpdated         → (evento BODY_WEIGHT_UPDATED)
                              → InvalidaCachéHydrationTarget
                              → [>0.5kg diferencia?] → RecalculaMacroTargets

OnSleepDataUpdated          → (evento SLEEP_DATA_UPDATED)
                              → [<6h sueño?] → SugierePrecaución (v1.1)
```

-----

## 6. REPOSITORIOS

Los repositorios son la **única capa que toca Prisma**. Nunca devuelven objetos Prisma crudos hacia afuera — siempre mapean a interfaces de dominio.

### Interfaz Base de Repositorio

```
IRepository<T, CreateDTO, UpdateDTO>
  findById(id: string): Promise<T | null>
  findAll(filters): Promise<PaginatedResult<T>>
  create(dto: CreateDTO): Promise<T>
  update(id: string, dto: UpdateDTO): Promise<T>
  delete(id: string): Promise<void>
  softDelete(id: string): Promise<void>   // Para entidades con deleted_at (users)
```

### Repositorios por Módulo

|Repositorio                   |Métodos Clave                                                                                      |Observaciones                                                       |
|------------------------------|---------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
|**AuthRepository**            |`findByEmail`, `createUser`, `saveRefreshToken`, `invalidateRefreshToken`, `findActiveRefreshToken`|Interactúa con Supabase Auth SDK para operaciones OAuth             |
|**UsersRepository**           |`findById`, `updateProfile`, `softDelete`, `getUserProfileFull`                                    |`getUserProfileFull` llama a función PostgreSQL `get_user_profile()`|
|**BodyMeasurementsRepository**|`create`, `findLatest`, `findHistory`, `findByDateRange`                                           |Particionado por fecha                                              |
|**GoalsRepository**           |`findActive`, `create`, `complete`, `findHistory`                                                  |`findActive` filtra `status = 'active'`                             |
|**AssessmentRepository**      |`create`, `findLatestByUser`, `update`                                                             |                                                                    |
|**TrainingProgramsRepository**|`findActiveByUser`, `update`, `setStagnationAlert`                                                 |Cachea resultado 5 min en Redis                                     |
|**WorkoutSessionsRepository** |`create`, `findActive`, `complete`, `cancel`, `findHistory`, `findByDateRange`                     |Particionado por `started_at`                                       |
|**WorkoutLogsRepository**     |`create`, `findBySession`, `findPersonalRecord`, `findRecentByExercise`                            |Índice crítico: `(user_id, exercise_id, reps DESC)`                 |
|**ExercisesRepository**       |`findAll`, `findById`, `findByCategory`, `search`                                                  |Datos casi estáticos → cachea en Redis 24h                          |
|**FoodDiaryRepository**       |`create`, `findByUserAndDate`, `findByDateRange`, `update`, `delete`, `sumMacrosByDate`            |Particionado por `consumed_at`                                      |
|**FoodsRepository**           |`search`, `findById`, `findByExternalId`, `findLocalBase`                                          |`search` usa `tsvector` para full-text search en PostgreSQL         |
|**WaterLogsRepository**       |`create`, `findByUserAndDate`, `delete`, `sumByDate`                                               |Particionado por `created_at`                                       |
|**HealthDataRepository**      |`upsert`, `findByUserAndDate`, `findLatestWeight`, `findByDateRange`                               |`upsert` por `(user_id, date, source_platform)`                     |
|**ConversationsRepository**   |`create`, `findByUser`, `findById`, `updateLastMessage`                                            |                                                                    |
|**AIMessagesRepository**      |`create(encripta)`, `findByConversation(desencripta)`, `countTodayByUser`                          |`create` llama a `EncryptionService.encrypt()` antes de persistir   |
|**SubscriptionsRepository**   |`upsert`, `findByUser`, `findByRevenueCatId`, `updateStatus`                                       |`upsert` por `revenuecat_user_id`                                   |
|**NotificationLogsRepository**|`create`, `findByUser`, `findByType`                                                               |                                                                    |

-----

## 7. DTOs

Todos los DTOs usan **Zod** como validador. El `ZodValidationPipe` global transforma y valida en el punto de entrada del controlador. Los DTOs son objetos planos TypeScript inferidos desde el schema Zod.

### Convenciones

```
[NombreOperación]RequestDto  → Valida el body/query del request entrante
[NombreEntidad]ResponseDto   → Forma el objeto que se devuelve al cliente
```

### DTOs Críticos por Módulo

#### Auth DTOs

```
RegisterRequestDto
  email: z.string().email()
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/)
  first_name: z.string().min(2).max(100)
  last_name: z.string().max(100).optional()
  accept_terms: z.literal(true)
  accept_privacy: z.literal(true)

LoginRequestDto
  email: z.string().email()
  password: z.string()
  device_info: DeviceInfoDto.optional()

RefreshTokenRequestDto
  refresh_token: z.string().min(1)

ResetPasswordRequestDto
  reset_token: z.string().uuid()
  new_password: z.string().min(8)...
  confirm_password: z.string()
  .refine(data => data.new_password === data.confirm_password)

OAuthLoginRequestDto
  id_token: z.string()
  provider: z.enum(['google', 'apple'])
  device_info: DeviceInfoDto

AuthResponseDto
  user: UserSummaryDto
  tokens: TokensDto           // { access_token, refresh_token, token_type, expires_in }
  is_new_user?: boolean
```

#### Assessment DTOs

```
InitialAssessmentRequestDto
  birth_date: z.string().date()
  sex: z.enum(['male', 'female'])
  height_cm: z.number().int().min(100).max(250)
  weight_kg: z.number().min(30).max(300)
  target_weight_kg: z.number().min(30).max(300)
  training_frequency: z.number().int().min(1).max(7)
  unit_preference: z.enum(['metric', 'imperial']).default('metric')
  movement_tests: MovementTestsDto   // { pull_ups_max, push_ups_max, dips_max? }
  goal_type: z.enum(['muscle_gain', 'fat_loss', 'recomposition', 'strength'])
```

#### Training DTOs

```
LogSetRequestDto
  exercise_id: z.string().uuid()
  set_number: z.number().int().min(1).max(10)
  reps: z.number().int().min(0).max(100)
  rpe: z.number().min(1).max(10)
  notes: z.string().max(500).optional()
  assisted: z.boolean().default(false)
  band_assistance: z.string().optional()   // 'light' | 'medium' | 'heavy'
```

#### Nutrition DTOs

```
LogFoodRequestDto
  food_id: z.string().uuid().optional()          // Si se seleccionó de búsqueda
  custom_name: z.string().max(200).optional()    // Si es entrada manual
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'])
  quantity_g: z.number().min(1).max(5000)
  consumed_at: z.string().datetime().optional()  // Default: now()
  // macros se calculan en el servidor desde food_id o se reciben si custom_name
  calories: z.number().optional()
  protein_g: z.number().optional()
  carbs_g: z.number().optional()
  fat_g: z.number().optional()
```

#### Health Sync DTOs

```
HealthSyncRequestDto
  platform: z.enum(['healthkit', 'health_connect'])
  sync_date: z.string().date()
  data: z.object({
    steps: StepsDataDto.optional()
    active_calories: CaloriesDataDto.optional()
    resting_heart_rate: HeartRateDataDto.optional()
    sleep: SleepDataDto.optional()
    weight: WeightDataDto.optional()
  })

SleepDataDto
  in_bed_at: z.string().datetime()
  asleep_at: z.string().datetime()
  wake_at: z.string().datetime()
  duration_hours: z.number().min(0).max(24)
  deep_sleep_minutes: z.number().optional()
  rem_sleep_minutes: z.number().optional()
  quality_score: z.number().min(0).max(100).optional()
```

#### AI DTOs

```
SendMessageRequestDto
  content: z.string().min(1).max(2000)

CreateConversationRequestDto
  initial_context: z.enum(['training', 'nutrition', 'general']).default('general')

AIMessageResponseDto
  id: string
  role: 'user' | 'assistant'
  content: string              // Desencriptado para el cliente
  tool_calls: ToolCall[]       // Acciones ejecutadas (para mostrar en UI)
  latency_ms?: number
  created_at: string
```

#### RevenueCat Webhook DTO

```
RevenueCatWebhookDto
  api_version: z.string()
  event: z.object({
    type: z.enum(['INITIAL_PURCHASE', 'RENEWAL', 'CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'])
    app_user_id: z.string()            // user_id de CALI-NUTRI AI
    product_id: z.string()             // 'premium_monthly' | 'premium_annual'
    period_type: z.enum(['TRIAL', 'NORMAL'])
    purchased_at_ms: z.number()
    expiration_at_ms: z.number()
  })
```

-----

## 8. GUARDS

### JwtAuthGuard — Guard Global

- **Aplicación:** Global en `AppModule`. Aplica a **todos** los endpoints excepto los marcados con `@Public()`.
- **Estrategia:** Passport JWT con RS256. Verifica firma con la clave pública.
- **Payload extraído:** `{ sub: userId, email, tier, onboarding_complete, iat, exp }`.
- **Adjunta al request:** `req.user: AuthUser`.
- **Falla:** Lanza `UnauthorizedException` con código `INVALID_TOKEN` o `TOKEN_EXPIRED`.
- **No verifica** si el token está en blacklist (eso lo hace `LogoutUseCase` en Redis).

```
Flujo de validación:
  Header: Authorization: Bearer <token>
    ↓
  JwtStrategy.validate(payload)
    ↓
  PrismaService.users.findUnique({ where: { id: payload.sub, deleted_at: null } })
    ↓ usuario no encontrado → UnauthorizedException
  Verifica onboarding_complete para rutas que lo requieran
    ↓
  Retorna AuthUser → se adjunta a req.user
```

### RefreshTokenGuard

- **Aplicación:** Exclusivo en `POST /auth/refresh`.
- **Estrategia:** Passport JWT con secreto separado para refresh tokens.
- **Valida:** TTL del token + no esté en blacklist de Redis (key: `auth:blacklist:{tokenHash}`).

### PremiumGuard

- **Aplicación:** Endpoints marcados con `@RequiresPremium()` o en `ExportToHealthUseCase`.
- **Lógica:** Verifica `req.user.tier === 'premium'`.
- **Falla:** `ForbiddenException` con código `PREMIUM_REQUIRED` + `upgrade_url: 'cali://upgrade'`.
- **Endpoints afectados (FD-SECCIÓN-10):**
  - `POST /health/export` (integración Health — solo premium)
  - `GET /training/sessions?range=all` (historial ilimitado)
  - `GET /analytics/adherence?range=90d` (analítica extendida)

### OwnershipGuard

- **Aplicación:** Endpoints que reciben un `resource_id` que debe pertenecer al usuario autenticado.
- **Lógica:** Verifica en DB que `resource.user_id === req.user.id`.
- **Implementación:** Genérico, parametrizable con el repositorio a consultar.
- **Falla:** `NotFoundException` (no revela existencia del recurso a otros usuarios).

### OnboardingGuard

- **Aplicación:** Endpoints de Training, Nutrition, Hydration, AI.
- **Lógica:** Verifica `req.user.onboarding_complete === true`.
- **Falla:** `ForbiddenException` con código `ONBOARDING_REQUIRED` + redirect a onboarding step actual.

-----

## 9. INTERCEPTORS

### TransformInterceptor (Global)

Envuelve **todas** las respuestas exitosas en el contrato canónico de la API:

```
Input (del controller):  { user: {...}, tokens: {...} }

Output (al cliente):
{
  "success": true,
  "data": { "user": {...}, "tokens": {...} },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "01HW...",      // ULID del RequestContextMiddleware
    "version": "1.0"
  }
}
```

Las excepciones HTTP **no pasan** por este interceptor — las maneja `HttpExceptionFilter`.

### LoggingInterceptor (Global)

Loguea cada request con estructura JSON para ingesta en CloudWatch:

```json
{
  "level": "info",
  "request_id": "01HW...",
  "method": "POST",
  "path": "/v1/training/sessions/abc/logs",
  "user_id": "3f25...",
  "status": 201,
  "duration_ms": 47,
  "timestamp": "2026-06-13T10:30:00.123Z"
}
```

Para rutas de IA incluye adicionalmente: `tokens_used`, `latency_claude_ms`, `tool_calls_count`.

### CacheInterceptor (Selectivo)

Aplica a endpoints GET con datos que cambian poco:

|Endpoint                       |TTL Redis|Clave                                    |
|-------------------------------|---------|-----------------------------------------|
|`GET /training/exercises`      |24h      |`cache:exercises:all`                    |
|`GET /training/programs/active`|5 min    |`cache:program:{userId}`                 |
|`GET /nutrition/targets`       |1h       |`cache:nutrition:targets:{userId}:{date}`|
|`GET /training/sessions/:id`   |10 min   |`cache:session:{sessionId}`              |

Invalida el caché correspondiente después de mutaciones relacionadas (mediante eventos en el bus interno).

### TimeoutInterceptor (Global con excepciones)

- **Default:** 10 segundos para todos los endpoints.
- **Endpoints de IA:** 30 segundos (`@SetMetadata('timeout', 30000)`).
- **Endpoints de sync de salud:** 15 segundos.
- **Al expirar:** `RequestTimeoutException` con código `REQUEST_TIMEOUT`.

### AuditInterceptor (Selectivo — datos sensibles)

Para operaciones sobre datos sensibles (HIPAA-adjacent), registra en tabla de auditoría:

- Acceso a `body_measurements`
- Acceso a `ai_messages`
- Actualización de `users`
- Eliminación de cuenta

```
AuditLog {
  user_id, action, resource_type, resource_id,
  ip_address (hashed), user_agent, timestamp
}
```

-----

## 10. MIDDLEWARES

### RequestContextMiddleware (Global — primer en la cadena)

Genera un `request_id` ULID único por request y lo adjunta a:

- `req.requestId` (para interceptors y servicios)
- Header de respuesta `X-Request-ID`
- `AsyncLocalStorage` (para acceso desde cualquier servicio sin prop drilling)

**Justificación:** El `request_id` es crítico para correlacionar logs en CloudWatch y trazar el origen de errores.

### CorrelationIdMiddleware

Propaga el header `X-Correlation-ID` entre llamadas internas. Si el request entrante incluye el header (desde API Gateway), lo reusa. Si no, genera uno nuevo. Útil para trazar flujos multi-servicio en staging.

### RateLimitMiddleware (por IP — primera línea de defensa)

Se ejecuta **antes** de la autenticación. Protege contra ataques de fuerza bruta y DDoS a nivel de IP:

```
Límites por IP (Redis counter, TTL 1 min):
  - Rutas /auth/*: 20 requests/min
  - Resto de rutas: 200 requests/min
  
Al superar: 429 Too Many Requests
  → Header: Retry-After: {segundos}
  → Log de IP para análisis posterior
```

### SecurityMiddleware

Aplica headers de seguridad via `helmet`:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'none'
Referrer-Policy: no-referrer
```

-----

## 11. INTEGRACIÓN SUPABASE AUTH

### Decisión de Arquitectura

Supabase Auth se usa como **proveedor de OAuth y gestor de usuarios** en el MVP, pero el backend NestJS mantiene sus **propios JWT RS256** para las sesiones de API. Esta separación permite migrar o reemplazar Supabase en el futuro sin afectar a los clientes.

### Flujo de Registro con Supabase

```
Cliente → POST /auth/register
  ↓
AuthController → RegisterUseCase
  ↓
1. Valida DTO (email único, password fuerte)
  ↓
2. Hash password bcrypt(cost=12)
  ↓
3. PrismaService: INSERT users (datos propios)
  ↓
4. SupabaseService.auth.admin.createUser({
     email, password, user_metadata: { cali_user_id }
   })
  ↓
5. Guarda supabase_id en users.google_id (si OAuth) o no lo usa (si email/password)
  ↓
6. GeneraTokensJWT (RS256 propio) → Retorna al cliente
```

### Flujo de OAuth (Google / Apple)

```
Cliente recibe id_token del proveedor
  ↓
POST /auth/oauth/:provider { id_token, device_info }
  ↓
OAuthLoginUseCase
  ↓
SupabaseService.auth.signInWithIdToken({
  provider: 'google' | 'apple',
  token: id_token
})
  ↓
Supabase verifica el token con el proveedor
  ↓
[Usuario nuevo?]
  → YES: INSERT users con datos del perfil OAuth
  → NO: Fetch usuario existente por google_id / email
  ↓
GeneraTokensJWT propio (RS256)
  ↓
Retorna { tokens, user, is_new_user }
```

### SupabaseService

Wrapper inyectable que encapsula el cliente de Supabase:

```
SupabaseService
  client: SupabaseClient (service_role_key — acceso completo)

Métodos expuestos:
  verifyOAuthToken(provider, idToken): Promise<SupabaseUser>
  createAuthUser(email, password, metadata): Promise<SupabaseUser>
  deleteAuthUser(supabaseUserId): Promise<void>  // Para account deletion
  sendPasswordResetEmail(email): Promise<void>   // Alternativa a implementación propia
```

**Nota de seguridad:** El `service_role_key` **nunca** llega al cliente. Solo se usa en el backend. El cliente usa el `anon_key` únicamente para el Storage (fotos de progreso con pre-signed URLs).

-----

## 12. INTEGRACIÓN CLAUDE API

### Arquitectura del AIModule

```
POST /ai/conversations/:id/messages
  ↓
SendMessageUseCase
  │
  ├── 1. RateLimitCheck (Redis counter)
  │       key: rate:ai:{userId}:{today}
  │       Límite: 10 (free) | 100 (premium)
  │
  ├── 2. ContextBuilderService.build(userId)
  │       │
  │       ├── UserProfileContext (perfil + objetivo + peso)      ≤ 200 tokens
  │       ├── TrainingContext   (últimas 10 sesiones)            ≤ 300 tokens
  │       ├── NutritionContext  (últimos 14 días)                ≤ 200 tokens
  │       ├── HydrationContext  (estado hoy)                     ≤ 50 tokens
  │       └── HistoricalSummary (resumen comprimido, cache 24h)  ≤ 200 tokens
  │           Total contexto: ≤ 800 tokens
  │
  ├── 3. ConversationHistory (últimos 20 mensajes)               ≤ 600 tokens
  │
  ├── 4. AnthropicClient.sendMessage({
  │       model: 'claude-sonnet-4-6',
  │       system: SYSTEM_PROMPT (400 tokens, cacheado con Anthropic Prompt Caching),
  │       messages: [...history, { role: 'user', content: userMessage + context }],
  │       tools: TOOL_DEFINITIONS,
  │       max_tokens: 1000
  │     })
  │
  ├── 5. [¿Tool calls en la respuesta?]
  │       → ActionExecutorService.execute(userId, toolCalls)
  │           Ejecuta en paralelo: Promise.all([
  │             log_workout_performance → TrainingService
  │             log_food_intake         → NutritionService
  │             log_water_intake        → HydrationService
  │             update_recovery_data    → HealthSyncService
  │             get_daily_summary       → DashboardService
  │           ])
  │
  └── 6. PersistMensajes (user + assistant)
          EncryptionService.encrypt(content) → ai_messages
          Registra: tokens_used, latency_ms, tool_calls (JSONB)
```

### Tool Definitions (Contrato con Claude)

```
HERRAMIENTAS DISPONIBLES PARA CALI:

log_workout_performance
  Parámetros: exercise_id, reps, sets, rpe, notes?
  Acción: TrainingService.logSet()

log_food_intake
  Parámetros: description (texto libre), meal_type, quantity_g?
  Acción: NutritionService.logFoodFromDescription() → busca en USDA → logFood()

log_water_intake
  Parámetros: amount_ml
  Acción: HydrationService.logWater()

update_recovery_data
  Parámetros: sleep_hours?, fatigue_level? (1-10), muscle_soreness? (string)
  Acción: HealthDataRepository.upsert()

get_daily_summary
  Parámetros: (ninguno)
  Acción: DashboardService.getTodaySummary()
  Retorna: JSON con macros, agua, entrenamientos del día

trigger_program_adjustment
  Parámetros: reason, action (reduce_volume|increase_volume|deload|reassess)
  Acción: TrainingService.flagForAdjustment() → marca stagnation_alert
```

### Prompt Caching (Reducción de costos ~90%)

El system prompt de CALI es estático o cambia muy raramente. Se usa **Anthropic Prompt Caching**:

```
PromptCacheService
  getCachedSystemPrompt(): string
    → Genera system prompt base (instrucciones de CALI, reglas, formato)
    → Marca con cache_control: { type: 'ephemeral' } para Anthropic
    → TTL en caché de Anthropic: 5 minutos (se renueva automáticamente si se usa)
    → Reducción de costo: ~90% en input tokens del system prompt
```

### Manejo de Fallos de Claude API

```
AnthropicClient implementa:
  - Retry con exponential backoff: 3 intentos (1s, 2s, 4s)
  - Circuit breaker: si 5 fallos en 1 min → abre circuito 30s
  - Fallback response: mensaje de error amigable al usuario
    "CALI no está disponible en este momento. Intenta en unos minutos."
  - Log de error con status code de Anthropic → CloudWatch alert
```

-----

## 13. INTEGRACIÓN APPLE HEALTH Y HEALTH CONNECT

### Flujo de Sincronización Backend

```
POST /health/sync (desde cliente móvil, cada 15 min en foreground)
  ↓
HealthSyncController → ProcessHealthSyncUseCase
  ↓
Valida HealthSyncRequestDto (Zod)
  ↓
[Solo usuarios Premium — PremiumGuard]
  ↓
HealthSyncService.processSync(userId, platform, data)
  │
  ├── StepsProcessor.process(userId, data.steps)
  │       → UPSERT health_data(user_id, date, steps, source_platform)
  │       → Invalida Redis: hydration:target:{userId}:{date}
  │       → Invalida Redis: cache:dashboard:{userId}:{date}
  │
  ├── WeightProcessor.process(userId, data.weight)
  │       → BuscaÚltimoRegistro en body_measurements
  │       → [Diferencia > 0.1kg?] → INSERT body_measurements
  │       → Emite evento BODY_WEIGHT_UPDATED al bus interno
  │
  ├── SleepProcessor.process(userId, data.sleep)
  │       → UPSERT health_data con campos de sueño
  │       → Emite evento SLEEP_DATA_UPDATED
  │       → [v1.0: solo persiste, sin ajuste automático de entrenamiento]
  │
  └── CaloriesProcessor.process(userId, data.active_calories)
          → UPSERT health_data.active_calories_kcal
  ↓
Construye response: { synced: {...}, actions_taken: [...], next_sync_recommended_at }
```

### Estrategia de Conflictos de Datos

|Tipo de dato       |Fuente con prioridad                                  |
|-------------------|------------------------------------------------------|
|Pasos              |HealthKit/Health Connect (siempre)                    |
|Calorías activas   |HealthKit/Health Connect (siempre)                    |
|Peso               |Manual (CALI-NUTRI AI) tiene prioridad sobre HealthKit|
|Sueño              |HealthKit/Health Connect (siempre)                    |
|Frecuencia cardíaca|HealthKit/Health Connect (en espera para v1.1)        |

### Background Sync (iOS)

El backend no tiene lógica específica para background sync de iOS. La estrategia es:

- Cliente iOS usa `BackgroundTasks` framework (cada 6h).
- Al despertar, hace exactamente el mismo `POST /health/sync`.
- Backend procesa igual, retorna delta de acciones tomadas.
- El cliente no necesita saber si fue foreground o background.

### Exportación hacia Health (POST /health/export)

```
ExportToHealthUseCase [RequiresPremium]
  ↓
Recibe: platform, data_types (['workouts', 'weight']), from_date
  ↓
[workouts]:
  workout_sessions JOIN workout_logs → formato HealthKit HKWorkout / Health Connect ExerciseSession
  Incluye: start_time, end_time, active_calories (estimado)
  ↓
[weight]:
  body_measurements → formato HKQuantitySample / WeightRecord
  ↓
Retorna payload JSON que el cliente transforma al SDK nativo
```

-----

## 14. ESTRATEGIA OFFLINE SYNC

### Principio: Client-First, Sync-On-Reconnect

El cliente (React Native + MMKV) es la fuente de verdad mientras está offline. El backend tiene lógica de **aceptación idempotente** para procesar la cola cuando el cliente reconecta.

### Operaciones Soportadas Offline (desde FD-DB-09)

```
OfflineQueue en cliente (MMKV):
  - POST /training/sessions
  - POST /training/sessions/:id/logs
  - PATCH /training/sessions/:id/complete
  - POST /nutrition/food-diary
  - PUT /nutrition/food-diary/:id
  - DELETE /nutrition/food-diary/:id
  - POST /hydration/logs
  - DELETE /hydration/logs/:id
```

### Endpoint de Sincronización

```
POST /sync/offline-queue (nuevo endpoint dedicado)
  Body: OfflineQueueItem[]
  
  OfflineQueueItem {
    local_id: string       // UUID generado en el cliente
    operation: 'create' | 'update' | 'delete'
    endpoint: string
    payload: object
    created_at: string     // Timestamp cuando se creó offline
    client_version: string // Para compatibilidad futura
  }
```

### Procesamiento en el Backend

```
OfflineSyncUseCase.execute(userId, items: OfflineQueueItem[])
  ↓
Ordena items por created_at ASC (procesa en orden cronológico)
  ↓
Para cada item:
  ├── Valida DTO del endpoint correspondiente
  ├── Verifica idempotencia (¿ya existe un registro con local_id?)
  │     SI → retorna el registro existente (no duplica)
  │     NO → ejecuta la operación
  ├── [Error en ítem individual?]
  │     → No detiene la cola
  │     → Agrega al array de errores en la respuesta
  └── Registra resultado
  ↓
Retorna:
{
  "synced_count": 12,
  "failed_count": 0,
  "results": [
    { "local_id": "...", "server_id": "...", "status": "created" },
    ...
  ],
  "errors": []
}
```

### Idempotencia: Tabla sync_idempotency

Para garantizar que operaciones offline no se dupliquen:

```sql
CREATE TABLE sync_idempotency (
  local_id   UUID NOT NULL,
  user_id    UUID NOT NULL REFERENCES users(id),
  server_id  UUID,          -- ID generado en el servidor tras el insert
  status     VARCHAR(20),   -- 'success' | 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, local_id)
);

-- TTL: los registros se eliminan después de 30 días (job programado)
```

### Estrategia de Conflictos

```
Regla general: "Last Write Wins" con timestamp del cliente.

Casos especiales:
  - Si el mismo ejercicio fue logueado online y el item offline tiene
    timestamp anterior → el ítem online tiene prioridad.
  - Food diary: siempre se acepta (el usuario decide si eliminar duplicados).
  - Water logs: siempre se acepta (acumulativo).
```

-----

## 15. REDIS — ESTRATEGIA COMPLETA

### Namespace de Keys (Todas las claves documentadas)

```
AUTENTICACIÓN
  auth:blacklist:{tokenHash}           TTL: igual al tiempo restante del refresh token
  auth:reset:{token}                   TTL: 900s (15 min)

RATE LIMITING
  rate:ai:{userId}:{YYYY-MM-DD}        TTL: 86400s (24h)   — mensajes IA por día
  rate:ip:{ip}:{endpoint_group}        TTL: 60s            — requests por IP por minuto
  rate:api:{userId}                    TTL: 60s            — requests generales por usuario

CACHÉ DE DATOS
  cache:program:{userId}               TTL: 300s  (5 min)
  cache:exercises:all                  TTL: 86400s (24h)
  cache:nutrition:targets:{userId}:{date}  TTL: 3600s (1h)
  cache:session:{sessionId}            TTL: 600s (10 min)
  cache:dashboard:{userId}:{date}      TTL: 60s
  cache:ai:system-prompt               TTL: 3600s (1h) — copia local del prompt cacheado

HIDRATACIÓN (sin tabla water_targets — FD-DB-02)
  hydration:target:{userId}:{date}     TTL: 21600s (6h)
  — Invalida cuando: nuevo entrenamiento del día, cambio de peso

RESUMEN HISTÓRICO IA (context builder)
  ai:history-summary:{userId}          TTL: 86400s (24h)
  — Resumen comprimido de progreso histórico para el contexto de CALI

SESIÓN ACTIVA
  training:active-session:{userId}     TTL: 7200s (2h)
  — Previene múltiples sesiones activas simultáneas

SINCRONIZACIÓN OFFLINE
  sync:lock:{userId}                   TTL: 30s
  — Lock distribuido para evitar sincronizaciones concurrentes del mismo usuario
```

### Patrones de Acceso

**Read-Through (más común):**

```
GET /training/programs/active
  ↓
RedisService.get('cache:program:{userId}')
  HIT  → Retorna inmediatamente (< 1ms)
  MISS → PrismaService query → Redis.set(..., TTL) → Retorna
```

**Cache Invalidation (por eventos):**

```
Event: SESSION_COMPLETED
  → EventBus listener en TrainingModule
  → Redis.del('cache:program:{userId}')
  → Redis.del('cache:dashboard:{userId}:{date}')
```

**Counter (Rate Limiting):**

```
Redis.multi()
  .incr('rate:ai:{userId}:{today}')
  .expire('rate:ai:{userId}:{today}', 86400)
  .exec()
```

### RedisService — Métodos Clave

```typescript
interface RedisServiceMethods {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  del(key: string | string[]): Promise<void>
  incr(key: string): Promise<number>
  incrWithTTL(key: string, ttlSeconds: number): Promise<number>
  exists(key: string): Promise<boolean>
  expire(key: string, ttlSeconds: number): Promise<void>
  // Para locks distribuidos
  setnx(key: string, value: string, ttlSeconds: number): Promise<boolean>
  // Para listas (offline queue processing)
  lpush(key: string, ...values: string[]): Promise<number>
  rpop(key: string): Promise<string | null>
}
```

-----

## 16. SSE PARA IA

### Decisión de Arquitectura (FD-ARCH-02)

SSE reemplaza WebSockets para el streaming de respuestas de CALI. Justificación:

- Unidireccional (servidor → cliente): suficiente para el chat de IA donde el cliente envía POST y recibe stream.
- Compatible con HTTP/2 sin configuración adicional.
- No requiere sticky sessions en ECS.
- Soportado en React Native con polyfill `react-native-event-source`.

### Flujo SSE Completo

```
1. Cliente envía mensaje:
   POST /ai/conversations/{id}/messages
   Body: { "content": "Hice 8 dominadas" }
   → Respuesta inmediata: 202 Accepted + { "stream_url": "/ai/conversations/{id}/stream?token=..." }

2. Cliente abre stream SSE:
   GET /ai/conversations/{id}/stream?message_id={msgId}
   Header: Authorization: Bearer {token}
   → Content-Type: text/event-stream

3. Backend emite eventos:
   data: {"type": "stream_start", "message_id": "msg_xxx"}

   data: {"type": "token", "content": "¡Ex"}
   data: {"type": "token", "content": "celente"}
   data: {"type": "token", "content": "! 8 do"}
   ... (streaming token por token)

   data: {"type": "tool_call", "action": "log_workout_performance", "status": "executing"}
   data: {"type": "tool_result", "action": "log_workout_performance", "status": "success",
          "detail": "Serie registrada: 8 dominadas, RPE 8"}

   data: {"type": "stream_end", "tokens_used": 147, "latency_ms": 2340}

4. Cliente cierra la conexión SSE al recibir stream_end.
```

### Implementación en NestJS

```
AIController
  @Get(':id/stream')
  @Sse()
  @UseGuards(JwtAuthGuard, OnboardingGuard)
  streamMessage(
    @Param('id') conversationId: string,
    @Query('message_id') messageId: string,
    @CurrentUser() user: AuthUser,
  ): Observable<MessageEvent>
    → Delega a StreamResponseUseCase.execute()
    → Retorna Observable<MessageEvent> usando fromEvent() + Anthropic streaming SDK

StreamResponseUseCase
  Crea Observable que:
  1. Valida rate limit (Redis)
  2. Recupera mensaje pendiente por message_id
  3. Construye contexto (ContextBuilderService)
  4. Llama a anthropic.messages.stream({ ... })
  5. Por cada chunk de Anthropic: emite MessageEvent al Observable
  6. Si hay tool_use block: ejecuta ActionExecutor, emite eventos de progreso
  7. Al final: persiste el mensaje completo, emite stream_end
```

### Timeout de SSE

El `TimeoutInterceptor` establece 30s para el endpoint SSE. Si Anthropic no responde en 30s:

- Emite evento `{"type": "error", "code": "TIMEOUT", "message": "CALI tardó demasiado. Intenta de nuevo."}`
- Cierra el stream limpiamente.
- El mensaje queda en estado `failed` en DB (no se reintenta automáticamente).

-----

## 17. RATE LIMITING

### Arquitectura de Rate Limiting: 3 Capas

```
Capa 1: AWS WAF (nivel de infraestructura)
  → Rate limit por IP: 2000 req/min
  → Bloqueo automático de IPs sospechosas
  → Gestión por AWS, no por NestJS

Capa 2: RateLimitMiddleware (antes de autenticación)
  → Rate limit por IP en rutas /auth/*: 20 req/min
  → Rate limit por IP en resto: 200 req/min
  → Implementación: Redis counter con TTL 60s

Capa 3: Guards y UseCase (con contexto de usuario autenticado)
  → Rate limit por userId para endpoints de IA
  → Rate limit por userId para API general
```

### Rate Limits por Tier de Usuario (FD-ARCH-04)

|Endpoint                             |Free              |Premium          |Admin       |
|-------------------------------------|------------------|-----------------|------------|
|`POST /ai/conversations/:id/messages`|10/día            |100/día          |Ilimitado   |
|`GET /ai/conversations/:id/stream`   |10/día            |100/día          |Ilimitado   |
|API General (todos los endpoints)    |100 req/min       |300 req/min      |1000 req/min|
|`POST /health/sync`                  |N/A (solo premium)|96/día (c/15 min)|—           |
|`POST /auth/register`                |5/hora por IP     |—                |—           |
|`POST /auth/forgot-password`         |3/hora por IP     |—                |—           |

### RateLimitService (usado por guards y use-cases)

```
RateLimitService
  checkAIRateLimit(userId, tier): Promise<RateLimitResult>
    key: rate:ai:{userId}:{YYYY-MM-DD}
    limit: tier === 'premium' ? 100 : 10
    → { allowed: bool, remaining: number, reset_at: ISO8601 }

  checkAPIRateLimit(userId, tier): Promise<RateLimitResult>
    key: rate:api:{userId}
    limit: tier === 'premium' ? 300 : 100 (por minuto)

  incrementCounter(key, ttl): Promise<number>
    → Redis INCR + EXPIRE (en transacción MULTI/EXEC)
```

### Respuesta al Cliente cuando se Excede el Límite

```json
{
  "success": false,
  "error": {
    "code": "DAILY_LIMIT_REACHED",
    "message": "Has alcanzado tu límite diario de mensajes con CALI.",
    "details": {
      "limit": 10,
      "used": 10,
      "reset_at": "2026-06-14T00:00:00Z",
      "upgrade_url": "cali://upgrade"
    }
  },
  "meta": {
    "timestamp": "...",
    "request_id": "..."
  }
}
```

Headers adicionales en todas las respuestas de endpoints con rate limit:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1718323200
```

-----

## 18. LOGGING

### Estrategia: Structured Logging + CloudWatch

**Librería:** `pino` (el logger más performante para Node.js — async, bajo overhead).  
**Formato:** JSON estructurado en producción. Pretty-print en desarrollo.  
**Destino:** stdout → AWS CloudWatch Logs (vía ECS Fargate log driver).

### Niveles de Log y Casos de Uso

```
FATAL  → App no puede arrancar (config inválida, DB no disponible)
ERROR  → Error no manejado, fallo de integración externa (Claude, USDA, S3)
WARN   → Error manejado pero inusual (rate limit alcanzado, retry exitoso)
INFO   → Cada request HTTP (vía LoggingInterceptor), eventos de negocio importantes
DEBUG  → Context builder output, queries Prisma en dev
TRACE  → Tokens SSE individuales (solo dev, nunca en producción)
```

### Estructura del Log de Request (INFO)

```json
{
  "level": "info",
  "time": "2026-06-13T10:30:00.123Z",
  "request_id": "01HWXYZ123456789",
  "correlation_id": "corr-abc-123",
  "method": "POST",
  "path": "/v1/ai/conversations/conv-001/messages",
  "status": 202,
  "duration_ms": 47,
  "user_id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  "user_tier": "premium",
  "ip": "redacted",
  "user_agent": "CaliNutri/1.0.0 iOS/18.2"
}
```

### Estructura del Log de Error

```json
{
  "level": "error",
  "time": "2026-06-13T10:30:05.456Z",
  "request_id": "01HWXYZ123456789",
  "error": {
    "code": "ANTHROPIC_API_ERROR",
    "message": "Anthropic API returned 529 Overloaded",
    "stack": "...",
    "anthropic_status": 529,
    "retry_attempt": 3
  },
  "context": {
    "user_id": "3f25...",
    "conversation_id": "conv-001",
    "tokens_in_prompt": 1840
  }
}
```

### Logs de Eventos de Negocio (INFO)

Además de los request logs, se loguean eventos de negocio clave:

```json
{ "event": "USER_REGISTERED",          "user_id": "...", "tier": "free" }
{ "event": "SESSION_COMPLETED",        "user_id": "...", "session_id": "...", "duration_min": 42 }
{ "event": "PROGRESSION_TRIGGERED",   "user_id": "...", "exercise": "pull-ups", "from": 3, "to": 4 }
{ "event": "STAGNATION_DETECTED",     "user_id": "...", "weeks_without_progress": 3 }
{ "event": "PREMIUM_ACTIVATED",       "user_id": "...", "plan": "premium_annual" }
{ "event": "AI_RATE_LIMIT_REACHED",   "user_id": "...", "tier": "free" }
{ "event": "HEALTH_SYNC_COMPLETED",   "user_id": "...", "platform": "healthkit", "actions_count": 3 }
{ "event": "ACCOUNT_DELETION_QUEUED", "user_id": "...", "hard_delete_at": "2026-07-13" }
{ "event": "CLAUDE_API_COST",         "user_id": "...", "tokens_in": 1840, "tokens_out": 147, "model": "claude-sonnet-4-6" }
```

### CloudWatch Alarms (Métricas críticas)

```
Alarma: CLAUDE_DAILY_COST_EXCEEDED
  Métrica: suma de tokens_out × precio_token por día
  Umbral: > $50/día → alerta Slack + email CTO

Alarma: CLAUDE_ERROR_RATE
  Métrica: count(event=ANTHROPIC_API_ERROR) en 5 min
  Umbral: > 10 errores → alerta PagerDuty

Alarma: API_P95_LATENCY
  Métrica: percentil 95 de duration_ms de todos los requests
  Umbral: > 2000ms → alerta Slack

Alarma: DB_CONNECTION_POOL_EXHAUSTED
  Métrica: errores Prisma de tipo "too many connections"
  Umbral: > 0 en 1 min → alerta inmediata

Alarma: OFFLINE_SYNC_FAILURES
  Métrica: count(sync.failed_count > 0) por hora
  Umbral: > 50 → revisar consistencia de datos
```

-----

## 19. MANEJO DE ERRORES

### Arquitectura de Errores: Capas de Manejo

```
Error en cualquier punto del código
  ↓
  ┌─── Prisma Error ─────────────────────────┐
  │  PrismaExceptionFilter lo captura         │
  │  P2002 → 409 Conflict (EMAIL_ALREADY_EXISTS)│
  │  P2025 → 404 Not Found                    │
  │  P2003 → 409 (referencia inválida)        │
  └────────────────────────────────────────────┘
  ↓
  ┌─── Zod Validation Error ─────────────────┐
  │  ZodValidationPipe lo captura            │
  │  → 400 Bad Request con errores por campo │
  └────────────────────────────────────────────┘
  ↓
  ┌─── HttpException (NestJS) ───────────────┐
  │  HttpExceptionFilter lo captura          │
  │  → Formatea en contrato canónico         │
  └────────────────────────────────────────────┘
  ↓
  ┌─── Error no manejado ────────────────────┐
  │  HttpExceptionFilter lo captura          │
  │  → 500 Internal Server Error             │
  │  → Log ERROR con stack trace             │
  │  → NUNCA expone detalles internos        │
  └────────────────────────────────────────────┘
```

### Códigos de Error Canónicos (para el cliente)

```
AUTENTICACIÓN
  INVALID_TOKEN           → 401: Token JWT inválido o expirado
  TOKEN_EXPIRED           → 401: Token expirado (cliente debe usar refresh)
  INVALID_CREDENTIALS     → 401: Email o password incorrectos
  ACCOUNT_NOT_FOUND       → 401: Usuario no encontrado
  ACCOUNT_DELETED         → 403: Cuenta eliminada

AUTORIZACIÓN
  FORBIDDEN               → 403: Acción no permitida para este usuario
  PREMIUM_REQUIRED        → 403: Funcionalidad solo para usuarios Premium
  ONBOARDING_REQUIRED     → 403: Debe completar el onboarding primero
  RESOURCE_NOT_FOUND      → 404: Recurso no existe o no pertenece al usuario

VALIDACIÓN
  VALIDATION_ERROR        → 400: DTO inválido (incluye errores por campo)
  EMAIL_ALREADY_EXISTS    → 409: Email ya registrado
  WEAK_PASSWORD           → 400: Password no cumple requisitos
  TERMS_NOT_ACCEPTED      → 400: Términos no aceptados

RATE LIMITING
  DAILY_LIMIT_REACHED     → 429: Límite diario de IA alcanzado
  RATE_LIMIT_EXCEEDED     → 429: Demasiados requests en el período

NEGOCIO
  ACTIVE_SESSION_EXISTS   → 409: Ya hay una sesión de entrenamiento activa
  ASSESSMENT_REQUIRED     → 422: Debe completar evaluación inicial antes
  INVALID_SYNC_PLATFORM   → 400: Plataforma de salud no reconocida

SERVICIOS EXTERNOS
  AI_UNAVAILABLE          → 503: Claude API no disponible (degradación elegante)
  FOOD_DB_UNAVAILABLE     → 503: USDA no disponible (usa base local como fallback)
  UPLOAD_FAILED           → 502: Error al subir archivo a S3

SERVIDOR
  INTERNAL_ERROR          → 500: Error interno (no expone detalles)
  REQUEST_TIMEOUT         → 408: La operación tardó demasiado
```

### Formato Canónico de Error (HttpExceptionFilter)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos.",
    "details": [
      {
        "field": "password",
        "message": "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo."
      },
      {
        "field": "email",
        "message": "Formato de email inválido."
      }
    ]
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "01HWXYZ123456789",
    "version": "1.0"
  }
}
```

### Degradación Elegante de Servicios Externos

```
Claude API caída:
  → CircuitBreaker abierto después de 5 fallos/min
  → Respuesta al cliente: 503 + AI_UNAVAILABLE
  → Mensaje amigable: "CALI no está disponible ahora. Regresa en unos minutos."
  → Log ERROR en CloudWatch → Alarm a equipo
  → El registro manual de entrenamiento/comida/agua sigue funcionando

USDA API caída:
  → FoodsRepository.findLocalBase() (500 alimentos curada en DB local)
  → Respuesta al cliente: datos de la base local (sin indicar el fallback al usuario)
  → Log WARN: "USDA API unavailable — using local fallback"

S3 caída:
  → Upload de avatar falla con error amigable
  → El perfil del usuario sigue funcionando (usa avatar por defecto)
  → Log ERROR → Alarm
```

### Error Handling en ActionExecutor (Tool Calls de IA)

```
Claude devuelve tool_call: log_food_intake { description: "Pollo y arroz", meal_type: "lunch" }
  ↓
ActionExecutorService.execute()
  ↓
NutritionService.logFoodFromDescription()
  ↓ [Error: alimento no encontrado en USDA ni base local]
  ↓
ActionExecutor NO lanza excepción (no rompe el flujo de CALI)
  ↓
Emite evento de tool_result con status: "partial_success"
  ↓
CALI recibe el resultado fallido en su respuesta
  ↓
CALI adapta su respuesta: "Intenté registrar pollo y arroz pero no encontré el alimento exacto.
  ¿Puedes ser más específico? Por ejemplo: '200g de pechuga de pollo y 150g de arroz cocido'."
```

-----

## APÉNDICE A — Mapa de Dependencias de Módulos (Vista Consolidada)

```
                    ┌──────────────────────┐
                    │      AppModule       │
                    └──────────┬───────────┘
                               │ importa globalmente
          ┌────────────────────┼────────────────────────┐
          │                    │                        │
   ┌──────▼──────┐    ┌────────▼────────┐    ┌─────────▼──────┐
   │ PrismaModule│    │   RedisModule   │    │EncryptionModule│
   │  (Global)   │    │   (Global)      │    │   (Global)     │
   └──────┬──────┘    └────────┬────────┘    └─────────┬──────┘
          │                    │                        │
          └────────────────────┼────────────────────────┘
                               │
        ┌──────────────────────┼─────────────────────────────────┐
        │          ┌───────────┼──────────────┐                  │
        ▼          ▼           ▼              ▼                  ▼
   AuthModule  UsersModule  TrainingModule  NutritionModule  HydrationModule
        │          │              │              │               │
        └──────────┴──────────────┴──────────────┘               │
                               │                                  │
                    ┌──────────▼──────────────┐                  │
                    │      AIModule           │◄─────────────────┘
                    │  (transversal)          │
                    │  accede a Training,     │
                    │  Nutrition, Hydration   │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼─────────────┐
                    │  DashboardModule        │
                    │  HealthSyncModule       │
                    │  SubscriptionsModule    │
                    │  AnalyticsModule        │
                    │  NotificationsModule    │
                    └────────────────────────┘
```

-----

## APÉNDICE B — Variables de Entorno Requeridas

```bash
# App
NODE_ENV=production
PORT=3000
API_VERSION=1

# Database (Prisma)
DATABASE_URL=postgresql://user:password@host:5432/calinutri

# Redis (Upstash)
REDIS_URL=rediss://...upstash.io:6380
REDIS_TOKEN=...

# JWT RS256
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
JWT_ACCESS_TTL=900          # 15 minutos
JWT_REFRESH_TTL=2592000     # 30 días

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=cali-nutri-prod

# Encryption (AES-256-GCM para ai_messages)
ENCRYPTION_KEY=<32 bytes hex>   # Generado con: openssl rand -hex 32

# USDA Food API
USDA_API_KEY=...
USDA_API_URL=https://api.nal.usda.gov/fdc/v1

# RevenueCat
REVENUECAT_API_KEY=...
REVENUECAT_WEBHOOK_SECRET=...   # Para verificar firma del webhook

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

-----

## APÉNDICE C — Decisiones que Derivan de FinalDecisions.md

|FD           |Impacto en BackendArchitecture                                                                                 |
|-------------|---------------------------------------------------------------------------------------------------------------|
|FD-ARCH-02   |SSE en AIController. No WebSocket. Observable<MessageEvent> en StreamResponseUseCase.                          |
|FD-ARCH-03   |ContextBuilderService respeta límites de tokens fijos. HistoricalSummary cacheado 24h.                         |
|FD-ARCH-04   |RateLimitService con Redis counters TTL 24h. Respuesta canónica con upgrade_url.                               |
|FD-ARCH-05   |Un solo AIModule. ActionExecutor accede a Training, Nutrition, Hydration directamente.                         |
|FD-DB-01     |UsersRepository llama a `get_user_profile()` para campos derivados. No almacena current_weight ni current_goal.|
|FD-DB-02     |HydrationService calcula target en runtime. Sin tabla water_targets. Redis TTL 6h.                             |
|FD-DB-03     |DashboardModule.getTodaySummary() lee desde tablas fuente (no MV). Analytics lee desde daily_summary_mv.       |
|FD-DB-04     |FoodDiaryRepository persiste macros desnormalizados. Documentado como intencional.                             |
|FD-DB-06     |AIMessagesRepository encripta/desencripta con EncryptionService. content_iv requerido.                         |
|FD-DB-07     |AIMessagesRepository persiste tokens_used, tool_calls (JSONB), latency_ms.                                     |
|FD-DB-08     |SubscriptionsRepository y SubscriptionsModule para RevenueCat webhook.                                         |
|FD-DB-09     |OfflineSyncUseCase + tabla sync_idempotency. Endpoint POST /sync/offline-queue.                                |
|FD-SECCIÓN-10|PremiumGuard aplicado a: /health/export, historial ilimitado, analítica extendida.                             |

-----

*BackendArchitecture.md · CALI-NUTRI AI · Lead Backend Architect · Junio 2026*  
*Próxima revisión: inicio de Sprint S1 o ante cualquier cambio en FinalDecisions.md*  
*Este documento es la fuente única de verdad para la estructura del backend NestJS.*