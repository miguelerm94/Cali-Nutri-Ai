-- =============================================================================
-- CALI-NUTRI AI — 02_rls_policies.sql
-- =============================================================================
-- FD-ARCH-01: Supabase Auth como único emisor JWT (RS256)
-- FD-SEC-01:  RLS como segunda línea de defensa (tras JWT validation en NestJS)
-- Criterio de lanzamiento (FD-Sección-12):
--   "RLS: Test automatizado verifica que ningún usuario puede leer datos de otro"
--
-- Ejecutar después de prisma migrate deploy y 01_materialized_views.sql
-- =============================================================================
-- ESTRATEGIA RLS:
--   1. Habilitar RLS en TODAS las tablas con datos de usuario
--   2. Las tablas de catálogo (exercises, foods) → solo lectura pública
--   3. Las tablas de usuario → acceso solo al propietario via auth.uid()
--   4. Service role (NestJS backend) → bypass automático de RLS en Supabase
-- =============================================================================

-- =============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================================================

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days       ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods               ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_diary         ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue_items   ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TABLA: users
-- Solo el propio usuario puede leer y modificar su fila.
-- El service_role (backend NestJS) tiene bypass automático.
-- La eliminación de cuenta usa service_role (soft delete via backend).
-- =============================================================================

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid() AND deleted_at IS NULL);

-- INSERT lo hace el backend con service_role (registro) — sin policy para anon/authenticated

-- =============================================================================
-- TABLA: user_assessments
-- =============================================================================

CREATE POLICY "user_assessments_own"
  ON user_assessments FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: body_measurements
-- =============================================================================

CREATE POLICY "body_measurements_own"
  ON body_measurements FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: goals
-- =============================================================================

CREATE POLICY "goals_own"
  ON goals FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: training_programs
-- =============================================================================

CREATE POLICY "training_programs_own"
  ON training_programs FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: workout_days
-- Acceso indirecto: solo si el programa pertenece al usuario
-- =============================================================================

CREATE POLICY "workout_days_own"
  ON workout_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM training_programs tp
      WHERE tp.id = workout_days.program_id
        AND tp.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TABLA: exercises (CATÁLOGO PÚBLICO — Solo lectura para usuarios autenticados)
-- Escritura: solo service_role (administrador del catálogo)
-- =============================================================================

CREATE POLICY "exercises_read_authenticated"
  ON exercises FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- =============================================================================
-- TABLA: workout_exercises
-- Acceso indirecto: solo si el workout_day → program → usuario coincide
-- =============================================================================

CREATE POLICY "workout_exercises_own"
  ON workout_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_days wd
      JOIN training_programs tp ON wd.program_id = tp.id
      WHERE wd.id = workout_exercises.workout_day_id
        AND tp.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TABLA: workout_sessions
-- =============================================================================

CREATE POLICY "workout_sessions_own"
  ON workout_sessions FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: workout_logs
-- Acceso indirecto: solo si la sesión pertenece al usuario
-- =============================================================================

CREATE POLICY "workout_logs_own"
  ON workout_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = workout_logs.session_id
        AND ws.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TABLA: foods (CATÁLOGO PÚBLICO — Solo lectura para usuarios autenticados)
-- =============================================================================

CREATE POLICY "foods_read_authenticated"
  ON foods FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- =============================================================================
-- TABLA: food_diary
-- =============================================================================

CREATE POLICY "food_diary_own"
  ON food_diary FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: water_logs
-- =============================================================================

CREATE POLICY "water_logs_own"
  ON water_logs FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: health_data
-- =============================================================================

CREATE POLICY "health_data_own"
  ON health_data FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: ai_conversations
-- =============================================================================

CREATE POLICY "ai_conversations_own"
  ON ai_conversations FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: ai_messages
-- Acceso indirecto: solo si la conversación pertenece al usuario
-- NOTA: El contenido está encriptado (FD-DB-06) — RLS es la segunda línea de defensa
-- =============================================================================

CREATE POLICY "ai_messages_own"
  ON ai_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations ac
      WHERE ac.id = ai_messages.conversation_id
        AND ac.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TABLA: subscriptions
-- =============================================================================

CREATE POLICY "subscriptions_read_own"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- El UPDATE lo hace el backend con service_role (webhook RevenueCat)
-- sin policy de UPDATE para el role 'authenticated'

-- =============================================================================
-- TABLA: notification_logs
-- Solo lectura por el usuario (el backend escribe con service_role)
-- =============================================================================

CREATE POLICY "notification_logs_read_own"
  ON notification_logs FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================================
-- TABLA: sync_queue_items
-- =============================================================================

CREATE POLICY "sync_queue_items_own"
  ON sync_queue_items FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- VERIFICACIÓN POST-SETUP
-- Ejecutar este query para verificar que RLS está habilitado en todas las tablas:
-- =============================================================================
--
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Todas las tablas de usuario deben mostrar rowsecurity = TRUE.
-- =============================================================================
