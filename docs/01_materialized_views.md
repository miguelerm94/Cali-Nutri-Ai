-- =============================================================================
-- CALI-NUTRI AI — 01_materialized_views.sql
-- =============================================================================
-- FD-DB-03: daily_summary como Vista Materializada PostgreSQL
-- Ejecutar después de prisma migrate deploy
-- Motor: PostgreSQL 15+ (Supabase)
-- =============================================================================

-- Habilitar extensiones requeridas (si no están activadas por Supabase)
CREATE EXTENSION IF NOT EXISTS pg_trgm   SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent  SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto  SCHEMA extensions;

-- =============================================================================
-- VISTA MATERIALIZADA: daily_summary_mv
-- FD-DB-03: Refresh cada 30 min via BullMQ (CONCURRENTLY — no bloquea lecturas)
-- =============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_summary_mv AS
SELECT
  fd.user_id,
  DATE(fd.consumed_at AT TIME ZONE 'UTC')      AS date,
  COALESCE(SUM(fd.calories), 0)::DECIMAL(10,2) AS calories_consumed,
  COALESCE(SUM(fd.protein_g), 0)::DECIMAL(10,2) AS protein_consumed,
  COALESCE(SUM(fd.carbs_g), 0)::DECIMAL(10,2)  AS carbs_consumed,
  COALESCE(SUM(fd.fat_g), 0)::DECIMAL(10,2)    AS fat_consumed,
  COALESCE((
    SELECT SUM(wl.amount_ml)
    FROM water_logs wl
    WHERE wl.user_id = fd.user_id
      AND DATE(wl.created_at AT TIME ZONE 'UTC') = DATE(fd.consumed_at AT TIME ZONE 'UTC')
  ), 0)::INTEGER AS water_consumed_ml,
  COALESCE((
    SELECT hd.steps
    FROM health_data hd
    WHERE hd.user_id = fd.user_id
      AND hd.data_date = DATE(fd.consumed_at AT TIME ZONE 'UTC')
    ORDER BY hd.imported_at DESC
    LIMIT 1
  ), 0)::INTEGER AS steps
FROM food_diary fd
GROUP BY
  fd.user_id,
  DATE(fd.consumed_at AT TIME ZONE 'UTC');

-- Índice único requerido para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_summary_mv_user_date
  ON daily_summary_mv (user_id, date);

-- Índice para analítica histórica (rango de fechas por usuario)
CREATE INDEX IF NOT EXISTS idx_daily_summary_mv_user_date_range
  ON daily_summary_mv (user_id, date DESC);

COMMENT ON MATERIALIZED VIEW daily_summary_mv IS
  'FD-DB-03: Resumen nutricional diario agregado. '
  'Refresh: BullMQ job cada 30 min (CONCURRENTLY). '
  'Dashboard de hoy → NO usar esta vista (leer tablas fuente). '
  'Analítica histórica → SÍ usar esta vista.';

-- =============================================================================
-- ÍNDICES PARCIALES (no soportados directamente en schema.prisma)
-- =============================================================================

-- FD-Sección-9: usuarios con onboarding incompleto (para onboarding state machine)
CREATE INDEX IF NOT EXISTS idx_users_onboarding_incomplete
  ON users (id)
  WHERE onboarding_complete = FALSE;

-- FD-Sección-9: goals activos únicamente
CREATE INDEX IF NOT EXISTS idx_goals_active
  ON goals (user_id, status)
  WHERE status = 'active';

-- Para training programs activos (frecuente en dashboard)
CREATE INDEX IF NOT EXISTS idx_training_programs_active
  ON training_programs (user_id, status)
  WHERE status = 'active';

-- Para user assessments activos (nivel del usuario)
CREATE INDEX IF NOT EXISTS idx_user_assessments_active
  ON user_assessments (user_id, is_active)
  WHERE is_active = TRUE;

-- Para subscriptions activas y en trial (PremiumGuard)
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
  ON subscriptions (user_id, status)
  WHERE status IN ('active', 'trial');

-- Para usuarios NO borrados (soft delete — filtro más frecuente del sistema)
CREATE INDEX IF NOT EXISTS idx_users_not_deleted
  ON users (id, email)
  WHERE deleted_at IS NULL;

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
    to_tsvector('spanish', extensions.unaccent(name))
  );

-- =============================================================================
-- FUNCIÓN AUXILIAR: get_user_profile
-- FD-DB-01: Centraliza la lógica de campos derivados (current_weight, active_goal)
-- Usada por UsersRepository para GET /users/me
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS TABLE (
  user_id          UUID,
  current_weight   DECIMAL(5,2),
  current_goal     TEXT,
  global_score     DECIMAL(5,2),
  presentation_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id                                               AS user_id,
    -- FD-DB-01: Peso actual = último registro en body_measurements
    (SELECT bm.weight_kg
     FROM body_measurements bm
     WHERE bm.user_id = u.id
     ORDER BY bm.created_at DESC
     LIMIT 1)                                          AS current_weight,
    -- FD-DB-01: Objetivo activo = GOALS WHERE status='active'
    (SELECT g.goal_type::TEXT
     FROM goals g
     WHERE g.user_id = u.id AND g.status = 'active'
     LIMIT 1)                                          AS current_goal,
    -- FD-01: Score desde la evaluación activa
    (SELECT ua.global_score
     FROM user_assessments ua
     WHERE ua.user_id = u.id AND ua.is_active = TRUE
     LIMIT 1)                                          AS global_score,
    -- FD-01: Nivel derivado en runtime (no almacenado como fuente de verdad)
    CASE
      WHEN (SELECT ua.global_score FROM user_assessments ua
            WHERE ua.user_id = u.id AND ua.is_active = TRUE LIMIT 1) >= 75
        THEN 'advanced'
      WHEN (SELECT ua.global_score FROM user_assessments ua
            WHERE ua.user_id = u.id AND ua.is_active = TRUE LIMIT 1) >= 55
        THEN 'intermediate'
      ELSE 'beginner'
    END                                                AS presentation_level
  FROM users u
  WHERE u.id = p_user_id
    AND u.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_profile(UUID) IS
  'FD-DB-01: Retorna campos derivados del perfil de usuario. '
  'Usar en UsersRepository.getProfile() como alternativa a múltiples JOINs.';
