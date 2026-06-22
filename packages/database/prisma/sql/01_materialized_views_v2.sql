-- =============================================================================
-- CALI-NUTRI AI — 01_materialized_views.sql
-- =============================================================================
-- Versión:       2.0.0
-- Fuente:        FinalDecisions.md v1.0 · Auditoría DB v1.0
-- Motor:         PostgreSQL 15+ (Supabase)
-- Ejecutar:      DESPUÉS de prisma migrate deploy
--                ANTES de 02_rls_policies.sql
-- =============================================================================
--
-- CORRECCIONES APLICADAS:
--
--   FIX-01 · idx_users_onboarding_incomplete: Índice PARCIAL conservado aquí.
--            El schema.prisma usa "idx_users_onboarding_status" (nombre distinto)
--            para el índice regular de Prisma. Sin conflicto de nombres.
--
--   FIX-03 · daily_summary_mv: Reescrita con CTE activity_dates como base.
--            ANTES: FROM food_diary (excluía días sin food_diary entries)
--            AHORA: UNION food_diary + water_logs + health_data como base.
--            Incluye días donde el usuario SOLO registró agua o pasos.
--
--   FIX-04 · Nuevos UNIQUE PARTIAL INDEXES:
--            - idx_goals_one_active_per_user: solo 1 goal activo por usuario
--            - idx_user_assessments_one_active_per_user: solo 1 assessment activo
--
--   FIX-06 · get_user_profile(): Refactorizada con CTEs.
--            ANTES: subquery user_assessments ejecutada 3 veces en misma función.
--            AHORA: CTE active_assessment materializada 1 sola vez.
--
--   FIX-07 · Nuevo índice idx_workout_sessions_program_date para StagnationDetectorEngine.
--
-- =============================================================================

-- Habilitar extensiones requeridas (idempotentes — IF NOT EXISTS)
CREATE EXTENSION IF NOT EXISTS pg_trgm   SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent  SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto  SCHEMA extensions;

-- extensions.unaccent() es STABLE, no IMMUTABLE, y por eso Postgres rechaza
-- su uso directo en una expresión de índice. Wrapper IMMUTABLE requerido.
CREATE OR REPLACE FUNCTION extensions.f_unaccent(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  STRICT
AS $$
  SELECT extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- =============================================================================
-- VISTA MATERIALIZADA: daily_summary_mv
-- FD-DB-03: Refresh cada 30 min via BullMQ (CONCURRENTLY — no bloquea lecturas)
--
-- FIX-03: Reescrita con CTE activity_dates como tabla base.
--   Problema anterior: FROM food_diary → solo días con entradas de comida.
--   Solución: UNION de todas las fuentes de actividad para capturar días con
--   solo agua o solo pasos (sin comida registrada).
--
-- Uso:
--   DashboardModule.getTodaySummary() → NO usar esta MV (tablas fuente en tiempo real)
--   AnalyticsModule.getHistory()      → SÍ usar esta MV (analítica histórica)
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS daily_summary_mv;

CREATE MATERIALIZED VIEW daily_summary_mv AS
WITH activity_dates AS (
  -- ─────────────────────────────────────────────────────────────────────────
  -- Base de días con actividad: unión de TODAS las fuentes.
  -- Garantiza que un día con solo agua (sin comida) aparece en la MV.
  -- ─────────────────────────────────────────────────────────────────────────
  SELECT user_id, DATE(consumed_at  AT TIME ZONE 'UTC') AS date FROM food_diary
  UNION
  SELECT user_id, DATE(created_at   AT TIME ZONE 'UTC') AS date FROM water_logs
  UNION
  SELECT user_id, data_date                             AS date FROM health_data
)
SELECT
  ad.user_id,
  ad.date,

  -- ── Macros nutricionales (suma de food_diary del día) ──────────────────
  COALESCE(SUM(fd.calories),  0)::DECIMAL(10,2) AS calories_consumed,
  COALESCE(SUM(fd.protein_g), 0)::DECIMAL(10,2) AS protein_consumed,
  COALESCE(SUM(fd.carbs_g),   0)::DECIMAL(10,2) AS carbs_consumed,
  COALESCE(SUM(fd.fat_g),     0)::DECIMAL(10,2) AS fat_consumed,

  -- ── Hidratación (suma de water_logs del día) ───────────────────────────
  COALESCE(SUM(wl.amount_ml), 0)::INTEGER        AS water_consumed_ml,

  -- ── Pasos (último registro de health_data del día) ──────────────────────
  COALESCE((
    SELECT hd.steps
    FROM   health_data hd
    WHERE  hd.user_id  = ad.user_id
      AND  hd.data_date = ad.date
    ORDER  BY hd.imported_at DESC
    LIMIT  1
  ), 0)::INTEGER AS steps

FROM activity_dates ad

-- LEFT JOIN food_diary: días sin food diary quedan con COALESCE→0
LEFT JOIN food_diary fd
  ON  fd.user_id = ad.user_id
  AND DATE(fd.consumed_at AT TIME ZONE 'UTC') = ad.date

-- LEFT JOIN water_logs: días sin agua quedan con COALESCE→0
LEFT JOIN water_logs wl
  ON  wl.user_id = ad.user_id
  AND DATE(wl.created_at AT TIME ZONE 'UTC') = ad.date

GROUP BY
  ad.user_id,
  ad.date;

-- Índice único REQUERIDO para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_summary_mv_user_date
  ON daily_summary_mv (user_id, date);

-- Índice para analítica histórica (rango de fechas por usuario)
CREATE INDEX IF NOT EXISTS idx_daily_summary_mv_user_date_range
  ON daily_summary_mv (user_id, date DESC);

COMMENT ON MATERIALIZED VIEW daily_summary_mv IS
  'FD-DB-03 v2.0: Resumen diario agregado de nutrición, hidratación y pasos. '
  'FIX-03: Incluye días con solo agua o pasos (sin food diary). '
  'Refresh: BullMQ job cada 30 min (CONCURRENTLY). '
  'RLS habilitado: policy en 02_rls_policies.sql. '
  'Dashboard de hoy → NO usar esta vista (leer tablas fuente). '
  'Analítica histórica (semanas/meses pasados) → SÍ usar esta vista.';

-- =============================================================================
-- ÍNDICES PARCIALES — No soportados directamente en schema.prisma
-- =============================================================================

-- FIX-01: Índice parcial para onboarding incompleto.
-- NOMBRE DISTINTO al índice Prisma "idx_users_onboarding_status" (FIX-01).
-- Este es el índice OPTIMIZADO: filtra solo incompletos (caso más frecuente).
CREATE INDEX IF NOT EXISTS idx_users_onboarding_incomplete
  ON users (id)
  WHERE onboarding_complete = FALSE;

COMMENT ON INDEX idx_users_onboarding_incomplete IS
  'FIX-01: Índice parcial para usuarios con onboarding incompleto. '
  'Nombre distinto a idx_users_onboarding_status (índice Prisma regular). '
  'Usado en: onboarding state machine recovery al re-abrir la app.';

-- Para usuarios NO borrados (soft delete — filtro más frecuente del sistema)
CREATE INDEX IF NOT EXISTS idx_users_not_deleted
  ON users (id, email)
  WHERE deleted_at IS NULL;

-- FD-Sección-9: goals activos únicamente
CREATE INDEX IF NOT EXISTS idx_goals_active
  ON goals (user_id, status)
  WHERE status = 'active';

-- Para training programs activos (frecuente en dashboard y PremiumGuard)
CREATE INDEX IF NOT EXISTS idx_training_programs_active
  ON training_programs (user_id, status)
  WHERE status = 'active';

-- Para user assessments activos (nivel del usuario en el sistema)
CREATE INDEX IF NOT EXISTS idx_user_assessments_active
  ON user_assessments (user_id, is_active)
  WHERE is_active = TRUE;

-- Para subscriptions activas y en trial (PremiumGuard — hot path)
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
  ON subscriptions (user_id, status)
  WHERE status IN ('active', 'trial');

-- =============================================================================
-- FIX-04: UNIQUE PARTIAL INDEXES para unicidad activa garantizada en DB
-- =============================================================================
-- Complementan la lógica de aplicación (GoalsService, AssessmentService).
-- Previenen race conditions y bugs de sincronización que solo la app-layer no puede.

-- Un solo goal activo por usuario en todo momento
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_one_active_per_user
  ON goals (user_id)
  WHERE status = 'active';

COMMENT ON INDEX idx_goals_one_active_per_user IS
  'FIX-04: Garantiza en DB que solo existe 1 goal activo por usuario. '
  'Previene race conditions y duplicidad si GoalsService falla. '
  'GoalsService.setActiveGoal() debe desactivar el anterior antes del INSERT.';

-- Un solo assessment activo por usuario en todo momento
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_assessments_one_active_per_user
  ON user_assessments (user_id)
  WHERE is_active = TRUE;

COMMENT ON INDEX idx_user_assessments_one_active_per_user IS
  'FIX-04: Garantiza en DB que solo existe 1 assessment activo por usuario. '
  'Previene múltiples assessments activos si AssessmentService falla. '
  'AssessmentService.completeAssessment() debe desactivar el anterior antes del INSERT.';

-- =============================================================================
-- ÍNDICES GIN PARA BÚSQUEDA FUZZY DE ALIMENTOS (pg_trgm)
-- FD-Criterio de lanzamiento: USDA búsqueda < 500ms
-- =============================================================================

-- Trigram en nombre inglés (USDA)
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm
  ON foods USING GIN (name extensions.gin_trgm_ops);

-- Trigram en nombre español (base curada local)
CREATE INDEX IF NOT EXISTS idx_foods_name_es_trgm
  ON foods USING GIN (name_es extensions.gin_trgm_ops)
  WHERE name_es IS NOT NULL;

-- Full-text search en español (fallback para búsqueda semántica básica)
CREATE INDEX IF NOT EXISTS idx_foods_name_fts_es
  ON foods USING GIN (
    to_tsvector('spanish', extensions.f_unaccent(name))
  );

-- =============================================================================
-- FIX-07: ÍNDICE PARA STAGNATIONDETECTORENGINE
-- FD-02: Consultas de estancamiento por programa en ventana de 3 semanas
-- =============================================================================
-- El StagnationDetectorEngine consulta:
--   WHERE program_id = ? AND started_at > NOW() - INTERVAL '21 days'
--   AND finished_at IS NOT NULL
-- Sin este índice: seq scan sobre idx_training_programs_active (ineficiente).
-- Con este índice: index scan directo por programa + fecha.

CREATE INDEX IF NOT EXISTS idx_workout_sessions_program_date
  ON workout_sessions (program_id, started_at DESC)
  WHERE finished_at IS NOT NULL;

COMMENT ON INDEX idx_workout_sessions_program_date IS
  'FIX-07: Para StagnationDetectorEngine (FD-02). '
  'Consulta sesiones completadas por programa en ventana de 21 días. '
  'WHERE finished_at IS NOT NULL filtra sesiones incompletas.';

-- =============================================================================
-- FIX-06: FUNCIÓN get_user_profile — Refactorizada con CTEs
-- FD-DB-01: Centraliza campos derivados (current_weight, active_goal, level)
-- Antes: subquery user_assessments ejecutada 3 veces en la misma llamada.
-- Ahora: CTE active_assessment materializada 1 vez — 3x menos seeks en índice.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS TABLE (
  user_id            UUID,
  current_weight     DECIMAL(5,2),
  current_goal       TEXT,
  global_score       DECIMAL(5,2),
  presentation_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH
    -- FD-DB-01: Peso actual = último registro en body_measurements
    latest_weight AS (
      SELECT bm.weight_kg
      FROM   body_measurements bm
      WHERE  bm.user_id = p_user_id
      ORDER  BY bm.created_at DESC
      LIMIT  1
    ),

    -- FD-DB-01: Objetivo activo = GOALS WHERE status='active'
    -- idx_goals_one_active_per_user garantiza exactamente 1 fila
    active_goal AS (
      SELECT g.goal_type::TEXT AS goal_type
      FROM   goals g
      WHERE  g.user_id = p_user_id
        AND  g.status  = 'active'
      LIMIT  1
    ),

    -- FD-01: Evaluación activa del usuario para nivel y score
    -- idx_user_assessments_one_active_per_user garantiza exactamente 1 fila
    -- FIX-06: Esta subquery se ejecuta 1 sola vez (antes: 3 veces)
    active_assessment AS (
      SELECT ua.global_score
      FROM   user_assessments ua
      WHERE  ua.user_id  = p_user_id
        AND  ua.is_active = TRUE
      LIMIT  1
    )

  SELECT
    u.id                                              AS user_id,
    (SELECT lw.weight_kg  FROM latest_weight lw)      AS current_weight,
    (SELECT ag.goal_type  FROM active_goal ag)         AS current_goal,
    (SELECT aa.global_score FROM active_assessment aa) AS global_score,

    -- FD-01: Nivel de presentación derivado en runtime (umbrales canónicos)
    -- FIX-06: Reutiliza la CTE en vez de 2 subqueries adicionales
    CASE
      WHEN (SELECT aa.global_score FROM active_assessment aa) >= 75
        THEN 'advanced'
      WHEN (SELECT aa.global_score FROM active_assessment aa) >= 55
        THEN 'intermediate'
      ELSE
        'beginner'
    END AS presentation_level

  FROM users u
  WHERE u.id         = p_user_id
    AND u.deleted_at IS NULL;

END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_profile(UUID) IS
  'FD-DB-01 v2.0: Retorna campos derivados del perfil de usuario. '
  'FIX-06: Refactorizada con CTEs — subquery UA ejecutada 1 vez (antes: 3). '
  'STABLE: PostgreSQL puede cachear el resultado dentro de la transacción. '
  'SECURITY DEFINER: Ejecuta con privilegios del creador (service_role). '
  'Usada en UsersRepository.getProfile() para GET /users/me.';

-- =============================================================================
-- VERIFICACIÓN POST-SETUP
-- =============================================================================
--
-- SELECT matviewname, matviewowner
-- FROM pg_matviews WHERE matviewname = 'daily_summary_mv';
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('users','goals','user_assessments','workout_sessions','foods')
--   AND schemaname = 'public'
-- ORDER BY tablename, indexname;
--
-- SELECT proname FROM pg_proc WHERE proname = 'get_user_profile';
--
-- =============================================================================
