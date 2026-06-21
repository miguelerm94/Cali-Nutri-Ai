# CALI-NUTRI AI

## Architecture Document

### Versión 1.0 — MVP + Scalable Foundation

**Clasificación:** Documento Técnico Interno  
**Estado:** Aprobado para Implementación  
**Última actualización:** Junio 2026

-----

## ÍNDICE

1. [Resumen Ejecutivo Técnico](#1-resumen-ejecutivo-técnico)
1. [Arquitectura de Alto Nivel](#2-arquitectura-de-alto-nivel)
1. [Frontend](#3-frontend)
1. [Backend](#4-backend)
1. [Base de Datos](#5-base-de-datos)
1. [Sistema de Autenticación](#6-sistema-de-autenticación)
1. [Integración con Apple Health y Google Health Connect](#7-integración-con-apple-health-y-google-health-connect)
1. [Integración con IA](#8-integración-con-ia)
1. [Sistema de Almacenamiento](#9-sistema-de-almacenamiento)
1. [Seguridad](#10-seguridad)
1. [Escalabilidad](#11-escalabilidad)
1. [Estructura de Carpetas](#12-estructura-de-carpetas)
1. [Infraestructura Cloud](#13-infraestructura-cloud)
1. [CI/CD](#14-cicd)
1. [Diagrama de Componentes](#15-diagrama-de-componentes)
1. [Roadmap Técnico](#16-roadmap-técnico)

-----

## 1. RESUMEN EJECUTIVO TÉCNICO

CALI-NUTRI AI es una aplicación móvil comercial de recomposición corporal que integra entrenamiento de calistenia, nutrición, hidratación y analítica mediante inteligencia artificial contextual. La arquitectura debe soportar 10.000 usuarios activos en el lanzamiento y escalar a 100.000+ usuarios sin rediseño estructural.

### Principios de Diseño Arquitectónico

|Principio                 |Justificación                                                                                                                            |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
|**API-First**             |Desacopla frontend de backend. Permite apps iOS, Android y web futura desde el mismo contrato de API.                                    |
|**Monolito Modular (MVP)**|Reduce complejidad operacional al inicio. Los módulos están diseñados para extraerse como microservicios cuando el tráfico lo justifique.|
|**Event-Driven para IA**  |Las llamadas a IA son asíncronas. Evita bloqueos y mejora la experiencia del usuario.                                                    |
|**Privacy by Design**     |Datos de salud son sensibles. Row-Level Security, cifrado en tránsito y en reposo desde el día 1.                                        |
|**Cloud-Native**          |Diseñado para AWS con posibilidad de migración a GCP. Escalabilidad horizontal con costo marginal bajo.                                  |
|**Observabilidad Total**  |Logs, métricas y trazas desde el inicio. Imposible escalar lo que no se puede medir.                                                     |

### Stack Tecnológico Principal

|Capa           |Tecnología             |Justificación                                                                          |
|---------------|-----------------------|---------------------------------------------------------------------------------------|
|Frontend Mobile|React Native + Expo    |Una sola base de código para iOS y Android. Acceso nativo a HealthKit y Health Connect.|
|Backend        |Node.js + NestJS       |TypeScript end-to-end. Framework enterprise con módulos, guards e interceptores.       |
|Base de Datos  |PostgreSQL (Supabase)  |Robustez relacional, Row-Level Security nativo, realtime incorporado.                  |
|ORM            |Prisma                 |Type-safety, migraciones automáticas, compatible con PostgreSQL.                       |
|IA             |Anthropic Claude API   |Capacidades de razonamiento contextual superiores para coaching personalizado.         |
|Caché          |Redis (Upstash)        |Sesiones, rate limiting, datos de alta frecuencia. Serverless-compatible.              |
|Almacenamiento |AWS S3                 |Fotos de progreso, imágenes de alimentos, assets.                                      |
|Infraestructura|AWS (ECS Fargate + RDS)|Escalabilidad gestionada, sin administración de servidores.                            |
|CI/CD          |GitHub Actions         |Integración con AWS y Expo EAS.                                                        |

-----

## 2. ARQUITECTURA DE ALTO NIVEL

### Modelo Arquitectónico: Monolito Modular con Event Bus Interno

Se adopta un **Monolito Modular** para el MVP por las siguientes razones:

1. Equipo pequeño en fase inicial — los microservicios distribuidos incrementan la complejidad operacional prematuramente.
1. Los módulos (Entrenamiento, Nutrición, IA, Hidratación) son cohesivos pero con contratos internos claros, permitiendo extracción futura como servicios independientes.
1. Una sola base de código desplegada reduce costos de infraestructura al inicio.
1. El crecimiento a microservicios ocurre de forma incremental, impulsado por necesidades reales de escala.

### Vista de Capas

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                 │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │   iOS App            │    │   Android App                │  │
│  │   (React Native)     │    │   (React Native)             │  │
│  │   HealthKit          │    │   Health Connect             │  │
│  └──────────┬───────────┘    └──────────────┬───────────────┘  │
└─────────────┼────────────────────────────────┼─────────────────┘
              │ HTTPS / REST + WebSocket        │
┌─────────────▼────────────────────────────────▼─────────────────┐
│                      API GATEWAY                                │
│                 AWS API Gateway / Kong                          │
│        Rate Limiting · Auth · Request Routing · Logging        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   BACKEND — NestJS Monolito Modular             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Auth       │  │ Training     │  │  Nutrition           │  │
│  │   Module     │  │ Module       │  │  Module              │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Hydration    │  │  Body        │  │  AI Conversation     │  │
│  │ Module       │  │  Module      │  │  Module              │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Health      │  │  Analytics   │  │  Notifications       │  │
│  │  Sync Module │  │  Module      │  │  Module              │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│              Internal Event Bus (EventEmitter2)                 │
└───────┬──────────────┬──────────────┬──────────────────────────┘
        │              │              │
┌───────▼──┐    ┌──────▼──┐   ┌──────▼────────────────────────┐
│PostgreSQL│    │  Redis  │   │  External Services            │
│(Supabase)│    │(Upstash)│   │  Anthropic API · AWS S3       │
│          │    │         │   │  Apple HealthKit              │
│          │    │         │   │  Google Health Connect        │
│          │    │         │   │  Push Notifications (FCM/APNs)│
└──────────┘    └─────────┘   └───────────────────────────────┘
```

### Flujo de Datos Principal

```
Usuario → App → API Gateway → Backend Module → PostgreSQL
                                    ↓
                              Redis Cache (lectura)
                                    ↓
                         Anthropic Claude API (async)
                                    ↓
                         Push Notification → Usuario
```

-----

## 3. FRONTEND

### Tecnología: React Native + Expo SDK

**Justificación técnica:**  
React Native con Expo permite un único código base para iOS y Android, con acceso a APIs nativas necesarias para CALI-NUTRI AI: HealthKit (iOS), Health Connect (Android), notificaciones push, cámara (escaneo de alimentos), y sensores de biometría.

Expo Managed Workflow es adecuado para el MVP. Se migrará a Bare Workflow cuando se requiera código nativo personalizado avanzado (v2.0+).

### Librerías Principales

|Librería                             |Propósito                             |Justificación                                         |
|-------------------------------------|--------------------------------------|------------------------------------------------------|
|`expo-health` / `react-native-health`|Integración HealthKit y Health Connect|Acceso a datos de salud del sistema operativo         |
|`react-navigation` v6                |Navegación                            |Estándar de la industria, soporte nativo de deep links|
|`zustand`                            |Estado global                         |Más ligero que Redux, suficiente para el scope del MVP|
|`react-query` (TanStack Query)       |Server state, caching, sincronización |Gestión de estado servidor con caché automático       |
|`react-native-mmkv`                  |Almacenamiento local seguro           |10x más rápido que AsyncStorage, con cifrado          |
|`expo-notifications`                 |Push notifications                    |FCM (Android) y APNs (iOS) unificados                 |
|`expo-camera`                        |Escaneo de alimentos por foto         |Necesario para v2.0                                   |
|`victory-native`                     |Gráficas de progreso                  |Biblioteca de gráficas nativas optimizada para mobile |
|`react-hook-form`                    |Formularios                           |Validación eficiente sin re-renders                   |
|`zod`                                |Validación de esquemas                |Type-safety en runtime, compartible con backend       |

### Arquitectura de Estado

```
┌──────────────────────────────────────────────────────────┐
│                     App State                            │
│                                                          │
│  ┌─────────────────┐    ┌──────────────────────────────┐ │
│  │  Auth Store     │    │  User Profile Store          │ │
│  │  (Zustand)      │    │  (Zustand + MMKV persist)    │ │
│  └─────────────────┘    └──────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Server Cache (TanStack Query)           │ │
│  │  training | nutrition | hydration | analytics        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │       Daily Progress Store (Zustand + MMKV)         │ │
│  │  Datos offline-first sincronizados al reconectar    │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Estrategia Offline-First

Los datos críticos (rutina del día, objetivos nutricionales, registro de agua) se almacenan localmente con MMKV y se sincronizan cuando hay conectividad. TanStack Query gestiona el stale-time y la invalidación de caché.

Esta estrategia garantiza funcionalidad durante entrenamientos sin conexión a internet — caso de uso frecuente en gimnasios y parques.

### Pantallas y Navegación

```
Root Navigator
├── Auth Stack
│   ├── Onboarding (datos físicos, objetivos)
│   ├── Login
│   └── Register
└── Main Tab Navigator
    ├── Dashboard (Home)
    │   └── Resumen diario: calorías, proteína, agua, pasos
    ├── Training
    │   ├── Today Workout
    │   ├── Log Workout (series, reps, RPE)
    │   ├── Exercise Library
    │   └── Progress (gráficas)
    ├── Nutrition
    │   ├── Food Diary
    │   ├── Log Food (manual, texto, foto)
    │   ├── Meal Planner
    │   └── Macros Summary
    ├── Hydration
    │   ├── Water Tracker
    │   └── History
    └── AI Chat
        └── Conversación contextual
```

-----

## 4. BACKEND

### Tecnología: Node.js + NestJS (TypeScript)

**Justificación técnica:**  
NestJS es el framework enterprise de Node.js más maduro. Su arquitectura modular (Modules, Controllers, Services, Guards, Interceptors, Pipes) mapea directamente con los dominios de CALI-NUTRI AI. TypeScript end-to-end elimina una clase entera de errores en runtime y mejora la mantenibilidad a medida que crece el equipo.

### Módulos del Backend

#### 4.1 Auth Module

- Gestión de registro, login y refresh de tokens JWT.
- Integración con Supabase Auth o implementación propia.
- Guards de autenticación aplicados globalmente.

#### 4.2 Training Module

Implementa el Motor de Entrenamiento definido en `TrainingEngine.md`.

Responsabilidades:

- Evaluación inicial y clasificación de nivel.
- Generación de rutinas basadas en máximos y objetivo.
- Registro de sesiones y workout logs.
- Algoritmo de progresión automática (2 semanas consecutivas completadas → incremento).
- Detección de estancamiento (3 semanas sin mejora o 2 semanas de regresión).
- Lógica de semana de descarga (cada 6-8 semanas).
- Ajustes por recuperación (sueño, fatiga, pasos).

#### 4.3 Nutrition Module

Implementa el Motor Nutricional definido en `NutritionEngine.md`.

Responsabilidades:

- Cálculo de TMB (Mifflin-St Jeor), TDEE y objetivos calóricos.
- Distribución de macronutrientes (proteína 1.8-2.4 g/kg, grasas 0.8-1.0 g/kg, carbohidratos residuales).
- Registro de alimentos (manual, lenguaje natural, foto).
- Ajuste automático de calorías (sin cambio de peso en 14 días con adherencia >80%).
- Planificador de comidas y recetas inteligentes.

#### 4.4 Hydration Module

- Cálculo de objetivo base (35-45 ml/kg).
- Ajuste por actividad, pasos y clima.
- Registro de consumo y alertas inteligentes.

#### 4.5 Body Module

- Historial de composición corporal.
- Cálculo de IMC, % grasa corporal estimado, masa magra.
- Tracking de peso semanal.

#### 4.6 AI Conversation Module

- Gestión de conversaciones y mensajes con Claude API.
- Enriquecimiento de contexto con datos del usuario antes de cada llamada.
- Interpretación de lenguaje natural para actualizar datos (ej: “Hice 8 dominadas”).
- Sistema de historial de conversación con ventana deslizante.

#### 4.7 Health Sync Module

- Procesamiento de datos importados desde Apple HealthKit y Google Health Connect.
- Normalización de datos (pasos, calorías activas, sueño, peso, frecuencia cardíaca).
- Sincronización con tablas `health_data` y `daily_summary`.

#### 4.8 Analytics Module

- Cálculo de tendencias semanales y mensuales.
- Indicadores de progreso (dominadas, flexiones, sentadillas, elevaciones).
- Motor de recomendaciones automáticas.

#### 4.9 Notifications Module

- Alertas de hidratación (30% al mediodía, 60% a las 6pm, 80% a las 8pm).
- Recordatorios de entrenamiento.
- Mensajes motivacionales basados en progreso.

### API Design

**Versioning:** `/api/v1/`  
**Formato:** REST + JSON  
**Protocolo:** HTTPS  
**WebSocket:** Para actualizaciones en tiempo real del AI chat

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
DELETE /api/v1/auth/logout

GET    /api/v1/users/me
PUT    /api/v1/users/me/profile

POST   /api/v1/training/assessment          # Evaluación inicial
GET    /api/v1/training/program             # Programa activo
GET    /api/v1/training/today               # Rutina del día
POST   /api/v1/training/sessions            # Iniciar sesión
POST   /api/v1/training/sessions/:id/logs   # Registrar set
PATCH  /api/v1/training/sessions/:id/finish

GET    /api/v1/nutrition/targets            # Objetivos del día
POST   /api/v1/nutrition/diary              # Registrar alimento
GET    /api/v1/nutrition/diary/today        # Resumen diario
POST   /api/v1/nutrition/parse              # Lenguaje natural → macros
POST   /api/v1/nutrition/estimate-photo     # Foto → macros

POST   /api/v1/hydration/logs              # Registrar agua
GET    /api/v1/hydration/today             # Estado hidratación

POST   /api/v1/body/measurements           # Nueva medición
GET    /api/v1/body/history                # Historial corporal

POST   /api/v1/ai/conversations            # Nueva conversación
POST   /api/v1/ai/conversations/:id/messages  # Enviar mensaje
GET    /api/v1/ai/conversations/:id        # Historial

POST   /api/v1/health/sync                 # Importar desde HealthKit/HConnect

GET    /api/v1/analytics/progress          # Dashboard analítico
GET    /api/v1/analytics/weekly-summary
```

-----

## 5. BASE DE DATOS

### Motor: PostgreSQL 15+

### ORM: Prisma 5+

### Hosting: Supabase (MVP) → AWS RDS Aurora PostgreSQL (escala)

**Justificación técnica:**  
Supabase en el MVP proporciona PostgreSQL gestionado, Row-Level Security nativo, autenticación, y Storage en una sola plataforma, reduciendo la complejidad operacional. Cuando el volumen lo requiera, se migra a AWS RDS Aurora PostgreSQL que soporta escalado de lectura con hasta 15 réplicas y serverless v2 para picos de tráfico.

### Estrategia de Particionamiento

Las tablas de alto volumen (`food_diary`, `workout_logs`, `water_logs`, `health_data`, `daily_summary`) se implementarán con **particionamiento por rango de fecha (Range Partitioning)** desde el inicio para mantener el rendimiento de consultas a escala:

```sql
-- Ejemplo de particionamiento
CREATE TABLE food_diary (
  id UUID NOT NULL,
  user_id UUID NOT NULL,
  consumed_at TIMESTAMP NOT NULL,
  ...
) PARTITION BY RANGE (consumed_at);

CREATE TABLE food_diary_2026 PARTITION OF food_diary
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

### Índices Críticos

```sql
-- Consultas de alta frecuencia
CREATE INDEX CONCURRENTLY idx_food_diary_user_date 
  ON food_diary (user_id, consumed_at DESC);

CREATE INDEX CONCURRENTLY idx_workout_logs_session 
  ON workout_logs (session_id);

CREATE INDEX CONCURRENTLY idx_water_logs_user_date 
  ON water_logs (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_daily_summary_user_date 
  ON daily_summary (user_id, date DESC);

CREATE INDEX CONCURRENTLY idx_body_measurements_user_date 
  ON body_measurements (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_health_data_user_date 
  ON health_data (user_id, imported_at DESC);
```

### Row-Level Security (RLS)

Cada tabla con `user_id` tendrá políticas RLS que garantizan que los usuarios solo acceden a sus propios datos, incluso en caso de error en la capa de aplicación:

```sql
-- Ejemplo política RLS
ALTER TABLE food_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own food diary"
  ON food_diary
  FOR ALL
  USING (auth.uid() = user_id);
```

### Estrategia de Migraciones

- **Prisma Migrate** para el ciclo de desarrollo.
- Migraciones aplicadas automáticamente en CI/CD (staging únicamente).
- Producción requiere aprobación manual + ventana de mantenimiento para cambios destructivos.
- Todas las migraciones son **aditivas primero** (add column, add table) antes de eliminar datos.

### Caché con Redis

Datos cacheados en Redis (Upstash Serverless):

|Dato                           |TTL                       |Justificación                          |
|-------------------------------|--------------------------|---------------------------------------|
|JWT blacklist                  |Hasta expiración del token|Invalidación inmediata de sesiones     |
|Objetivos nutricionales del día|1 hora                    |Calculados, no cambian con frecuencia  |
|Catálogo de alimentos (USDA)   |24 horas                  |Base de datos estática                 |
|Rate limit counters            |1 minuto ventana          |Control de abuso de API                |
|AI conversation context        |30 minutos                |Evitar re-fetch de historial           |
|Rutina del día                 |6 horas                   |Generada por IA, estable durante el día|

-----

## 6. SISTEMA DE AUTENTICACIÓN

### Estrategia: JWT + Refresh Token Rotation

**Justificación:**  
Los datos de salud son altamente sensibles. Se implementa un sistema de doble token con rotación automática para minimizar la ventana de exposición en caso de compromiso de token.

### Flujo de Autenticación

```
1. Usuario → POST /auth/register → Backend crea cuenta → Devuelve Access Token (15min) + Refresh Token (30 días)

2. Usuario → POST /auth/login → Backend valida credenciales → Devuelve AT + RT

3. App almacena:
   - Access Token: memoria (Zustand store, no persistido)
   - Refresh Token: MMKV encriptado (KeyChain en iOS, EncryptedSharedPreferences en Android)

4. Cada request → Authorization: Bearer <access_token>

5. AT expira → App llama POST /auth/refresh con RT → Backend invalida RT antiguo + emite nuevo AT + nuevo RT (rotación)

6. Logout → Backend agrega AT a Redis blacklist hasta su expiración natural
```

### Especificaciones de Seguridad

|Parámetro                 |Valor                                                                    |
|--------------------------|-------------------------------------------------------------------------|
|Access Token TTL          |15 minutos                                                               |
|Refresh Token TTL         |30 días                                                                  |
|Algoritmo JWT             |RS256 (asimétrico)                                                       |
|Almacenamiento RT en móvil|Keychain (iOS) / EncryptedSharedPreferences (Android)                    |
|Rotación de Refresh Token |En cada uso (one-time use)                                               |
|Detección de robo de token|Si se intenta usar un RT ya rotado, invalidar toda la familia de sesiones|

### Proveedor de Identidad

**MVP:** Supabase Auth (gestiona JWT, registro, login, OAuth)  
**Escala (v2.0+):** Migración a AWS Cognito o Auth0 cuando se requiera SSO enterprise o autenticación biométrica avanzada.

### Autenticación Biométrica (Móvil)

- Face ID / Touch ID para desbloquear la app (no para el login inicial).
- Implementado con `expo-local-authentication`.
- El Refresh Token es el secreto protegido por el biométrico del dispositivo.

-----

## 7. INTEGRACIÓN CON APPLE HEALTH Y GOOGLE HEALTH CONNECT

### Arquitectura de Sincronización

```
┌──────────────────────────────────────────────────────────┐
│                   Dispositivo Móvil                      │
│                                                          │
│  ┌────────────────┐        ┌────────────────────────┐   │
│  │  Apple         │        │  Google Health         │   │
│  │  HealthKit     │        │  Connect               │   │
│  │  (iOS nativo)  │        │  (Android nativo)      │   │
│  └───────┬────────┘        └──────────┬─────────────┘   │
│          │                            │                  │
│  ┌───────▼────────────────────────────▼─────────────┐   │
│  │         Health Sync Service (React Native)        │   │
│  │                                                   │   │
│  │  - Solicita permisos granulares al usuario        │   │
│  │  - Lee datos desde la última sincronización       │   │
│  │  - Normaliza a formato CALI-NUTRI AI              │   │
│  │  - Envía al backend via POST /health/sync         │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                          │ HTTPS
              ┌───────────▼──────────────┐
              │  Backend Health Sync     │
              │  Module                  │
              │  - Valida y persiste     │
              │  - Actualiza             │
              │    daily_summary         │
              │  - Dispara ajustes de    │
              │    entrenamiento/nutri.  │
              └──────────────────────────┘
```

### Permisos Solicitados

|Dato               |HealthKit (iOS)                   |Health Connect (Android)|
|-------------------|----------------------------------|------------------------|
|Pasos              |`HKQuantityTypeStepCount`         |`Steps`                 |
|Calorías activas   |`HKQuantityTypeActiveEnergyBurned`|`ActiveCaloriesBurned`  |
|Frecuencia cardíaca|`HKQuantityTypeHeartRate`         |`HeartRate`             |
|Peso               |`HKQuantityTypeBodyMass`          |`Weight`                |
|Sueño              |`HKCategoryTypeStepSleepAnalysis` |`SleepSession`          |

**Principio de mínimo privilegio:** Solo se solicitan los permisos estrictamente necesarios. Cada permiso se explica al usuario antes de solicitarlo (Privacy Nutrition Label en iOS).

### Estrategia de Sincronización

- **Sincronización al abrir la app:** Se obtienen datos desde la última sincronización (`imported_at` en `health_data`).
- **Background Sync (iOS):** `BackgroundTasks` framework para sincronización silenciosa cada 6 horas.
- **Webhook alternativo:** Si el usuario no abre la app, se usa Background App Refresh.
- **Conflictos de datos:** El dato de la plataforma de salud tiene prioridad sobre entrada manual para pasos y calorías. El peso manual tiene prioridad sobre HealthKit para métricas de composición corporal.

### Librería Recomendada

```
react-native-health (iOS - HealthKit)
react-native-health-connect (Android - Health Connect)
```

Ambas librerías exponen una API similar, con un servicio adaptador en el frontend que abstrae las diferencias de plataforma.

-----

## 8. INTEGRACIÓN CON IA

### Motor de IA: Anthropic Claude API

**Justificación técnica:**  
Claude supera a alternativas en razonamiento contextual, comprensión de instrucciones complejas y capacidad de mantener coherencia en conversaciones largas — características críticas para actuar como entrenador y nutricionista personal. Su API es enterprise-grade con SLA y controles de seguridad adecuados para datos de salud.

### Arquitectura del Sistema de IA

```
┌──────────────────────────────────────────────────────────────┐
│                  AI Conversation Module                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Context Builder                           │  │
│  │                                                        │  │
│  │  Antes de cada llamada a Claude, construye contexto:   │  │
│  │  - Perfil del usuario (edad, peso, objetivo)           │  │
│  │  - Programa de entrenamiento activo                    │  │
│  │  - Sesión de hoy y logs recientes                      │  │
│  │  - Objetivos nutricionales y consumo del día           │  │
│  │  - Hidratación actual                                  │  │
│  │  - Datos de recuperación (sueño, fatiga)               │  │
│  │  - Historial de conversación (últimos N mensajes)      │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼─────────────────────────────────┐  │
│  │              Intent Classifier                         │  │
│  │                                                        │  │
│  │  Detecta intención del mensaje:                        │  │
│  │  - LOG_WORKOUT: "Hice 8 dominadas"                     │  │
│  │  - LOG_FOOD: "Comí pollo y arroz"                      │  │
│  │  - LOG_WATER: "Tomé un litro de agua"                  │  │
│  │  - REPORT_FATIGUE: "Estoy muy cansado"                 │  │
│  │  - REPORT_SLEEP: "Dormí 5 horas"                       │  │
│  │  - QUESTION: Consulta general                          │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼─────────────────────────────────┐  │
│  │              Claude API Call                           │  │
│  │                                                        │  │
│  │  System Prompt: Rol de entrenador + nutricionista      │  │
│  │  User Context: Datos del Context Builder               │  │
│  │  Conversation History: Últimos 20 mensajes             │  │
│  │  Tools: update_workout_log, log_food, log_water,       │  │
│  │         update_recovery_data, get_recommendations      │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼─────────────────────────────────┐  │
│  │              Action Executor                           │  │
│  │                                                        │  │
│  │  Ejecuta tool calls de Claude:                         │  │
│  │  - Actualiza base de datos según respuesta             │  │
│  │  - Dispara progresión automática si aplica             │  │
│  │  - Emite eventos al Event Bus interno                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### System Prompt Base

El system prompt de Claude se construye dinámicamente e incluye:

1. **Rol:** Eres CALI, entrenador personal especializado en calistenia y nutricionista deportivo de CALI-NUTRI AI.
1. **Contexto del usuario:** Datos del perfil, programa activo, estado nutricional del día.
1. **Reglas del sistema:** Solo calistenia con peso corporal y barra de dominadas. Principios de progresión del Motor de Entrenamiento.
1. **Tools disponibles:** Funciones para actualizar datos en la base de datos.
1. **Formato de respuesta:** Conciso, motivador, basado en evidencia.

### Tool Calling (Function Calling)

Claude tendrá acceso a las siguientes herramientas que pueden ejecutar operaciones reales en la base de datos:

```json
[
  {
    "name": "log_workout_performance",
    "description": "Registra el rendimiento de ejercicio del usuario",
    "parameters": {
      "exercise": "string",
      "reps": "number",
      "sets": "number",
      "rpe": "number"
    }
  },
  {
    "name": "log_food_intake",
    "description": "Registra alimento consumido a partir de descripción en lenguaje natural",
    "parameters": {
      "description": "string",
      "meal_type": "breakfast|lunch|dinner|snack"
    }
  },
  {
    "name": "log_water_intake",
    "description": "Registra consumo de agua",
    "parameters": {
      "amount_ml": "number"
    }
  },
  {
    "name": "update_recovery_data",
    "description": "Actualiza datos de recuperación",
    "parameters": {
      "sleep_hours": "number",
      "fatigue_level": "number",
      "muscle_soreness": "string"
    }
  },
  {
    "name": "get_daily_summary",
    "description": "Obtiene resumen completo del día actual"
  },
  {
    "name": "trigger_program_adjustment",
    "description": "Marca que se necesita ajuste al programa de entrenamiento",
    "parameters": {
      "reason": "string",
      "action": "reduce_volume|increase_volume|deload|reassess"
    }
  }
]
```

### Procesamiento Asíncrono

Las llamadas a Claude son asíncronas para no bloquear la UI:

1. Usuario envía mensaje.
1. App muestra indicador de “CALI está escribiendo…”.
1. Backend llama a Claude API (p50 latencia: ~1.5s, p99: ~5s).
1. Respuesta enviada via WebSocket al cliente.
1. Tool calls ejecutados en paralelo.
1. Confirmación de actualizaciones enviada al cliente.

### Gestión de Costos de IA

- **Caché de contexto:** Anthropic Prompt Caching para el system prompt estático (reducción de costo ~90% en tokens de entrada repetidos).
- **Rate limiting por usuario:** Máximo 50 mensajes/día en plan gratuito, ilimitado en premium.
- **Historial truncado:** Máximo últimos 20 mensajes en el contexto para controlar tokens.
- **Monitoring de costos:** Alertas cuando el costo diario supera umbral definido.

-----

## 9. SISTEMA DE ALMACENAMIENTO

### Arquitectura de Almacenamiento

|Tipo de Dato                                   |Tecnología     |Justificación                              |
|-----------------------------------------------|---------------|-------------------------------------------|
|Datos relacionales (usuarios, logs, etc.)      |PostgreSQL     |Integridad referencial, queries complejas  |
|Archivos binarios (fotos de progreso, imágenes)|AWS S3         |Escalable, costo por GB bajo, CDN integrado|
|Datos de sesión y caché                        |Redis (Upstash)|In-memory, baja latencia                   |
|Datos offline en dispositivo                   |MMKV (cifrado) |Acceso offline, 10x más rápido que SQLite  |

### AWS S3 — Estructura de Buckets

```
cali-nutri-prod/
├── users/
│   └── {user_id}/
│       ├── profile-photo/
│       │   └── avatar.jpg
│       └── progress-photos/
│           └── {date}/
│               └── {photo_id}.jpg
└── foods/
    └── images/
        └── {food_id}.jpg
```

### Política de Acceso a S3

- **Bucket privado** sin acceso público directo.
- URLs pre-firmadas (signed URLs) con TTL de 1 hora para acceso del cliente.
- El backend genera y devuelve las URLs pre-firmadas, nunca las credenciales de AWS.
- Política de ciclo de vida: fotos de progreso se archivan a S3 Glacier después de 2 años (reducción de costo).

### Estrategia de Respaldo

|Dato                   |Frecuencia de backup                     |Retención            |
|-----------------------|-----------------------------------------|---------------------|
|PostgreSQL (producción)|Continuo (WAL streaming) + Daily snapshot|30 días              |
|S3 (fotos)             |Versionado activado                      |Versiones por 90 días|
|Redis                  |No se respalda (datos efímeros)          |—                    |

-----

## 10. SEGURIDAD

### Marco de Seguridad: Defense in Depth

Múltiples capas de seguridad que protegen ante fallos individuales.

### 10.1 Seguridad de Red

```
Internet → AWS WAF → CloudFront → API Gateway → Backend
```

- **AWS WAF:** Protección contra OWASP Top 10, rate limiting por IP, geo-blocking si se requiere.
- **CloudFront:** CDN + DDoS mitigation (AWS Shield Standard incluido).
- **API Gateway:** Rate limiting por API key, validación de JWT antes de llegar al backend.
- **VPC:** Backend y base de datos en subredes privadas. Solo el API Gateway es público.

### 10.2 Autenticación y Autorización

- JWT RS256 con rotación de claves.
- Refresh Token Rotation con detección de robo.
- Row-Level Security en PostgreSQL.
- RBAC (Role-Based Access Control) a nivel de NestJS Guards.

### 10.3 Cifrado

|Capa                    |Algoritmo       |Implementación                      |
|------------------------|----------------|------------------------------------|
|Tránsito                |TLS 1.3         |Enforced en API Gateway y CloudFront|
|Base de datos en reposo |AES-256         |RDS Encryption at rest              |
|Contraseñas             |bcrypt (cost=12)|En el backend antes de persistir    |
|Refresh Tokens en DB    |SHA-256 hash    |Solo se almacena el hash            |
|Datos sensibles en campo|AES-256-GCM     |Para campos como `body_fat_percent` |
|Datos en dispositivo    |AES-256         |MMKV con clave derivada de Keychain |

### 10.4 Privacidad y Cumplimiento

- **GDPR / CCPA:** Endpoint de exportación de datos y eliminación de cuenta (right to be forgotten).
- **HIPAA-adjacent:** Aunque CALI-NUTRI AI no es un dispositivo médico, los datos de salud se tratan con los mismos controles: cifrado, auditoría, mínimo privilegio.
- **App Store / Google Play:** Cumplimiento de las políticas de datos de salud de Apple y Google, incluyendo Privacy Nutrition Labels y Data Safety Section.
- **Logs de auditoría:** Todas las operaciones de acceso a datos sensibles se registran con timestamp, user_id y acción.

### 10.5 Seguridad de la API

- **Input Validation:** Zod schemas validan todos los inputs en el backend (nunca confiar en el cliente).
- **SQL Injection Prevention:** Prisma ORM usa queries parametrizadas por defecto.
- **XSS Prevention:** Sanitización de inputs de texto libre antes de persistir.
- **Rate Limiting:** Por usuario y por IP con Redis.
- **CORS:** Lista blanca de orígenes permitidos (dominio de la app y dashboard web futuro).

### 10.6 Seguridad en Dispositivo Móvil

- No almacenar secrets en AsyncStorage (no cifrado).
- Certificate Pinning para las llamadas a la API backend (previene proxying MITM).
- Jailbreak/Root detection para alertar al usuario (no bloquear, pero avisar).
- Biometric lock de la app.

-----

## 11. ESCALABILIDAD

### Proyección de Crecimiento

|Período               |Usuarios Activos |Requests/día|Registros/día|
|----------------------|-----------------|------------|-------------|
|Lanzamiento (Mes 1-3) |1.000 – 5.000    |~100.000    |~50.000      |
|Crecimiento (Mes 4-12)|5.000 – 10.000   |~500.000    |~250.000     |
|Escala (Año 2)        |10.000 – 50.000  |~2.000.000  |~1.000.000   |
|Escala Global (Año 3) |50.000 – 100.000+|~5.000.000  |~2.500.000   |

### Estrategia de Escalabilidad por Capa

#### Base de Datos

**MVP (hasta 10k usuarios):**

- Supabase Pro (PostgreSQL gestionado, 8 GB RAM, 100 GB SSD).
- Índices optimizados + particionamiento desde el inicio.
- Pool de conexiones con PgBouncer (incluido en Supabase).

**Escala (10k-50k usuarios):**

- Migración a AWS RDS Aurora PostgreSQL Serverless v2.
- Réplica de lectura para queries analíticas.
- ElastiCache Redis para caché de segundo nivel.

**Escala Global (50k-100k+ usuarios):**

- Aurora Global Database (múltiples regiones).
- Caché agresiva en Redis con TTLs bien definidos.
- Considerar CockroachDB si se requiere distribución multi-región activa-activa.

#### Backend

**MVP:**

- 2 instancias ECS Fargate (1 vCPU, 2 GB RAM cada una).
- Auto Scaling Group con métricas de CPU y request count.
- Application Load Balancer.

**Escala:**

- Horizontal scaling automático hasta 20 instancias.
- Extracción del AI Conversation Module como servicio independiente (el más intensivo en latencia y costo).
- Extracción del Health Sync Module para procesamiento en background (SQS + Lambda).

**Microservicios (Año 2+, impulsado por necesidad real):**

```
API Gateway
├── Auth Service
├── Training Service
├── Nutrition Service
├── AI Service          ← Mayor carga, escala independientemente
├── Health Sync Service ← Procesamiento batch, SQS-driven
├── Analytics Service   ← Read-heavy, caché agresiva
└── Notification Service
```

#### Estrategia de Caché Multinivel

```
Request → L1: Redis (hit?) → Respuesta inmediata
               │ (miss)
               ▼
          L2: PostgreSQL Query Cache (índices)
               │ (miss)
               ▼
          L3: Full DB Query + populate Redis
```

#### Gestión de Picos de Tráfico

- **Mañana (6-9 AM):** Pico de registro de entrenamiento y desayuno.
- **Noche (7-10 PM):** Pico de cierre de día (agua, cena, resumen).
- ECS Auto Scaling basado en métricas de Application Load Balancer con target tracking de CPU al 60%.
- SQS para desacoplar operaciones pesadas (sincronización de salud, llamadas a IA) del request principal.

-----

## 12. ESTRUCTURA DE CARPETAS

### Frontend (React Native + Expo)

```
cali-nutri-mobile/
├── app/                         # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding/
│   │       ├── step-1-profile.tsx
│   │       ├── step-2-assessment.tsx
│   │       └── step-3-goals.tsx
│   ├── (tabs)/
│   │   ├── index.tsx            # Dashboard
│   │   ├── training/
│   │   │   ├── index.tsx        # Today Workout
│   │   │   ├── log.tsx          # Log Session
│   │   │   └── progress.tsx
│   │   ├── nutrition/
│   │   │   ├── index.tsx        # Food Diary
│   │   │   ├── log.tsx          # Log Food
│   │   │   └── planner.tsx
│   │   ├── hydration/
│   │   │   └── index.tsx
│   │   └── ai-chat/
│   │       └── index.tsx
│   └── _layout.tsx
│
├── components/
│   ├── ui/                      # Componentes de diseño base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── MacroBar.tsx
│   │   └── RPESelector.tsx
│   ├── training/
│   │   ├── WorkoutCard.tsx
│   │   ├── ExerciseSet.tsx
│   │   └── ProgressChart.tsx
│   ├── nutrition/
│   │   ├── FoodEntry.tsx
│   │   ├── MacroSummary.tsx
│   │   └── MealCard.tsx
│   ├── hydration/
│   │   └── WaterTracker.tsx
│   └── ai/
│       ├── ChatBubble.tsx
│       └── TypingIndicator.tsx
│
├── stores/                      # Zustand stores
│   ├── auth.store.ts
│   ├── user.store.ts
│   └── daily-progress.store.ts
│
├── services/                    # Lógica de negocio del cliente
│   ├── api/
│   │   ├── client.ts            # Axios instance con interceptors
│   │   ├── auth.api.ts
│   │   ├── training.api.ts
│   │   ├── nutrition.api.ts
│   │   ├── hydration.api.ts
│   │   └── ai.api.ts
│   ├── health/
│   │   ├── health-sync.service.ts
│   │   ├── healthkit.adapter.ts
│   │   └── health-connect.adapter.ts
│   └── notifications/
│       └── notifications.service.ts
│
├── hooks/                       # Custom hooks
│   ├── useAuth.ts
│   ├── useDailyProgress.ts
│   ├── useWorkout.ts
│   └── useNutrition.ts
│
├── constants/
│   ├── theme.ts                 # Design tokens
│   ├── api.ts                   # API endpoints
│   └── config.ts
│
├── types/                       # TypeScript types compartidos
│   ├── training.types.ts
│   ├── nutrition.types.ts
│   └── user.types.ts
│
├── utils/
│   ├── macros.ts                # Cálculos nutricionales
│   ├── training.ts              # Cálculos de entrenamiento
│   └── format.ts                # Formateo de datos para UI
│
├── app.json
├── babel.config.js
├── tsconfig.json
└── package.json
```

### Backend (NestJS)

```
cali-nutri-api/
├── src/
│   ├── main.ts                  # Bootstrap, configuración global
│   ├── app.module.ts            # Root module
│   │
│   ├── common/                  # Código transversal
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── refresh-token.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   └── pipes/
│   │       └── zod-validation.pipe.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── refresh.strategy.ts
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       └── login.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── training/
│   │   │   ├── training.module.ts
│   │   │   ├── training.controller.ts
│   │   │   ├── training.service.ts
│   │   │   ├── engines/
│   │   │   │   ├── progression.engine.ts
│   │   │   │   ├── routine-generator.engine.ts
│   │   │   │   ├── stagnation-detector.engine.ts
│   │   │   │   └── deload.engine.ts
│   │   │   └── dto/
│   │   │
│   │   ├── nutrition/
│   │   │   ├── nutrition.module.ts
│   │   │   ├── nutrition.controller.ts
│   │   │   ├── nutrition.service.ts
│   │   │   ├── engines/
│   │   │   │   ├── macro-calculator.engine.ts
│   │   │   │   ├── tdee-calculator.engine.ts
│   │   │   │   └── auto-adjust.engine.ts
│   │   │   └── dto/
│   │   │
│   │   ├── hydration/
│   │   │   ├── hydration.module.ts
│   │   │   ├── hydration.controller.ts
│   │   │   ├── hydration.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── body/
│   │   │   ├── body.module.ts
│   │   │   ├── body.controller.ts
│   │   │   ├── body.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── ai/
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── context-builder.service.ts
│   │   │   ├── intent-classifier.service.ts
│   │   │   ├── action-executor.service.ts
│   │   │   └── tools/
│   │   │       ├── workout-logger.tool.ts
│   │   │       ├── food-logger.tool.ts
│   │   │       └── recovery-updater.tool.ts
│   │   │
│   │   ├── health-sync/
│   │   │   ├── health-sync.module.ts
│   │   │   ├── health-sync.controller.ts
│   │   │   ├── health-sync.service.ts
│   │   │   └── normalizers/
│   │   │       ├── healthkit.normalizer.ts
│   │   │       └── health-connect.normalizer.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   └── notifications/
│   │       ├── notifications.module.ts
│   │       └── notifications.service.ts
│   │
│   └── infrastructure/
│       ├── database/
│       │   ├── prisma.service.ts
│       │   └── prisma.module.ts
│       ├── cache/
│       │   ├── redis.service.ts
│       │   └── redis.module.ts
│       ├── storage/
│       │   ├── s3.service.ts
│       │   └── storage.module.ts
│       └── events/
│           └── events.module.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── Dockerfile
├── nest-cli.json
├── tsconfig.json
└── package.json
```

-----

## 13. INFRAESTRUCTURA CLOUD

### Proveedor Principal: AWS

**Justificación:** AWS ofrece el mayor ecosistema de servicios gestionados, mejor integración con Apple/Google para distribución móvil, y el SLA más alto de la industria. Supabase como capa de abstracción en el MVP reduce el tiempo de configuración inicial.

### Diagrama de Infraestructura

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud (Region: us-east-1)            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    VPC                               │   │
│  │                                                      │   │
│  │  ┌─────────────────────┐  ┌──────────────────────┐  │   │
│  │  │   Public Subnet     │  │   Private Subnet     │  │   │
│  │  │                     │  │                      │  │   │
│  │  │  ┌───────────────┐  │  │  ┌────────────────┐  │  │   │
│  │  │  │ Application   │  │  │  │ ECS Fargate    │  │  │   │
│  │  │  │ Load Balancer │──┼──┼─▶│ (NestJS API)   │  │  │   │
│  │  │  └───────────────┘  │  │  │ 2-20 tasks     │  │  │   │
│  │  │                     │  │  └────────┬───────┘  │  │   │
│  │  └─────────────────────┘  │           │          │  │   │
│  │                           │  ┌────────▼───────┐  │  │   │
│  │                           │  │ RDS Aurora     │  │  │   │
│  │                           │  │ PostgreSQL     │  │  │   │
│  │                           │  │ (Multi-AZ)     │  │  │   │
│  │                           │  └────────────────┘  │  │   │
│  │                           │                      │  │   │
│  │                           │  ┌────────────────┐  │  │   │
│  │                           │  │ ElastiCache    │  │  │   │
│  │                           │  │ Redis          │  │  │   │
│  │                           │  └────────────────┘  │  │   │
│  │                           └──────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │   AWS S3    │  │  CloudFront  │  │  AWS WAF           │  │
│  │  (Storage)  │  │  (CDN)       │  │  (Security)        │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ API Gateway │  │  CloudWatch  │  │  AWS SQS           │  │
│  │ (Routing)   │  │  (Observ.)   │  │  (Queue - v2.0)    │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Servicios Externos:
┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ Anthropic API  │  │  Firebase (FCM)  │  │  Apple APNs     │
│ (Claude)       │  │  Notifications   │  │  Notifications  │
└────────────────┘  └──────────────────┘  └─────────────────┘
```

### Configuración por Entorno

|Recurso      |Development         |Staging                 |Production            |
|-------------|--------------------|------------------------|----------------------|
|Backend      |Local Docker Compose|ECS Fargate 1 task      |ECS Fargate 2-20 tasks|
|Base de datos|PostgreSQL Docker   |Supabase Free           |AWS RDS Aurora        |
|Redis        |Redis Docker        |Upstash Free            |ElastiCache           |
|Storage      |MinIO local         |S3 Bucket separado      |S3 con CloudFront     |
|IA           |Claude API (dev key)|Claude API (staging key)|Claude API (prod key) |

### Estimación de Costos (Producción, 10k usuarios activos)

|Servicio                          |Costo Mensual Estimado            |
|----------------------------------|----------------------------------|
|ECS Fargate (2-4 tasks)           |~$80-160                          |
|RDS Aurora PostgreSQL             |~$200-300                         |
|ElastiCache Redis (cache.t3.micro)|~$25                              |
|S3 + CloudFront                   |~$20-50                           |
|API Gateway                       |~$15-30                           |
|AWS WAF                           |~$20                              |
|CloudWatch                        |~$20                              |
|Anthropic Claude API              |Variable (~$0.01-0.05/usuario/día)|
|**Total estimado**                |**~$400-700/mes**                 |

-----

## 14. CI/CD

### Pipeline de Integración y Despliegue Continuo

**Plataforma:** GitHub Actions  
**Principio:** Todo lo que puede automatizarse, debe automatizarse. Los deploys manuales son fuente de errores.

### Flujo del Pipeline

```
Developer Push → Feature Branch
        │
        ▼
┌────────────────────────────────────┐
│  PR Checks (automatizado)          │
│  ✓ ESLint + Prettier               │
│  ✓ TypeScript compilation          │
│  ✓ Unit tests (Jest)               │
│  ✓ Integration tests               │
│  ✓ Security scan (Snyk)            │
│  ✓ Database migration validation   │
└────────────────────┬───────────────┘
                     │ PR aprobado
                     ▼
              Merge a main
                     │
                     ▼
┌────────────────────────────────────┐
│  Staging Deploy (automatizado)     │
│  1. Build Docker image             │
│  2. Push a ECR                     │
│  3. Apply DB migrations            │
│  4. Deploy to ECS Fargate staging  │
│  5. E2E tests contra staging       │
│  6. Notificación al equipo         │
└────────────────────┬───────────────┘
                     │ Aprobación manual para prod
                     ▼
┌────────────────────────────────────┐
│  Production Deploy                 │
│  1. Blue/Green deployment en ECS   │
│  2. Health checks automáticos      │
│  3. Rollback automático si falla   │
│  4. Slack notification             │
└────────────────────────────────────┘

Frontend (Expo EAS):
Feature branch → EAS Build preview → TestFlight/Firebase App Distribution
main branch → EAS Submit → App Store Connect + Google Play Console
```

### Estrategia de Deployment: Blue/Green

Se usa Blue/Green deployment en producción para garantizar cero downtime:

1. La versión actual (Blue) sigue sirviendo tráfico.
1. Se despliega la nueva versión (Green) en parallel.
1. Health checks verifican que Green está saludable.
1. El ALB redirige el tráfico de Blue a Green.
1. Blue se mantiene en espera por 15 minutos (rollback rápido si es necesario).
1. Blue se destruye si no hay incidentes.

### Workflow de GitHub Actions (estructura)

```yaml
# .github/workflows/backend-ci.yml
on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    - Lint, type-check, unit tests, integration tests
  
  build:
    needs: test
    - Build Docker image, push to ECR

  deploy-staging:
    needs: build
    if: branch == 'staging'
    - Apply migrations, deploy to ECS staging, run E2E tests

  deploy-production:
    needs: build
    if: branch == 'main'
    environment: production  # Requiere aprobación manual
    - Blue/Green deployment to ECS production
```

### Observabilidad y Monitoreo

|Herramienta   |Propósito                               |
|--------------|----------------------------------------|
|AWS CloudWatch|Métricas de infraestructura, logs de ECS|
|Sentry        |Error tracking frontend y backend       |
|DataDog (v2.0)|APM, distributed tracing                |
|Uptime Robot  |Monitoring de endpoints críticos        |
|PagerDuty     |Alertas de incidentes a on-call         |

**SLOs definidos:**

- API p99 latency < 500ms
- Uptime > 99.9% mensual
- Error rate < 0.1%
- AI response time p95 < 5s

-----

## 15. DIAGRAMA DE COMPONENTES

### Diagrama de Contexto (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Ecosistema CALI-NUTRI AI                     │
│                                                                 │
│   ┌──────────┐     ┌─────────────────────────┐     ┌────────┐  │
│   │ Usuario  │────▶│    CALI-NUTRI AI App     │────▶│ Apple  │  │
│   │ (Atleta) │◀────│    (iOS / Android)       │◀────│ Health │  │
│   └──────────┘     └────────────┬────────────┘     └────────┘  │
│                                 │                               │
│                    ┌────────────▼────────────┐     ┌────────┐  │
│                    │   CALI-NUTRI AI Backend  │────▶│ Google │  │
│                    │   API (NestJS)           │◀────│ Health │  │
│                    └────────────┬────────────┘     │ Connect│  │
│                                 │                  └────────┘  │
│              ┌──────────────────┼──────────────────┐           │
│              │                  │                  │           │
│   ┌──────────▼──┐  ┌────────────▼──────┐  ┌───────▼──────┐   │
│   │ PostgreSQL  │  │  Anthropic Claude  │  │ Push Notif.  │   │
│   │ (Datos)     │  │  API (IA)          │  │ FCM / APNs   │   │
│   └─────────────┘  └───────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Diagrama de Contenedores (C4 Level 2)

```
                           ┌─────────────────────────────────┐
                           │   Mobile App (React Native)     │
                           │                                 │
                           │  ┌──────────┐  ┌────────────┐  │
                           │  │ UI Layer │  │ State Mgmt │  │
                           │  │(Screens) │  │ (Zustand + │  │
                           │  └─────┬────┘  │ RQ)        │  │
                           │        │       └─────┬──────┘  │
                           │  ┌─────▼────────────▼──────┐  │
                           │  │     API Service Layer    │  │
                           │  │  (Axios + Interceptors)  │  │
                           │  └─────────────┬────────────┘  │
                           │                │               │
                           │  ┌─────────────▼────────────┐  │
                           │  │   Health Sync Service    │  │
                           │  │ (HealthKit / HC Adapter) │  │
                           │  └──────────────────────────┘  │
                           └────────────────┬────────────────┘
                                            │ HTTPS REST + WSS
                           ┌────────────────▼────────────────┐
                           │   NestJS API (ECS Fargate)      │
                           │                                 │
                           │  ┌──────┐ ┌──────┐ ┌────────┐  │
                           │  │ Auth │ │Train.│ │Nutrit. │  │
                           │  └──┬───┘ └──┬───┘ └───┬────┘  │
                           │  ┌──┴───────┬┴──────────┴────┐  │
                           │  │    Internal Event Bus      │  │
                           │  └──────────┬────────────────┘  │
                           │  ┌──────┐ ┌─┴────┐ ┌────────┐  │
                           │  │ AI   │ │Health│ │Analyt. │  │
                           │  │Conv. │ │Sync  │ │        │  │
                           │  └──┬───┘ └──────┘ └────────┘  │
                           └─────┼───────────────────────────┘
              ┌──────────────────┼──────────────────┐
              │                  │                  │
   ┌──────────▼──┐    ┌──────────▼────────┐  ┌─────▼────┐
   │ PostgreSQL  │    │  Anthropic Claude  │  │  Redis   │
   │ (RDS/Supa.) │    │  API              │  │          │
   └─────────────┘    └───────────────────┘  └──────────┘
```

### Diagrama de Flujo: Registro de Entrenamiento vía IA

```
Usuario escribe: "Hice 8 dominadas"
        │
        ▼
App → POST /ai/conversations/:id/messages
        │
        ▼
AI Module recibe mensaje
        │
        ▼
Context Builder: agrega perfil, programa activo, logs del día
        │
        ▼
Claude API llamada con contexto enriquecido + tools disponibles
        │
        ▼
Claude responde con tool_call: log_workout_performance
  { exercise: "dominadas", reps: 8, estimated_rpe: 8 }
        │
        ▼
Action Executor: POST interno a Training Module
        │
        ▼
Training Module:
  1. Persiste en workout_logs
  2. Compara con máximo histórico (7 → 8 dominadas = nuevo máximo)
  3. Actualiza daily_summary
  4. Evalúa si cumple criterios de progresión
  5. Emite evento: USER_PERFORMANCE_UPDATED
        │
        ▼
Claude genera respuesta: "¡Excelente! 8 dominadas es tu nuevo máximo.
  Si mantienes esto 2 semanas, aumentamos a 4x4. 
  Tu rendimiento subió un 14%. 🎯"
        │
        ▼
WebSocket → App → UI actualiza
```

-----

## 16. ROADMAP TÉCNICO

### Fase 1 — MVP Foundation (Meses 1-3)

**Objetivo:** Aplicación funcional con los módulos core listos para TestFlight y Google Play Beta.

|Sprint      |Deliverables                                                                                 |
|------------|---------------------------------------------------------------------------------------------|
|Sprint 1-2  |Setup infraestructura AWS + Supabase. Backend base con NestJS. Autenticación JWT.            |
|Sprint 3-4  |Módulo de perfil y composición corporal. Cálculo de TMB/TDEE. Base de datos esquema completo.|
|Sprint 5-6  |Motor de entrenamiento: evaluación, generación de rutinas, registro de sesiones.             |
|Sprint 7-8  |Motor nutricional: cálculo de macros, registro de alimentos, resumen diario.                 |
|Sprint 9-10 |Módulo de hidratación. Dashboard básico. Integración Apple Health básica (pasos, peso).      |
|Sprint 11-12|AI Conversation Module. Integration tests. Beta release interno.                             |

**Criterios de aceptación Fase 1:**

- [ ] Usuario puede crear cuenta y completar onboarding.
- [ ] Sistema genera rutina personalizada basada en evaluación.
- [ ] Usuario puede registrar entrenamiento, comidas y agua.
- [ ] Dashboard muestra resumen diario completo.
- [ ] IA responde a mensajes en lenguaje natural y actualiza datos.
- [ ] 99% uptime en staging durante 2 semanas.

### Fase 2 — Beta Pública (Meses 4-6)

**Objetivo:** Lanzamiento en App Store y Google Play con primeros usuarios reales.

|Prioridad|Funcionalidad                                                |
|---------|-------------------------------------------------------------|
|Alta     |Push notifications inteligentes (hidratación, entrenamiento).|
|Alta     |Progresión automática y detección de estancamiento.          |
|Alta     |Integración completa Apple Health + Google Health Connect.   |
|Media    |Gráficas de progreso (peso, dominadas, flexiones, macros).   |
|Media    |Semana de descarga automática.                               |
|Baja     |Exportación de datos (PDF de progreso semanal).              |

### Fase 3 — Escala y Optimización (Meses 7-12)

**Objetivo:** Crecimiento a 10.000 usuarios activos con métricas de retención >35%.

|Área        |Acción                                                                                    |
|------------|------------------------------------------------------------------------------------------|
|Performance |Migración de Supabase a AWS RDS Aurora. Implementación de caché Redis multinivel.         |
|IA          |Escaneo de alimentos por foto (Computer Vision via Claude). Ajuste automático de calorías.|
|Integración |Apple Watch (actividad en tiempo real).                                                   |
|Analytics   |Dashboard de progreso avanzado. Predicción de resultados.                                 |
|Monetización|Sistema de suscripción Premium (RevenueCat).                                              |

### Fase 4 — Versión 2.0 (Año 2)

**Objetivo:** Expansión a 50.000+ usuarios. Funcionalidades diferenciadoras.

|Módulo          |Descripción                                                                         |
|----------------|------------------------------------------------------------------------------------|
|Body Scan AI    |Estimación de % grasa corporal mediante foto frontal/lateral.                       |
|Coach Adaptativo|IA que ajusta automáticamente entrenamiento y calorías sin intervención del usuario.|
|Comunidad       |Feed social, retos de grupo, rankings de rendimiento.                               |
|Gamificación    |Sistema de logros, racha de entrenamiento, badges.                                  |
|Microservicios  |Extracción de AI Module y Health Sync Module como servicios independientes.         |

### Decisiones Técnicas Diferidas (Deferred Decisions)

Las siguientes decisiones se toman deliberadamente más tarde, cuando hay datos reales que las justifiquen:

|Decisión                                    |Cuándo decidir                   |Señal de alerta                        |
|--------------------------------------------|---------------------------------|---------------------------------------|
|Migrar a microservicios completos           |Año 2                            |Latencia > 300ms promedio en staging   |
|Cambiar de PostgreSQL a solución distribuida|Año 3                            |> 500k usuarios, consultas multi-región|
|Implementar ML propio (en lugar de Claude)  |Cuando costo IA > $10k/mes       |ROI de modelo propio justificado       |
|CDN para API responses                      |Si latencia internacional > 800ms|Expansión a mercados de LATAM/Europa   |

-----

## APÉNDICE A — Decisiones de Arquitectura (ADRs)

### ADR-001: Monolito Modular vs Microservicios

**Decisión:** Monolito Modular para MVP  
**Estado:** Aceptado  
**Contexto:** Equipo pequeño, time-to-market crítico, escala inicial baja.  
**Consecuencias:** Menor complejidad operacional. Módulos con interfaces claras facilitan extracción futura.  
**Revisión:** En 12 meses o al superar 30k usuarios.

### ADR-002: React Native vs Flutter vs Nativo

**Decisión:** React Native + Expo  
**Estado:** Aceptado  
**Contexto:** Una sola base de código. Equipo con experiencia en JavaScript/TypeScript. Acceso a HealthKit y Health Connect requerido.  
**Consecuencias:** Rendimiento ligeramente inferior a nativo para animaciones complejas. Mitigable con react-native-reanimated. Permite lanzar simultáneo en iOS y Android.

### ADR-003: Anthropic Claude vs OpenAI GPT vs Modelo Local

**Decisión:** Anthropic Claude API  
**Estado:** Aceptado  
**Contexto:** Se requiere razonamiento contextual profundo, Tool Calling confiable, y procesamiento de lenguaje natural para actualizar datos de salud.  
**Consecuencias:** Dependencia de servicio externo. Costo variable por uso. Mitigado con Prompt Caching y rate limiting.  
**Revisión:** Si el costo supera $10k/mes, evaluar modelo local (Llama 3 en GPU) o fine-tuning propio.

### ADR-004: Supabase vs AWS RDS directo

**Decisión:** Supabase para MVP, migración a AWS RDS Aurora en Fase 3  
**Estado:** Aceptado  
**Contexto:** Supabase reduce tiempo de configuración (PostgreSQL + Auth + Storage en una plataforma). AWS RDS Aurora es más adecuado para escala y control enterprise.  
**Consecuencias:** Migración necesaria en Fase 3. El uso de Prisma como ORM abstrae la capa de base de datos, haciendo la migración predecible y de bajo riesgo.

-----

## APÉNDICE B — Checklist de Lanzamiento (App Store / Google Play)

### Apple App Store

- [ ] Privacy Nutrition Label configurado correctamente (datos de salud y fitness).
- [ ] HealthKit entitlement aprobado por Apple.
- [ ] Descripción de uso de datos de salud en Privacy Policy.
- [ ] No se incluyen modelos de predicción de condiciones médicas.
- [ ] App no pretende ser dispositivo médico (disclaimer claro).

### Google Play

- [ ] Data Safety section completada (datos de salud, actividad física).
- [ ] Health Connect permission declaration.
- [ ] Privacy Policy accesible desde la ficha de la app.

-----

*Documento generado por el equipo de arquitectura de CALI-NUTRI AI.*  
*Próxima revisión: Al completar Fase 1 (Mes 3).*