// =============================================================================
// CALI-NUTRI AI — schema.prisma
// =============================================================================
// Versión:          1.0.0
// Fuente canónica:  FinalDecisions.md v1.0 (Junio 2026)
// Motor:            PostgreSQL 15+ (Supabase)
// ORM:              Prisma 5.x
// Autor:            Arquitectura Principal — CALI-NUTRI AI
// =============================================================================
//
// DECISIONES ARQUITECTÓNICAS INCORPORADAS (ver FinalDecisions.md):
//
//  FD-DB-01 · users: eliminados goal, current_weight_kg, experience_level
//             El objetivo activo = GOALS WHERE status='active'
//             El peso actual    = BODY_MEASUREMENTS ORDER BY created_at DESC LIMIT 1
//             El nivel          = derivado en runtime desde user_assessments.global_score
//
//  FD-DB-02 · water_targets: TABLA ELIMINADA
//             Target calculado en runtime: peso_kg × 40 + ajustes
//             Cacheado en Redis: key hydration:target:{uid}:{date} TTL 6h
//
//  FD-DB-03 · daily_summary: TABLA ELIMINADA → Vista Materializada PostgreSQL
//             DDL: ver prisma/sql/01_materialized_views.sql
//             Refresh: BullMQ job cada 30 min (CONCURRENTLY)
//             Dashboard de hoy → lee desde tablas fuente (no MV)
//             Analítica histórica → lee desde daily_summary_mv
//
//  FD-DB-04 · food_diary: DESNORMALIZACIÓN INTENCIONAL Y PERMANENTE
//             macros almacenados al momento del registro
//             NO recalcular desde foods.* para historial — protege contra
//             actualizaciones de la base USDA que cambiarían el historial del usuario
//
//  FD-DB-05 · user_assessments: TABLA NUEVA
//             fitness_score continuo 0–100 por movimiento (FD-01 arquitectura de 2 capas)
//             Nivel de presentación DERIVADO en runtime, nunca almacenado como fuente única
//
//  FD-DB-06 · ai_messages.content: ENCRIPTADO AES-256-GCM
//             Almacenado como base64. NO leer sin EncryptionService.decrypt()
//             Clave maestra en AWS KMS (no en env vars)
//
//  FD-DB-07 · ai_messages: campos adicionales para SLA y control de costos
//             content_iv, tokens_used, tool_calls (JSONB), latency_ms
//
//  FD-DB-08 · subscriptions: TABLA NUEVA para RevenueCat
//             Sincronizada via webhook POST /webhooks/revenuecat
//
//  FD-DB-09 · sync_queue_items: TABLA NUEVA para offline mode
//             Cola primaria en dispositivo (MMKV). Esta tabla = idempotency + auditoría backend
//
//  FD-DB-10 · notification_logs: TABLA NUEVA para deep linking
//
//  FD-SEC-01 · users: soft delete con deleted_at (GDPR)
//              Hard delete en cascada a 30 días via BullMQ job
//
//  FD-01    · fitness_score continuo 0-100 (puntuación interna por movimiento)
//             Pesos del score global: Dominadas 40%, Flexiones 30%, Sentadillas 15%, Core 15%
//             Nivel de presentación (beginner/intermediate/advanced) derivado en runtime
//
//  FD-ARCH-01 · Supabase Auth es el único emisor de JWT (RS256)
//               RLS de PostgreSQL = segunda línea de defensa
//               Policies definidas en: prisma/sql/02_rls_policies.sql
//
// TABLAS CONFIRMADAS v1.0:
//   users, user_assessments*, body_measurements, goals, training_programs,
//   workout_days, exercises, workout_exercises, workout_sessions, workout_logs,
//   foods, food_diary, water_logs, health_data, ai_conversations, ai_messages,
//   subscriptions*, notification_logs*, sync_queue_items*
//   (* = NUEVA tabla post-auditoría)
//
// TABLAS ELIMINADAS v1.0:
//   ❌ water_targets     (FD-DB-02 — calcular en runtime)
//   ❌ daily_summary     (FD-DB-03 — reemplazada por Materialized View)
//   ❌ recipes           (diferida a v2.0 — FD-10)
//   ❌ recipe_ingredients (diferida a v2.0)
//   ❌ achievements      (diferida a v2.0; streak como campo en users)
//
// VISTA MATERIALIZADA (no modelo Prisma — DDL raw SQL):
//   ✅ daily_summary_mv  (FD-DB-03)
//
// =============================================================================

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "views", "typedSql"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  // directUrl usado por Prisma Migrate (sin connection pooling)
  directUrl  = env("DIRECT_URL")
  extensions = [
    pgcrypto(schema: "extensions"),  // gen_random_uuid()
    pg_trgm(schema: "extensions"),   // Búsqueda fuzzy de alimentos (GIN trigram)
    unaccent(schema: "extensions")   // Búsqueda sin acentos (español)
  ]
}

// =============================================================================
// ─── ENUMERACIONES ────────────────────────────────────────────────────────────
// =============================================================================

/// Sexo biológico — usado en fórmula Mifflin-St Jeor (FD-05)
/// Hombre: TMB = (10×peso) + (6.25×altura) - (5×edad) + 5
/// Mujer:  TMB = (10×peso) + (6.25×altura) - (5×edad) - 161
enum Sex {
  male
  female

  @@map("sex")
}

/// Preferencia de unidades del usuario — persiste entre sesiones
/// Criterio de lanzamiento (FD-Sección-12): debe aplicarse en todos los módulos
enum UnitPreference {
  metric   // kg, cm
  imperial // lbs, ft/in

  @@map("unit_preference")
}

/// Tier de suscripción del usuario
/// FD-Sección-10: Tabla oficial de límites free vs premium
/// Sincronizado con RevenueCat via webhook en < 30 segundos tras pago
enum UserTier {
  free
  premium

  @@map("user_tier")
}

/// Tipos de objetivo nutricional y físico
/// FD-06: Cada tipo tiene ajuste calórico canónico sobre TDEE:
///   muscle_gain:   TDEE + 300 kcal (rango: +200 a +400)
///   fat_loss:      TDEE - 400 kcal (rango: -300 a -600)
///   recomposition: TDEE - 150 kcal (rango: -100 a -250)
///   maintenance:   TDEE exacto
enum GoalType {
  muscle_gain
  fat_loss
  recomposition
  maintenance

  @@map("goal_type")
}

/// Estado del ciclo de vida de un objetivo
enum GoalStatus {
  active
  completed
  cancelled

  @@map("goal_status")
}

/// Estado del ciclo de vida de un programa de entrenamiento
enum TrainingProgramStatus {
  active
  completed
  cancelled

  @@map("training_program_status")
}

/// Estructura de entrenamiento semanal
/// FD-03: Tabla canónica de frecuencias y estructuras
///   full_body       → 3 días/semana (Principiante e Intermedio)
///   upper_lower     → 4 días/semana (Intermedio y Avanzado)
///   push_pull_legs  → 5 días/semana (Avanzado)
///   ppl_double      → 6 días/semana (Avanzado con score ≥ 80)
enum TrainingStructure {
  full_body
  upper_lower
  push_pull_legs
  ppl_double

  @@map("training_structure")
}

/// Tipo de día de entrenamiento dentro de una estructura
enum WorkoutDayType {
  full_body_a     // Full Body rotación A
  full_body_b     // Full Body rotación B
  upper
  lower
  push
  pull
  legs
  complementary

  @@map("workout_day_type")
}

/// Categoría biomecánica del ejercicio (clasificación de calistenia)
enum ExerciseCategory {
  push      // Flexiones, fondos, press
  pull      // Dominadas, remos, curls
  squat     // Sentadillas, pistol squat
  hinge     // Hip hinge, nordic curl
  core      // Plancha, hollow body, L-sit
  carry     // Farmer carry, loaded movement

  @@map("exercise_category")
}

/// Grupos musculares principales
enum MuscleGroup {
  chest
  back
  shoulders
  biceps
  triceps
  core
  glutes
  quads
  hamstrings
  calves
  full_body

  @@map("muscle_group")
}

/// Tipo de comida para el diario nutricional
enum MealType {
  breakfast
  lunch
  dinner
  snack
  pre_workout
  post_workout

  @@map("meal_type")
}

/// Fuente de los datos del alimento
/// FD-Sección-9: foods.source requerido para trazabilidad
enum FoodSource {
  usda         // API de USDA FoodData Central
  local        // Base curada local (500 alimentos — fallback USDA caída)
  user_custom  // Creado por el usuario (v2.0 scope — campo reservado)

  @@map("food_source")
}

/// Rol del mensaje en la conversación con CALI
enum AiRole {
  user
  assistant
  system

  @@map("ai_role")
}

/// Plataforma de salud integrada
/// FD-08: Datos importados en v1.0: pasos, peso, sueño
/// FD-ARCH-06: Sync asíncrono via BullMQ — nunca síncrono al abrir app
enum HealthPlatform {
  healthkit       // Apple Health (iOS)
  health_connect  // Google Health Connect (Android)

  @@map("health_platform")
}

/// Tipo de notificación push
/// FD-DB-10: Required para deep linking
enum NotificationType {
  workout_reminder
  hydration_alert
  streak_reminder
  nutrition_reminder
  stagnation_alert   // FD-02: alerta informativa de estancamiento
  premium_upsell

  @@map("notification_type")
}

/// Estado de la suscripción RevenueCat
/// FD-DB-08: Sincronizado via webhook
enum SubscriptionStatus {
  trial      // Trial gratuito 7 días (FD-Sección-10)
  active
  expired
  cancelled
  paused

  @@map("subscription_status")
}

/// Plan de suscripción Premium
/// FD-Sección-10: $9.99/mes | $59.99/año
enum SubscriptionPlan {
  premium_monthly  // $9.99 USD/mes
  premium_annual   // $59.99 USD/año ($4.99/mes efectivo)

  @@map("subscription_plan")
}

/// Operaciones soportadas en modo offline
/// FD-DB-09: Lista canónica de operaciones offline
enum SyncOperation {
  create
  update
  delete

  @@map("sync_operation")
}

/// Endpoints que soportan operaciones offline
/// FD-DB-09: Operaciones que SÍ soportan offline
enum SyncEndpoint {
  workout_sessions
  workout_logs
  food_diary
  water_logs

  @@map("sync_endpoint")
}

/// Estado de sincronización de un item en la cola offline
enum SyncStatus {
  pending
  processing
  synced
  failed

  @@map("sync_status")
}

/// Nivel de presentación para la UI del usuario
/// FD-01: Nivel DERIVADO en runtime desde global_score.
/// Umbral de mapeo:
///   0–54   → beginner
///   55–74  → intermediate
///   75–100 → advanced
/// NUNCA usado como fuente de verdad de nivel; solo para snapshot histórico
enum PresentationLevel {
  beginner
  intermediate
  advanced

  @@map("presentation_level")
}

// =============================================================================
// ─── MODELO: USERS ────────────────────────────────────────────────────────────
// =============================================================================

/// Usuario principal de la plataforma.
///
/// CAMPOS ELIMINADOS POR FD-DB-01:
///   - goal (VARCHAR)           → ver tabla goals, status = 'active'
///   - current_weight_kg        → ver body_measurements, MAX(created_at)
///   - experience_level (VARCHAR) → derivado en runtime desde user_assessments.global_score
///
/// CAMPO NUEVO: onboarding_step — State machine (FD-ARCH-07)
///   Pasos: 0=inicio, 1=nombre, 2=nacimiento+sexo, 3=biométricos+unidades,
///          4=objetivo, 5=frecuencia, 6=evaluación, 7=completado
///
/// SOFT DELETE: deleted_at (FD-SEC-01 GDPR)
///   Hard delete en cascada a los 30 días via BullMQ job.
///   El backend filtra WHERE deleted_at IS NULL en toda query.
///
/// RLS POLICY (ver prisma/sql/02_rls_policies.sql):
///   CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid());
///   CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid());
model User {
  // ── Identidad ──────────────────────────────────────────────────────────────
  id                 String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email              String         @unique @db.VarChar(255)
  /// NULL cuando el usuario se registra con OAuth (Google)
  passwordHash       String?        @map("password_hash") @db.VarChar(255)
  firstName          String         @map("first_name") @db.VarChar(100)
  lastName           String?        @map("last_name") @db.VarChar(100)

  // ── Biométricos base (requeridos para Mifflin-St Jeor — FD-05) ─────────────
  birthDate          DateTime       @map("birth_date") @db.Date
  sex                Sex
  /// Altura en centímetros. Inmutable tras onboarding salvo edición manual.
  heightCm           Int            @map("height_cm")
  /// Peso objetivo del usuario. NULL si objetivo = mantenimiento.
  targetWeightKg     Decimal?       @map("target_weight_kg") @db.Decimal(5, 2)

  // ── Configuración de entrenamiento ─────────────────────────────────────────
  /// Días de entrenamiento por semana (0–7).
  /// FD-05: Mapeado automáticamente al factor de actividad TDEE en runtime:
  ///   0     → 1.2  (sedentario)
  ///   1–2   → 1.375
  ///   3–4   → 1.55  (target principal CALI-NUTRI)
  ///   5–6   → 1.725
  ///   doble → 1.9
  /// EL FACTOR NUNCA SE ALMACENA — se deriva siempre en runtime.
  trainingFrequency  Int            @default(3) @map("training_frequency")
  unitPreference     UnitPreference @default(metric) @map("unit_preference")

  // ── Estado de Onboarding (FD-ARCH-07 — State Machine) ──────────────────────
  /// Paso actual en el onboarding (0–7). Permite reanudar si el usuario abandona.
  /// Al reabrir: si onboarding_complete=false → navegar a onboarding_step.
  onboardingStep     Int            @default(0) @map("onboarding_step")
  onboardingComplete Boolean        @default(false) @map("onboarding_complete")

  // ── Tier y Monetización ────────────────────────────────────────────────────
  /// Tier de suscripción. Sincronizado con RevenueCat via webhook en < 30s.
  /// FD-Sección-10: 'free' tiene límites; 'premium' desbloquea todo.
  tier               UserTier       @default(free)

  // ── Gamificación v1.0 ──────────────────────────────────────────────────────
  /// Racha de días activos consecutivos. Actualizado en cada registro de actividad.
  /// Disponible en free y premium (FD-Sección-10).
  streakDays         Int            @default(0) @map("streak_days")
  /// Última fecha en que el usuario registró actividad (para calcular racha).
  lastActiveDate     DateTime?      @map("last_active_date") @db.Date

  // ── OAuth / Integraciones ──────────────────────────────────────────────────
  /// Google OAuth subject ID. UNIQUE — un Google account = un usuario.
  googleId           String?        @unique @map("google_id") @db.VarChar(255)
  /// URL del avatar en CloudFront CDN (S3 bucket). NULL = avatar por defecto.
  avatarUrl          String?        @map("avatar_url") @db.VarChar(512)

  // ── Timestamps & Soft Delete ───────────────────────────────────────────────
  createdAt          DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime       @updatedAt @map("updated_at") @db.Timestamptz
  /// FD-SEC-01 GDPR: Marca el inicio del período de gracia de 30 días.
  /// Hard delete ejecutado por BullMQ job: WHERE deleted_at < NOW() - INTERVAL '30 days'
  deletedAt          DateTime?      @map("deleted_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  bodyMeasurements   BodyMeasurement[]
  goals              Goal[]
  trainingPrograms   TrainingProgram[]
  workoutSessions    WorkoutSession[]
  foodDiaryEntries   FoodDiaryEntry[]
  waterLogs          WaterLog[]
  healthData         HealthData[]
  aiConversations    AiConversation[]
  userAssessments    UserAssessment[]
  /// Exactamente 1 subscription por usuario (0 si nunca activó trial)
  subscription       Subscription?
  notificationLogs   NotificationLog[]
  syncQueueItems     SyncQueueItem[]

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([email])
  @@index([googleId])
  @@index([tier])
  /// Para queries que filtran usuarios borrados (soft delete)
  @@index([deletedAt])
  /// FD-Sección-9: Índice parcial — usuarios con onboarding incompleto
  /// NOTA: El índice parcial WHERE onboarding_complete=FALSE se crea en raw SQL migration
  @@index([onboardingComplete], map: "idx_users_onboarding_incomplete")
  @@map("users")
}

// =============================================================================
// ─── MODELO: USER_ASSESSMENTS ─────────────────────────────────────────────────
// =============================================================================

/// Evaluación de movimientos del usuario.
/// NUEVA tabla — requerida por FD-DB-05 / FD-01 (arquitectura de dos capas).
///
/// FD-01: La app registra repeticiones brutas → el backend calcula fitness_score (0–100).
/// El nivel de presentación (beginner/intermediate/advanced) se DERIVA en runtime
/// desde global_score usando los umbrales canónicos. NUNCA se almacena como fuente única.
///
/// Tabla de puntuación canónica para Dominadas:
///   0 reps → 0 pts | 1-3 → 10-25 | 4-7 → 30-50 | 8-12 → 55-70 | 13-20 → 75-90 | 20+ → 95-100
///
/// Pesos del score global:
///   Dominadas 40% + Flexiones 30% + Sentadillas 15% + Core 15%
///
/// Solo 1 evaluación activa por usuario. Las anteriores se conservan para historial.
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model UserAssessment {
  id                String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String            @map("user_id") @db.Uuid

  /// Timestamp de la evaluación. Múltiples evaluaciones a lo largo del tiempo.
  assessedAt        DateTime          @default(now()) @map("assessed_at") @db.Timestamptz

  // ── Repeticiones brutas registradas por el usuario ─────────────────────────
  pullupsMax        Int               @default(0) @map("pullups_max")
  pushupsMax        Int               @default(0) @map("pushups_max")
  squatsMax         Int               @default(0) @map("squats_max")
  dipsMax           Int               @default(0) @map("dips_max")
  /// Segundos de plancha máximos
  plankSeconds      Int               @default(0) @map("plank_seconds")

  // ── Puntuaciones calculadas por TrainingEngine en backend (0–100) ──────────
  /// Calculado según tabla canónica FD-01 para Dominadas
  pullupsScore      Decimal           @default(0) @map("pullups_score") @db.Decimal(5, 2)
  /// Calculado según tabla canónica FD-01 para Flexiones
  pushupsScore      Decimal           @default(0) @map("pushups_score") @db.Decimal(5, 2)
  squatsScore       Decimal           @default(0) @map("squats_score") @db.Decimal(5, 2)
  coreScore         Decimal           @default(0) @map("core_score") @db.Decimal(5, 2)

  // ── Score global ponderado ─────────────────────────────────────────────────
  /// global_score = (pullups*0.40) + (pushups*0.30) + (squats*0.15) + (core*0.15)
  /// Umbrales de presentationLevel: 0-54=beginner, 55-74=intermediate, 75-100=advanced
  globalScore       Decimal           @default(0) @map("global_score") @db.Decimal(5, 2)

  /// Snapshot del nivel en el momento de la evaluación.
  /// NOTA: Este campo es solo histórico. El nivel operativo se DERIVA en runtime
  /// desde globalScore. La fuente de verdad del nivel nunca es un string almacenado.
  presentationLevel PresentationLevel @default(beginner) @map("presentation_level")

  /// TRUE = evaluación vigente que el sistema usa para asignar rutinas.
  /// Solo 1 isActive=TRUE por usuario. El backend lo gestiona en la capa de servicio.
  isActive          Boolean           @default(true) @map("is_active")

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  /// Para obtener la evaluación activa del usuario eficientemente
  @@index([userId, isActive])
  @@index([userId, assessedAt(sort: Desc)])
  @@map("user_assessments")
}

// =============================================================================
// ─── MODELO: BODY_MEASUREMENTS ────────────────────────────────────────────────
// =============================================================================

/// Histórico de medidas corporales del usuario.
///
/// FD-DB-01: FUENTE CANÓNICA del peso actual.
///   Peso actual = SELECT weight_kg FROM body_measurements
///                 WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
///
/// La función PostgreSQL get_user_profile(user_id) centraliza esta lógica.
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model BodyMeasurement {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String    @map("user_id") @db.Uuid

  // ── Medidas (todas opcionales — registro parcial permitido) ────────────────
  weightKg        Decimal?  @map("weight_kg") @db.Decimal(5, 2)
  waistCm         Decimal?  @map("waist_cm") @db.Decimal(5, 2)
  neckCm          Decimal?  @map("neck_cm") @db.Decimal(5, 2)
  hipCm           Decimal?  @map("hip_cm") @db.Decimal(5, 2)
  bodyFatPercent  Decimal?  @map("body_fat_percent") @db.Decimal(5, 2)
  leanMassKg      Decimal?  @map("lean_mass_kg") @db.Decimal(5, 2)
  /// BMI calculado en backend: weight_kg / (height_m)^2
  bmi             Decimal?  @db.Decimal(5, 2)
  /// Trazabilidad: cómo se registró el peso
  source          String?   @db.VarChar(50) // 'manual' | 'healthkit' | 'health_connect'

  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  /// Para obtener peso actual = MAX(created_at) eficientemente
  @@index([userId, createdAt(sort: Desc)])
  @@map("body_measurements")
}

// =============================================================================
// ─── MODELO: GOALS ────────────────────────────────────────────────────────────
// =============================================================================

/// Objetivos del usuario — historial completo y fuente canónica del objetivo activo.
///
/// FD-DB-01: Reemplaza el campo eliminado users.goal
///   Objetivo activo = SELECT * FROM goals WHERE user_id=? AND status='active' LIMIT 1
///
/// Regla de negocio: Solo 1 goal con status='active' por usuario.
///   Enforced en la capa de aplicación (GoalsService.setActiveGoal).
///
/// Macro targets almacenados al crear el goal (calculados por MacroCalculator engine).
/// Si el usuario cambia el objetivo, los targets se recalculan para el nuevo goal.
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model Goal {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String      @map("user_id") @db.Uuid

  goalType        GoalType    @map("goal_type")
  startDate       DateTime    @map("start_date") @db.Date
  targetDate      DateTime?   @map("target_date") @db.Date
  /// Meta de peso asociada al objetivo (opcional)
  targetWeightKg  Decimal?    @map("target_weight_kg") @db.Decimal(5, 2)
  status          GoalStatus  @default(active)

  // ── Macro Targets (calculados con Mifflin-St Jeor + FD-05 + FD-06) ────────
  /// TDEE ± ajuste calórico según FD-06
  targetCalories  Int?        @map("target_calories")
  /// FD-06: Proteína 2.0 g/kg por defecto (rango 1.8–2.4 g/kg)
  targetProteinG  Decimal?    @map("target_protein_g") @db.Decimal(6, 2)
  /// FD-06: Carbohidratos = calorías residuales tras proteína y grasas
  targetCarbsG    Decimal?    @map("target_carbs_g") @db.Decimal(6, 2)
  /// FD-06: Grasas 0.8–1.0 g/kg (mínimo absoluto: 0.6 g/kg)
  targetFatG      Decimal?    @map("target_fat_g") @db.Decimal(6, 2)
  /// TDEE base calculado (para mostrar en UI y para ajuste automático FD-09)
  tdee            Int?

  createdAt       DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  trainingPrograms TrainingProgram[]

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  /// FD-Sección-9: Para obtener el objetivo activo eficientemente
  /// Índice parcial WHERE status='active' creado en raw SQL migration
  @@index([userId, status], map: "idx_goals_user_status")
  @@map("goals")
}

// =============================================================================
// ─── MODELO: TRAINING_PROGRAMS ────────────────────────────────────────────────
// =============================================================================

/// Programas de entrenamiento generados por el motor de IA.
///
/// FD-02: Campos de detección pasiva de estancamiento:
///   stagnationAlert: TRUE cuando se detecta estancamiento (3 semanas sin mejora)
///   stagnationDetectedAt: Timestamp de detección
///   ACCIÓN: Solo alerta informativa en v1.0. Sin modificación automática del programa.
///
/// FD-03: weeklyFrequency + structure determinan la plantilla de días generada:
///   3 días → full_body (A/B/A rotación)
///   4 días → upper_lower
///   5 días → push_pull_legs
///   6 días → ppl_double (solo si globalScore ≥ 80)
///
/// Límite free: 1 programa activo. Premium: ilimitados. (FD-Sección-10)
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model TrainingProgram {
  id                   String                @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId               String                @map("user_id") @db.Uuid
  /// Goal asociado al crear el programa (para trazabilidad de objetivo → rutina)
  goalId               String?               @map("goal_id") @db.Uuid

  name                 String                @db.VarChar(255)
  weeklyFrequency      Int                   @map("weekly_frequency")
  structure            TrainingStructure

  startDate            DateTime              @map("start_date") @db.Date
  endDate              DateTime?             @map("end_date") @db.Date
  status               TrainingProgramStatus @default(active)

  // ── Detección pasiva de estancamiento (FD-02) ──────────────────────────────
  /// TRUE cuando StagnationDetectorEngine detecta estancamiento:
  ///   - Sin mejora durante 3 semanas consecutivas (≥2 sesiones/semana), O
  ///   - Reducción de rendimiento durante 2 semanas consecutivas
  stagnationAlert      Boolean               @default(false) @map("stagnation_alert")
  stagnationDetectedAt DateTime?             @map("stagnation_detected_at") @db.Timestamptz

  /// Snapshot del nivel para el que se generó el programa.
  /// Permite detectar si el programa ya no es apropiado para el nivel actual del usuario.
  generatedForLevel    PresentationLevel     @map("generated_for_level")

  createdAt            DateTime              @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime              @updatedAt @map("updated_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user                 User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal                 Goal?                 @relation(fields: [goalId], references: [id], onDelete: SetNull)
  workoutDays          WorkoutDay[]
  workoutSessions      WorkoutSession[]

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  @@index([userId, status])
  @@map("training_programs")
}

// =============================================================================
// ─── MODELO: WORKOUT_DAYS ─────────────────────────────────────────────────────
// =============================================================================

/// Días programados dentro de un programa de entrenamiento.
/// Cada día tiene un tipo (Push, Pull, Upper, etc.) y un set de ejercicios.
///
/// RLS POLICY (acceso indirecto via training_programs):
///   USING (EXISTS (SELECT 1 FROM training_programs tp WHERE tp.id = program_id AND tp.user_id = auth.uid()))
model WorkoutDay {
  id               String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  programId        String          @map("program_id") @db.Uuid

  /// Nombre descriptivo del día: 'Full Body A', 'Upper Body', 'Push Day'
  dayName          String          @map("day_name") @db.VarChar(100)
  dayType          WorkoutDayType  @map("day_type")
  /// Orden dentro del ciclo semanal (1-6). Determina el día de la semana asignado.
  dayOrder         Int             @map("day_order")

  createdAt        DateTime        @default(now()) @map("created_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  program          TrainingProgram  @relation(fields: [programId], references: [id], onDelete: Cascade)
  workoutExercises WorkoutExercise[]
  workoutSessions  WorkoutSession[]

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([programId])
  @@map("workout_days")
}

// =============================================================================
// ─── MODELO: EXERCISES ────────────────────────────────────────────────────────
// =============================================================================

/// Catálogo maestro de ejercicios de calistenia.
/// Administrado por el sistema (no por usuarios en v1.0).
/// Seed inicial: 50+ ejercicios en prisma/seed/data/exercises.json
///
/// Árbol de progresiones: parentExerciseId define el ejercicio del que es variante más difícil.
///   Ejemplo: Flexión rodillas → Flexión estándar → Archer pushup → Pike pushup
///
/// FD-04: Al alcanzar tope de reps para el rango de nivel → escalar a variante más difícil
///         (que es un Exercise con parentExerciseId = ejercicio_actual)
///
/// RLS POLICY (tabla pública de lectura):
///   FOR SELECT USING (true)  -- Todos los usuarios autenticados pueden leer
///   FOR INSERT/UPDATE/DELETE — Solo service_role (administrador)
model Exercise {
  id               String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  name             String           @db.VarChar(255)
  nameEs           String?          @map("name_es") @db.VarChar(255)
  category         ExerciseCategory
  primaryMuscle    MuscleGroup      @map("primary_muscle")
  /// Array de grupos musculares secundarios trabajados
  secondaryMuscles MuscleGroup[]    @map("secondary_muscles")

  /// Dificultad relativa 1–10 dentro del catálogo de calistenia
  difficulty       Int
  description      String?          @db.Text
  instructions     String?          @db.Text

  // ── Árbol de progresiones ──────────────────────────────────────────────────
  /// Ejercicio del que es variante más difícil (NULL = ejercicio base de la cadena)
  /// FD-04: RoutineGenerator usa este árbol para escalar cuando el usuario domina el ejercicio actual
  parentExerciseId String?          @map("parent_exercise_id") @db.Uuid

  // ── Assets visuales (CloudFront CDN — FD-SCALE-03) ────────────────────────
  imageUrl         String?          @map("image_url") @db.VarChar(512)
  videoUrl         String?          @map("video_url") @db.VarChar(512)

  isActive         Boolean          @default(true) @map("is_active")
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  parentExercise   Exercise?        @relation("ExerciseProgressions", fields: [parentExerciseId], references: [id])
  progressions     Exercise[]       @relation("ExerciseProgressions")
  workoutExercises WorkoutExercise[]
  workoutLogs      WorkoutLog[]

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([category])
  @@index([primaryMuscle])
  @@index([parentExerciseId])
  @@index([isActive])
  @@map("exercises")
}

// =============================================================================
// ─── MODELO: WORKOUT_EXERCISES ────────────────────────────────────────────────
// =============================================================================

/// Ejercicios asignados a un día de entrenamiento con sus parámetros de prescripción.
///
/// FD-04: Regla de generación de series y progresión:
///   trabajo_objetivo = floor(max_reps * 0.70)
///   sets = 4 (default)
///   repsTarget = trabajo_objetivo
///   Si trabajo_objetivo < 3 → usar variante regresiva (parentExercise)
///
/// FD-04: RPE objetivo por goal (targetRpe):
///   Hipertrofia     → 7–9
///   Pérdida grasa   → 6–8
///   Rendimiento     → 7–8
///   Recomposición   → 7–8
///
/// RLS POLICY (acceso indirecto via workout_days → training_programs):
///   USING (EXISTS (SELECT 1 FROM workout_days wd
///                 JOIN training_programs tp ON wd.program_id = tp.id
///                 WHERE wd.id = workout_day_id AND tp.user_id = auth.uid()))
model WorkoutExercise {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workoutDayId   String    @map("workout_day_id") @db.Uuid
  exerciseId     String    @map("exercise_id") @db.Uuid

  /// Orden de ejecución dentro del día (1 = primer ejercicio)
  exerciseOrder  Int       @map("exercise_order")
  sets           Int       @default(4)
  /// FD-04: floor(maxReps * 0.70) — punto medio del rango 60–80% del máximo
  repsTarget     Int       @map("reps_target")
  restSeconds    Int       @default(90) @map("rest_seconds")
  /// FD-04: RPE prescrito según objetivo del usuario (1 decimal: e.g. 7.5)
  targetRpe      Decimal?  @map("target_rpe") @db.Decimal(3, 1)
  notes          String?   @db.Text

  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  workoutDay     WorkoutDay @relation(fields: [workoutDayId], references: [id], onDelete: Cascade)
  /// RESTRICT: No eliminar ejercicio del catálogo si tiene prescripciones activas
  exercise       Exercise   @relation(fields: [exerciseId], references: [id], onDelete: Restrict)

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([workoutDayId])
  @@index([exerciseId])
  @@map("workout_exercises")
}

// =============================================================================
// ─── MODELO: WORKOUT_SESSIONS ─────────────────────────────────────────────────
// =============================================================================

/// Entrenamientos ejecutados por el usuario (instancias de días programados).
///
/// FD-02: subjectiveFatigue (1–10) es señal conversacional para CALI.
///         NO modifica el programa automáticamente en v1.0.
///
/// Soporta sesiones offline: isOfflineSync = TRUE indica que fue registrado
/// sin conexión y sincronizado posteriormente (FD-DB-09).
///
/// FD-Sección-10 (límite free): historial 30 días. Premium: ilimitado.
///   Enforced en AnalyticsService al filtrar por fecha.
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model WorkoutSession {
  id               String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId           String           @map("user_id") @db.Uuid
  /// NULL en sesiones libres (no vinculadas a un programa)
  programId        String?          @map("program_id") @db.Uuid
  /// NULL en sesiones libres
  workoutDayId     String?          @map("workout_day_id") @db.Uuid

  startedAt        DateTime         @map("started_at") @db.Timestamptz
  finishedAt       DateTime?        @map("finished_at") @db.Timestamptz
  durationMinutes  Int?             @map("duration_minutes")

  /// FD-02: Fatiga subjetiva reportada por el usuario (1–10).
  /// Señal para CALI en el chat. Sin efecto automático en v1.0.
  subjectiveFatigue Int?            @map("subjective_fatigue")
  notes            String?          @db.Text

  /// TRUE si la sesión fue registrada offline y sincronizada posteriormente
  isOfflineSync    Boolean          @default(false) @map("is_offline_sync")

  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime         @updatedAt @map("updated_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  program          TrainingProgram? @relation(fields: [programId], references: [id], onDelete: SetNull)
  workoutDay       WorkoutDay?      @relation(fields: [workoutDayId], references: [id], onDelete: SetNull)
  workoutLogs      WorkoutLog[]

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  /// FD-Sección-9: Para contexto de IA (últimas 10 sesiones) y analítica
  @@index([userId, startedAt(sort: Desc)], map: "idx_workout_sessions_recent")
  @@index([programId])
  @@map("workout_sessions")
}

// =============================================================================
// ─── MODELO: WORKOUT_LOGS ─────────────────────────────────────────────────────
// =============================================================================

/// Registro granular de cada serie ejecutada durante una sesión.
///
/// FD-04: ProgressionEngine evalúa estos registros:
///   SI 100% de series completadas en 2 semanas consecutivas → +1 rep/serie
///   SI alcanza tope del rango para su nivel → escalar a variante más difícil
///
/// Los records personales se calculan desde esta tabla en runtime (no se almacenan).
///
/// RLS POLICY (acceso indirecto via workout_sessions):
///   USING (EXISTS (SELECT 1 FROM workout_sessions ws
///                 WHERE ws.id = session_id AND ws.user_id = auth.uid()))
model WorkoutLog {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId      String        @map("session_id") @db.Uuid
  exerciseId     String        @map("exercise_id") @db.Uuid

  setNumber      Int           @map("set_number")
  repsCompleted  Int           @map("reps_completed")
  /// RPE reportado post-serie (1–10). NULL si el usuario no lo registra.
  rpe            Int?
  notes          String?       @db.Text

  createdAt      DateTime      @default(now()) @map("created_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  session        WorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  /// RESTRICT: No eliminar ejercicio del catálogo si tiene logs históricos
  exercise       Exercise       @relation(fields: [exerciseId], references: [id], onDelete: Restrict)

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([sessionId])
  @@index([exerciseId])
  @@map("workout_logs")
}

// =============================================================================
// ─── MODELO: FOODS ────────────────────────────────────────────────────────────
// =============================================================================

/// Base de datos nutricional. Catálogo global (no por usuario).
/// Fuentes: USDA FoodData Central + base local curada de 500 alimentos.
///
/// FD-Sección-9: Agregar source + externalId para trazabilidad y deduplicación.
///
/// Base local curada (500 alimentos): Fallback cuando USDA API está caída.
///   isVerified=TRUE + source='local' identifica estos alimentos.
///
/// Búsqueda fuzzy (< 500ms requerido en criterios de lanzamiento):
///   GIN index con pg_trgm en name + nameEs (creado en raw SQL migration)
///   Unaccent aplicado para búsqueda sin importar acentos (español)
///
/// RLS POLICY (tabla pública de lectura):
///   FOR SELECT USING (true)
///   FOR INSERT/UPDATE/DELETE → Solo service_role
model Food {
  id                 String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  name               String     @db.VarChar(500)
  nameEs             String?    @map("name_es") @db.VarChar(500)
  source             FoodSource @default(usda)
  /// ID externo de la fuente (USDA: fdc_id). UNIQUE por fuente para deduplication.
  externalId         String?    @map("external_id") @db.VarChar(100)
  brand              String?    @db.VarChar(255)

  // ── Valores nutricionales por porción ─────────────────────────────────────
  servingSizeG       Decimal    @map("serving_size_g") @db.Decimal(8, 2)
  /// Descripción legible de la porción: '1 taza cocida', '100g', '1 unidad'
  servingDescription String?    @map("serving_description") @db.VarChar(255)
  calories           Decimal    @db.Decimal(8, 2)
  proteinG           Decimal    @map("protein_g") @db.Decimal(8, 2)
  carbsG             Decimal    @map("carbs_g") @db.Decimal(8, 2)
  fatG               Decimal    @map("fat_g") @db.Decimal(8, 2)
  fiberG             Decimal?   @map("fiber_g") @db.Decimal(8, 2)
  sugarG             Decimal?   @map("sugar_g") @db.Decimal(8, 2)
  sodiumMg           Decimal?   @map("sodium_mg") @db.Decimal(8, 2)

  /// TRUE = alimento de la base local curada (fallback USDA)
  isVerified         Boolean    @default(false) @map("is_verified")
  isActive           Boolean    @default(true) @map("is_active")

  createdAt          DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime   @updatedAt @map("updated_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  foodDiaryEntries   FoodDiaryEntry[]

  // ── Constraints ────────────────────────────────────────────────────────────
  /// Evita duplicados del mismo alimento de la misma fuente
  @@unique([source, externalId], map: "uniq_foods_source_external_id")

  // ── Índices ────────────────────────────────────────────────────────────────
  /// Índice base para búsqueda por nombre (GIN trigram creado en raw SQL migration)
  @@index([name], map: "idx_foods_name")
  @@index([source])
  /// Para filtrar base local curada rápidamente en el fallback de USDA caída
  @@index([isVerified, isActive], map: "idx_foods_verified_active")
  @@map("foods")
}

// =============================================================================
// ─── MODELO: FOOD_DIARY_ENTRY ─────────────────────────────────────────────────
// =============================================================================

/// Diario nutricional del usuario — registro de cada alimento consumido.
///
/// ⚠️  NOTA ARQUITECTÓNICA CRÍTICA (FD-DB-04 — DESNORMALIZACIÓN INTENCIONAL):
///   Los campos calories, protein_g, carbs_g, fat_g son DESNORMALIZADOS.
///   Se calculan al insertar: (food.campo / food.serving_size_g) × quantity_g
///   y se almacenan como valores INDEPENDIENTES de la tabla foods.
///
///   RAZÓN: Los datos USDA pueden actualizarse. Si un alimento cambia su
///   composición nutricional, el HISTORIAL del usuario NO debe cambiar
///   retroactivamente. Los macros registrados representan la realidad
///   nutricional EN EL MOMENTO DEL REGISTRO.
///
///   NUNCA recalcular macros históricos desde foods.* — esto es un BUG.
///
/// FD-Sección-10: Historial free = 30 días. Premium = ilimitado.
///
/// FD-ARCH-03: Contexto IA = últimos 14 días (FoodDiaryRepository filtra por fecha)
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model FoodDiaryEntry {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  foodId        String    @map("food_id") @db.Uuid

  quantityG     Decimal   @map("quantity_g") @db.Decimal(8, 2)
  mealType      MealType  @map("meal_type")

  // ── Macros desnormalizados (FD-DB-04 — VER NOTA ARQUITECTÓNICA ARRIBA) ─────
  /// Calculado al insertar: (food.calories / food.serving_size_g) × quantity_g
  calories      Decimal   @db.Decimal(8, 2)
  proteinG      Decimal   @map("protein_g") @db.Decimal(8, 2)
  carbsG        Decimal   @map("carbs_g") @db.Decimal(8, 2)
  fatG          Decimal   @map("fat_g") @db.Decimal(8, 2)

  consumedAt    DateTime  @map("consumed_at") @db.Timestamptz
  /// TRUE si fue registrado offline y sincronizado posteriormente
  isOfflineSync Boolean   @default(false) @map("is_offline_sync")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  /// RESTRICT: No eliminar alimento del catálogo si tiene entradas en el historial
  food          Food      @relation(fields: [foodId], references: [id], onDelete: Restrict)

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  /// FD-Sección-9: Para contexto IA (últimos 14 días) y analítica nutricional
  @@index([userId, consumedAt(sort: Desc)], map: "idx_food_diary_date")
  @@index([userId, mealType])
  @@map("food_diary")
}

// =============================================================================
// ─── MODELO: WATER_LOGS ───────────────────────────────────────────────────────
// =============================================================================

/// Registro de ingesta de agua del usuario.
///
/// FD-DB-02: La tabla water_targets FUE ELIMINADA.
///   El objetivo diario se calcula en runtime en HydrationService:
///     objetivo_base_ml = peso_kg × 40
///     + ajuste_entrenamiento: +500 ml (normal) | +750 ml (alta intensidad)
///     + ajuste_pasos: +250 ml si pasos > 10.000
///   Cacheado en Redis: hydration:target:{uid}:{date} TTL 6h
///
/// FD-07: Opciones de registro rápido en UI: 250 | 500 | 750 | 1000 ml | personalizado
///
/// FD-07: Recordatorios automáticos:
///   < 30% a las 12:00 → notificación
///   < 60% a las 18:00 → notificación
///   < 80% a las 20:00 → notificación (última del día)
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model WaterLog {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String    @map("user_id") @db.Uuid

  /// FD-07: Valores típicos: 250, 500, 750, 1000 ml. Personalizado: cualquier entero positivo.
  amountMl      Int       @map("amount_ml")
  /// TRUE si fue registrado offline y sincronizado posteriormente
  isOfflineSync Boolean   @default(false) @map("is_offline_sync")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  @@index([userId, createdAt(sort: Desc)])
  @@map("water_logs")
}

// =============================================================================
// ─── MODELO: HEALTH_DATA ──────────────────────────────────────────────────────
// =============================================================================

/// Datos importados desde Apple Health (HealthKit) o Google Health Connect.
///
/// FD-08: Lista canónica de datos importados en v1.0:
///   ✅ steps        — pasos diarios
///   ✅ weight_kg    — último peso registrado en la plataforma de salud
///   ✅ sleep_minutes — minutos de sueño (solo lectura pasiva — no acciona cambios v1.0)
///   ❌ heart_rate_avg — ELIMINADO de v1.0 (diferido a v2.0)
///   ❌ active_calories — diferido a v1.1
///
/// FD-ARCH-06: Sync ASÍNCRONO via BullMQ — NUNCA síncrono al abrir la app.
///   Flujo: app → POST /health/sync (background) → BullMQ job → worker → DB
///
/// Deduplicación: UNIQUE(userId, platform, dataDate)
///   Si ya existe registro para ese día y plataforma → UPDATE (upsert)
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model HealthData {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String         @map("user_id") @db.Uuid

  platform       HealthPlatform
  /// Fecha a la que corresponden los datos (puede diferir del importedAt si es sync retroactivo)
  dataDate       DateTime       @map("data_date") @db.Date

  // ── Datos importados v1.0 ─────────────────────────────────────────────────
  steps          Int?
  weightKg       Decimal?       @map("weight_kg") @db.Decimal(5, 2)
  /// FD-08: Solo lectura pasiva. No acciona cambios en programa en v1.0.
  sleepMinutes   Int?           @map("sleep_minutes")
  /// Diferido a v1.1 (campo reservado, siempre NULL en v1.0)
  activeCalories Decimal?       @map("active_calories") @db.Decimal(8, 2)
  /// heart_rate_avg ELIMINADO (FD-08) — diferido a v2.0

  importedAt     DateTime       @default(now()) @map("imported_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ── Constraints ────────────────────────────────────────────────────────────
  /// Una entrada por usuario × plataforma × día — enforce deduplication en upsert
  @@unique([userId, platform, dataDate], map: "uniq_health_data_user_platform_date")

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  /// FD-Sección-9: Para invalidación de caché de hidratación y daily_summary_mv
  @@index([userId, importedAt(sort: Desc)], map: "idx_health_data_date")
  @@map("health_data")
}

// =============================================================================
// ─── MODELO: AI_CONVERSATIONS ─────────────────────────────────────────────────
// =============================================================================

/// Conversaciones del usuario con CALI (coach IA).
///
/// FD-ARCH-05: Un único AIModule transversal gestiona todas las conversaciones.
///   El módulo tiene acceso simultáneo al contexto de Training, Nutrition e Hydration.
///
/// FD-ARCH-03: Ventana de contexto fija — solo los últimos 20 mensajes
///   de esta conversación se envían a Claude API.
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model AiConversation {
  id        String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String      @map("user_id") @db.Uuid

  /// Título auto-generado del primer mensaje del usuario (primeras 60 chars)
  title     String?     @db.VarChar(255)
  isActive  Boolean     @default(true) @map("is_active")

  createdAt DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  AiMessage[]

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  @@index([userId, isActive, updatedAt(sort: Desc)])
  @@map("ai_conversations")
}

// =============================================================================
// ─── MODELO: AI_MESSAGES ──────────────────────────────────────────────────────
// =============================================================================

/// Mensajes de la conversación con CALI.
///
/// ⚠️  FD-DB-06 — ENCRIPTACIÓN OBLIGATORIA:
///   El campo `content` almacena texto ENCRIPTADO con AES-256-GCM (base64).
///   La clave maestra se gestiona en AWS KMS (NO en variables de entorno).
///   La desencriptación ocurre en EncryptionService ANTES de enviar al cliente.
///   Las búsquedas full-text sobre content NO son posibles (dato encriptado).
///   Para analítica: usar metadatos no encriptados (timestamps, tool_calls, tokens_used).
///
/// FD-DB-07: Campos adicionales requeridos:
///   content_iv   — IV (Initialization Vector) para AES-GCM. Único por mensaje.
///   tokens_used  — Para control de costos de Claude API
///   tool_calls   — Acciones ejecutadas por CALI (JSONB)
///   latency_ms   — Para monitoreo SLA (p95 < 6 segundos — FD-ARCH-03)
///
/// FD-ARCH-04: Rate limit enforced en Redis:
///   Free: 10 mensajes/día | Premium: 100 mensajes/día
///   key: rate:ai:{userId}:{date} TTL 24h
///
/// RLS POLICY (acceso indirecto via ai_conversations):
///   USING (EXISTS (SELECT 1 FROM ai_conversations ac
///                 WHERE ac.id = conversation_id AND ac.user_id = auth.uid()))
model AiMessage {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  conversationId String         @map("conversation_id") @db.Uuid

  role           AiRole

  /// ⚠️  ENCRIPTADO AES-256-GCM — almacenado como base64.
  /// NO leer sin EncryptionService.decrypt(content, contentIv, userId).
  /// Clave derivada por usuario: KDF(userId + masterKey_de_KMS).
  content        String         @db.Text
  /// IV único para este mensaje. Requerido para desencriptar content.
  contentIv      String         @map("content_iv") @db.VarChar(100)

  /// Tokens consumidos en esta llamada a Claude API (input + output).
  /// Para control de costos y alertas de gasto.
  tokensUsed     Int?           @map("tokens_used")

  /// JSONB: Tool calls ejecutadas por CALI en este mensaje.
  /// Estructura: [{ tool: 'log_food', args: {...}, result: {...}, status: 'success' | 'partial_success' | 'failed' }]
  /// FD-ARCH-05: Tool calls v1.0: log_food, log_water, log_workout_set,
  ///             get_daily_summary, calculate_meal, complete_workout_session
  toolCalls      Json?          @map("tool_calls")

  /// Latencia de respuesta de Claude API en milisegundos.
  /// Para monitoreo SLA: p50 < 3s, p95 < 6s (FD-ARCH-03)
  latencyMs      Int?           @map("latency_ms")

  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([conversationId])
  /// FD-ARCH-03: Para construir ventana de contexto (últimos 20 mensajes)
  @@index([conversationId, createdAt(sort: Desc)])
  @@map("ai_messages")
}

// =============================================================================
// ─── MODELO: SUBSCRIPTIONS ────────────────────────────────────────────────────
// =============================================================================

/// Suscripciones Premium — integración con RevenueCat.
/// NUEVA tabla (FD-DB-08) — requerida para la monetización.
///
/// Exactamente 1 subscription por usuario (@@unique userId).
///   La subscription se crea con status='trial' al completar onboarding.
///   El webhook de RevenueCat actualiza el status y sincroniza users.tier.
///
/// FD-Sección-10: Planes:
///   premium_monthly: $9.99 USD/mes
///   premium_annual:  $59.99 USD/año ($4.99/mes — 50% de ahorro)
///   Trial gratuito:  7 días Premium para todos los usuarios nuevos
///
/// Criterio de lanzamiento (FD-Sección-12):
///   RevenueCat webhook: cambio de tier reflejado en < 30s tras pago.
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model Subscription {
  id                 String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId             String              @unique @map("user_id") @db.Uuid
  /// ID de usuario en RevenueCat (puede diferir del Supabase user_id)
  revenuecatUserId   String              @unique @map("revenuecat_user_id") @db.VarChar(255)

  planId             SubscriptionPlan?   @map("plan_id")
  status             SubscriptionStatus  @default(trial)

  currentPeriodStart DateTime?           @map("current_period_start") @db.Timestamptz
  currentPeriodEnd   DateTime?           @map("current_period_end") @db.Timestamptz
  trialEnd           DateTime?           @map("trial_end") @db.Timestamptz
  /// TRUE = la suscripción no se renovará al final del período actual
  cancelAtPeriodEnd  Boolean             @default(false) @map("cancel_at_period_end")

  createdAt          DateTime            @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime            @updatedAt @map("updated_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ── Índices ────────────────────────────────────────────────────────────────
  /// FD-Sección-9: Para verificar estado de suscripción en PremiumGuard
  @@index([userId, status], map: "idx_subscriptions_status")
  @@index([revenuecatUserId])
  @@map("subscriptions")
}

// =============================================================================
// ─── MODELO: NOTIFICATION_LOGS ────────────────────────────────────────────────
// =============================================================================

/// Log de notificaciones push enviadas al usuario.
/// NUEVA tabla (FD-DB-10) — requerida para deep linking y analítica de engagement.
///
/// Criterio de lanzamiento (FD-Sección-12):
///   Deep linking: notificación de recordatorio de entrenamiento debe
///   abrir la pantalla de entrenamiento directamente.
///   Deep link scheme: cali://training | cali://nutrition | cali://hydration
///
/// openedAt NULL = notificación no abierta. openedAt SET = usuario tocó la notificación.
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model NotificationLog {
  id        String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String           @map("user_id") @db.Uuid

  type      NotificationType
  /// URL scheme para navegación directa: 'cali://training', 'cali://nutrition/log'
  deepLink  String?          @map("deep_link") @db.VarChar(255)

  sentAt    DateTime         @default(now()) @map("sent_at") @db.Timestamptz
  openedAt  DateTime?        @map("opened_at") @db.Timestamptz
  platform  String?          @db.VarChar(20) // 'ios' | 'android'

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId])
  @@index([userId, type, sentAt(sort: Desc)])
  @@map("notification_logs")
}

// =============================================================================
// ─── MODELO: SYNC_QUEUE_ITEMS ─────────────────────────────────────────────────
// =============================================================================

/// Cola de sincronización para soporte de modo offline.
/// NUEVA tabla (FD-DB-09) — bloqueante para MVP (criterio de lanzamiento FD-Sección-12).
///
/// Arquitectura de dos niveles:
///   1. Cola PRIMARIA: en el dispositivo (MMKV/SQLite con React Native)
///      → El usuario registra sin conexión (entrenamiento, comida, agua)
///      → Los datos se almacenan localmente con un UUID único generado en cliente
///
///   2. Esta tabla: IDEMPOTENCY + AUDITORÍA en el backend
///      → Al recuperar conexión: app envía POST /sync/offline-queue
///      → Backend verifica si el id (UUID de cliente) ya fue procesado
///      → Si NO existe: procesa y crea el registro en la tabla correspondiente
///      → Si YA existe: retorna 200 sin duplicar (idempotencia)
///
/// Operaciones soportadas offline (FD-DB-09):
///   ✅ POST /workout/sessions (y POST /workout/logs)
///   ✅ POST /food/diary
///   ✅ POST /hydration/logs
///   ✅ PATCH /workout/sessions/:id (finalizar sesión)
///
/// RLS POLICY:
///   USING (user_id = auth.uid())
model SyncQueueItem {
  /// UUID generado en el CLIENTE (actúa como clave de idempotencia)
  id              String        @id @db.Uuid
  userId          String        @map("user_id") @db.Uuid

  operation       SyncOperation
  endpoint        SyncEndpoint
  /// Payload completo de la operación en el formato del endpoint de destino
  payload         Json

  status          SyncStatus    @default(pending)
  retryCount      Int           @default(0) @map("retry_count")

  /// Timestamp registrado en el DISPOSITIVO (para ordenar operaciones correctamente)
  clientCreatedAt DateTime      @map("client_created_at") @db.Timestamptz
  syncedAt        DateTime?     @map("synced_at") @db.Timestamptz
  /// Mensaje de error si status = 'failed'
  errorMessage    String?       @map("error_message") @db.Text

  createdAt       DateTime      @default(now()) @map("created_at") @db.Timestamptz

  // ── Relaciones ─────────────────────────────────────────────────────────────
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ── Índices ────────────────────────────────────────────────────────────────
  @@index([userId, status])
  /// Para procesar en orden cronológico del dispositivo (integridad causal)
  @@index([userId, clientCreatedAt])
  @@map("sync_queue_items")
}

// =============================================================================
// ─── VISTA MATERIALIZADA: DAILY_SUMMARY_MV ────────────────────────────────────
// =============================================================================
//
// FD-DB-03: DAILY_SUMMARY implementada como Vista Materializada PostgreSQL.
//   ❌ NO es una tabla Prisma — NO se escribe directamente desde el backend.
//   ✅ DDL completo: prisma/sql/01_materialized_views.sql
//   ✅ Refresh: BullMQ job 'refresh-mv' cada 30 min (CONCURRENTLY — no bloquea lecturas)
//
// USO en backend:
//   DashboardModule.getTodaySummary()  → tablas FUENTE (tiempo real)
//   AnalyticsModule.getHistory()       → daily_summary_mv (analítica histórica)
//
// Para acceso tipado desde Prisma, declarada como view en la migration:
//   Ver prisma/sql/01_materialized_views.sql

/// Vista materializada de resumen diario.
/// Solo lectura. Refrescada cada 30 minutos via BullMQ.
/// DDL gestionado via raw SQL (ver prisma/sql/01_materialized_views.sql)
view DailySummary {
  userId           String   @map("user_id") @db.Uuid
  date             DateTime @db.Date
  caloriesConsumed Decimal  @map("calories_consumed") @db.Decimal(10, 2)
  proteinConsumed  Decimal  @map("protein_consumed") @db.Decimal(10, 2)
  carbsConsumed    Decimal  @map("carbs_consumed") @db.Decimal(10, 2)
  fatConsumed      Decimal  @map("fat_consumed") @db.Decimal(10, 2)
  waterConsumedMl  Int      @map("water_consumed_ml")
  steps            Int

  @@unique([userId, date])
  @@map("daily_summary_mv")
}
