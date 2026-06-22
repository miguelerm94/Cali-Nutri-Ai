-- =============================================================================
-- CALI-NUTRI AI — 03_check_constraints.sql
-- =============================================================================
-- Versión:       2.0.0
-- Fuente:        FinalDecisions.md v1.0 · Auditoría DB v1.0 · FIX-05
-- Motor:         PostgreSQL 15+ (Supabase)
-- Ejecutar:      DESPUÉS de 02_rls_policies.sql
-- =============================================================================
--
-- PROPÓSITO:
--   Prisma 5.x no soporta CHECK constraints nativamente en schema.prisma.
--   Este archivo implementa validaciones de rango y lógica de negocio a nivel
--   de base de datos — tercera línea de defensa tras cliente y backend NestJS.
--
-- IDEMPOTENCIA: PostgreSQL no soporta "ADD CONSTRAINT IF NOT EXISTS" (no es
-- sintaxis válida). Cada constraint se envuelve en DO $$ ... $$ que verifica
-- pg_constraint antes de agregarlo. Seguro de ejecutar N veces.
--
-- =============================================================================

-- =============================================================================
-- TABLA: users
-- =============================================================================

-- FD-05: training_frequency determina el factor de actividad TDEE (0–7 días/semana)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_training_frequency') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_training_frequency CHECK (training_frequency BETWEEN 0 AND 7);
  END IF;
END $$;

-- FD-ARCH-07: Onboarding state machine tiene 8 pasos (0-7)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_onboarding_step') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_onboarding_step CHECK (onboarding_step BETWEEN 0 AND 7);
  END IF;
END $$;

-- Racha de días no puede ser negativa
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_streak_days') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_streak_days CHECK (streak_days >= 0);
  END IF;
END $$;

-- Altura: rango humano realista 50–272 cm
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_height_cm') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_height_cm CHECK (height_cm BETWEEN 50 AND 272);
  END IF;
END $$;

-- Peso objetivo: rango realista 20–500 kg
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_target_weight_kg') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_target_weight_kg CHECK (target_weight_kg IS NULL OR target_weight_kg BETWEEN 20 AND 500);
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_users_training_frequency ON users IS
  'FD-05: Factor TDEE derivado de 0–7 días/semana. '
  'Fuera de rango = TDEE calculado con factor inválido.';

COMMENT ON CONSTRAINT chk_users_onboarding_step ON users IS
  'FD-ARCH-07: 8 pasos de onboarding (0=inicio, 7=completado). '
  'Fuera de rango = estado inválido que bloquearía la app.';

-- =============================================================================
-- TABLA: user_assessments
-- =============================================================================

-- FD-01: Scores individuales por movimiento (0–100)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_assessments_pullups_score') THEN
    ALTER TABLE user_assessments ADD CONSTRAINT chk_user_assessments_pullups_score CHECK (pullups_score BETWEEN 0 AND 100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_assessments_pushups_score') THEN
    ALTER TABLE user_assessments ADD CONSTRAINT chk_user_assessments_pushups_score CHECK (pushups_score BETWEEN 0 AND 100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_assessments_squats_score') THEN
    ALTER TABLE user_assessments ADD CONSTRAINT chk_user_assessments_squats_score CHECK (squats_score BETWEEN 0 AND 100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_assessments_core_score') THEN
    ALTER TABLE user_assessments ADD CONSTRAINT chk_user_assessments_core_score CHECK (core_score BETWEEN 0 AND 100);
  END IF;
END $$;

-- FD-01: Score global ponderado (0–100)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_assessments_global_score') THEN
    ALTER TABLE user_assessments ADD CONSTRAINT chk_user_assessments_global_score CHECK (global_score BETWEEN 0 AND 100);
  END IF;
END $$;

-- Repeticiones brutas no pueden ser negativas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_assessments_reps_non_negative') THEN
    ALTER TABLE user_assessments ADD CONSTRAINT chk_user_assessments_reps_non_negative CHECK (
      pullups_max   >= 0 AND
      pushups_max   >= 0 AND
      squats_max    >= 0 AND
      dips_max      >= 0 AND
      plank_seconds >= 0
    );
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_user_assessments_global_score ON user_assessments IS
  'FD-01: 0-54=beginner | 55-74=intermediate | 75-100=advanced. '
  'Fuera de rango = nivel de presentación incorrecto y rutina inapropiada.';

-- =============================================================================
-- TABLA: body_measurements
-- =============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_body_measurements_weight_kg') THEN
    ALTER TABLE body_measurements ADD CONSTRAINT chk_body_measurements_weight_kg CHECK (weight_kg IS NULL OR weight_kg BETWEEN 1 AND 700);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_body_measurements_waist_cm') THEN
    ALTER TABLE body_measurements ADD CONSTRAINT chk_body_measurements_waist_cm CHECK (waist_cm IS NULL OR waist_cm BETWEEN 20 AND 300);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_body_measurements_neck_cm') THEN
    ALTER TABLE body_measurements ADD CONSTRAINT chk_body_measurements_neck_cm CHECK (neck_cm IS NULL OR neck_cm BETWEEN 20 AND 80);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_body_measurements_hip_cm') THEN
    ALTER TABLE body_measurements ADD CONSTRAINT chk_body_measurements_hip_cm CHECK (hip_cm IS NULL OR hip_cm BETWEEN 30 AND 300);
  END IF;
END $$;

-- Rango fisiológico humano: 3% (élite) a 70% (obesidad severa)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_body_measurements_body_fat_percent') THEN
    ALTER TABLE body_measurements ADD CONSTRAINT chk_body_measurements_body_fat_percent CHECK (body_fat_percent IS NULL OR body_fat_percent BETWEEN 3 AND 70);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_body_measurements_bmi') THEN
    ALTER TABLE body_measurements ADD CONSTRAINT chk_body_measurements_bmi CHECK (bmi IS NULL OR bmi BETWEEN 8 AND 80);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_body_measurements_lean_mass') THEN
    ALTER TABLE body_measurements ADD CONSTRAINT chk_body_measurements_lean_mass CHECK (lean_mass_kg IS NULL OR lean_mass_kg > 0);
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_body_measurements_body_fat_percent ON body_measurements IS
  '3% (élite competición) a 70% (obesidad severa). '
  'Fuera de rango = cálculo de composición corporal inválido.';

-- =============================================================================
-- TABLA: exercises
-- =============================================================================

-- FD-04: Escala 1–10 del catálogo de calistenia
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_exercises_difficulty') THEN
    ALTER TABLE exercises ADD CONSTRAINT chk_exercises_difficulty CHECK (difficulty BETWEEN 1 AND 10);
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_exercises_difficulty ON exercises IS
  'FD-04: 1=básico (rodillas) a 10=élite (planche press). '
  'Fuera de rango = árbol de progresiones ordenado incorrectamente.';

-- =============================================================================
-- TABLA: workout_exercises
-- =============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_exercises_sets') THEN
    ALTER TABLE workout_exercises ADD CONSTRAINT chk_workout_exercises_sets CHECK (sets >= 1);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_exercises_reps_target') THEN
    ALTER TABLE workout_exercises ADD CONSTRAINT chk_workout_exercises_reps_target CHECK (reps_target >= 1);
  END IF;
END $$;

-- Descanso: 10 segundos mínimo, 30 minutos máximo
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_exercises_rest_seconds') THEN
    ALTER TABLE workout_exercises ADD CONSTRAINT chk_workout_exercises_rest_seconds CHECK (rest_seconds BETWEEN 10 AND 1800);
  END IF;
END $$;

-- RPE prescrito: escala 1.0–10.0
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_exercises_target_rpe') THEN
    ALTER TABLE workout_exercises ADD CONSTRAINT chk_workout_exercises_target_rpe CHECK (target_rpe IS NULL OR target_rpe BETWEEN 1.0 AND 10.0);
  END IF;
END $$;

-- =============================================================================
-- TABLA: workout_sessions
-- =============================================================================

-- FD-02: Fatiga subjetiva 1–10 (señal conversacional para CALI)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_sessions_subjective_fatigue') THEN
    ALTER TABLE workout_sessions ADD CONSTRAINT chk_workout_sessions_subjective_fatigue CHECK (subjective_fatigue IS NULL OR subjective_fatigue BETWEEN 1 AND 10);
  END IF;
END $$;

-- Duración: 1 minuto mínimo, 8 horas máximo
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_sessions_duration_minutes') THEN
    ALTER TABLE workout_sessions ADD CONSTRAINT chk_workout_sessions_duration_minutes CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 1 AND 480);
  END IF;
END $$;

-- Integridad temporal: sesión no puede terminar antes de empezar
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_sessions_finished_after_started') THEN
    ALTER TABLE workout_sessions ADD CONSTRAINT chk_workout_sessions_finished_after_started CHECK (finished_at IS NULL OR finished_at >= started_at);
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_workout_sessions_subjective_fatigue ON workout_sessions IS
  'FD-02: 1=sin fatiga, 10=agotamiento. Señal para CALI. '
  'Fuera de rango = señal ininterpretable en contexto del coach IA.';

-- =============================================================================
-- TABLA: workout_logs
-- =============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_logs_set_number') THEN
    ALTER TABLE workout_logs ADD CONSTRAINT chk_workout_logs_set_number CHECK (set_number >= 1);
  END IF;
END $$;

-- 0 = serie fallida (registro válido)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_logs_reps_completed') THEN
    ALTER TABLE workout_logs ADD CONSTRAINT chk_workout_logs_reps_completed CHECK (reps_completed >= 0);
  END IF;
END $$;

-- RPE reportado post-serie: 1–10
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_workout_logs_rpe') THEN
    ALTER TABLE workout_logs ADD CONSTRAINT chk_workout_logs_rpe CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10);
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_workout_logs_rpe ON workout_logs IS
  'FD-04: 1=muy fácil, 10=máximo esfuerzo. '
  'ProgressionEngine usa RPE para ajustar reps en la siguiente sesión.';

-- =============================================================================
-- TABLA: food_diary
-- =============================================================================

-- Cantidad: positiva
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_food_diary_quantity_g') THEN
    ALTER TABLE food_diary ADD CONSTRAINT chk_food_diary_quantity_g CHECK (quantity_g > 0);
  END IF;
END $$;

-- Macros desnormalizados: no negativos (FD-DB-04)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_food_diary_macros_non_negative') THEN
    ALTER TABLE food_diary ADD CONSTRAINT chk_food_diary_macros_non_negative CHECK (
      calories  >= 0 AND
      protein_g >= 0 AND
      carbs_g   >= 0 AND
      fat_g     >= 0
    );
  END IF;
END $$;

-- Calorías por registro: límite de 10.000 kcal
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_food_diary_calories_reasonable') THEN
    ALTER TABLE food_diary ADD CONSTRAINT chk_food_diary_calories_reasonable CHECK (calories <= 10000);
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_food_diary_macros_non_negative ON food_diary IS
  'FD-DB-04: Macros desnormalizados al momento del registro. '
  'Negativo = bug en cálculo de desnormalización en FoodDiaryService.';

-- =============================================================================
-- TABLA: water_logs
-- =============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_water_logs_amount_ml') THEN
    ALTER TABLE water_logs ADD CONSTRAINT chk_water_logs_amount_ml CHECK (amount_ml > 0);
  END IF;
END $$;

-- Límite: 5 litros por entrada (protege contra errores tipográficos)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_water_logs_amount_ml_max') THEN
    ALTER TABLE water_logs ADD CONSTRAINT chk_water_logs_amount_ml_max CHECK (amount_ml <= 5000);
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_water_logs_amount_ml ON water_logs IS
  'FD-07: Volumen positivo. Rango 1–5000 ml por registro. '
  'Fuera de rango = distorsiona adherencia de hidratación.';

-- =============================================================================
-- TABLA: goals
-- =============================================================================

-- Calorías: rango clínico (500 kcal mínimo, 10.000 kcal máximo)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_goals_target_calories') THEN
    ALTER TABLE goals ADD CONSTRAINT chk_goals_target_calories CHECK (target_calories IS NULL OR target_calories BETWEEN 500 AND 10000);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_goals_tdee') THEN
    ALTER TABLE goals ADD CONSTRAINT chk_goals_tdee CHECK (tdee IS NULL OR tdee BETWEEN 500 AND 10000);
  END IF;
END $$;

-- Macros: no negativos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_goals_macros_non_negative') THEN
    ALTER TABLE goals ADD CONSTRAINT chk_goals_macros_non_negative CHECK (
      (target_protein_g IS NULL OR target_protein_g >= 0) AND
      (target_carbs_g   IS NULL OR target_carbs_g   >= 0) AND
      (target_fat_g     IS NULL OR target_fat_g     >= 0)
    );
  END IF;
END $$;

-- Fecha objetivo debe ser posterior a la fecha de inicio
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_goals_target_date_after_start') THEN
    ALTER TABLE goals ADD CONSTRAINT chk_goals_target_date_after_start CHECK (target_date IS NULL OR target_date > start_date);
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_goals_target_calories ON goals IS
  'FD-06: 500 kcal = mínimo médico. 10.000 = atletas alto rendimiento. '
  'Fuera de rango = déficit/superávit peligroso o fisiológicamente imposible.';

-- =============================================================================
-- TABLA: training_programs
-- =============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_training_programs_weekly_frequency') THEN
    ALTER TABLE training_programs ADD CONSTRAINT chk_training_programs_weekly_frequency CHECK (weekly_frequency BETWEEN 1 AND 7);
  END IF;
END $$;

-- =============================================================================
-- TABLA: health_data
-- =============================================================================

-- Pasos: 0–100.000 por día
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_health_data_steps') THEN
    ALTER TABLE health_data ADD CONSTRAINT chk_health_data_steps CHECK (steps IS NULL OR steps BETWEEN 0 AND 100000);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_health_data_weight_kg') THEN
    ALTER TABLE health_data ADD CONSTRAINT chk_health_data_weight_kg CHECK (weight_kg IS NULL OR weight_kg BETWEEN 1 AND 700);
  END IF;
END $$;

-- Sueño: 0–1440 minutos (24 horas)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_health_data_sleep_minutes') THEN
    ALTER TABLE health_data ADD CONSTRAINT chk_health_data_sleep_minutes CHECK (sleep_minutes IS NULL OR sleep_minutes BETWEEN 0 AND 1440);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_health_data_active_calories') THEN
    ALTER TABLE health_data ADD CONSTRAINT chk_health_data_active_calories CHECK (active_calories IS NULL OR active_calories >= 0);
  END IF;
END $$;

-- =============================================================================
-- TABLA: subscriptions
-- =============================================================================

-- Período: end debe ser posterior a start
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_subscriptions_period_order') THEN
    ALTER TABLE subscriptions ADD CONSTRAINT chk_subscriptions_period_order CHECK (
      current_period_start IS NULL OR
      current_period_end   IS NULL OR
      current_period_end   > current_period_start
    );
  END IF;
END $$;

-- =============================================================================
-- TABLA: sync_queue_items
-- =============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sync_queue_items_retry_count') THEN
    ALTER TABLE sync_queue_items ADD CONSTRAINT chk_sync_queue_items_retry_count CHECK (retry_count >= 0);
  END IF;
END $$;

-- Máximo 10 reintentos — tras esto: status = 'failed'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sync_queue_items_retry_count_max') THEN
    ALTER TABLE sync_queue_items ADD CONSTRAINT chk_sync_queue_items_retry_count_max CHECK (retry_count <= 10);
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_sync_queue_items_retry_count_max ON sync_queue_items IS
  'FD-DB-09: Límite de reintentos offline. '
  'Tras 10 intentos fallidos → status=''failed''. '
  'Previene loops infinitos en OfflineSyncWorker.';

-- =============================================================================
-- VERIFICACIÓN POST-SETUP
-- =============================================================================
--
-- SELECT tc.table_name, tc.constraint_name, cc.check_clause
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.check_constraints cc
--   ON tc.constraint_name = cc.constraint_name
-- WHERE tc.table_schema = 'public'
--   AND tc.constraint_type = 'CHECK'
-- ORDER BY tc.table_name, tc.constraint_name;
-- → Resultado esperado: 47 CHECK constraints
--
-- ── Test de violación (debe fallar):
-- INSERT INTO water_logs (id, user_id, amount_ml, created_at)
-- VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', -100, NOW());
-- → ERROR: violates check constraint "chk_water_logs_amount_ml"
--
-- =============================================================================
