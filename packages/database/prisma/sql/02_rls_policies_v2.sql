-- =============================================================================
-- CALI-NUTRI AI — 02_rls_policies.sql
-- =============================================================================
-- Versión:       2.0.0
-- Fuente:        FinalDecisions.md v1.0 · Auditoría DB v1.0
-- Motor:         PostgreSQL 15+ (Supabase)
-- Ejecutar:      DESPUÉS de 01_materialized_views.sql
-- =============================================================================
--
-- CORRECCIONES APLICADAS:
--
--   FIX-02 · daily_summary_mv: RLS habilitado en la Vista Materializada.
--            Las MV NO heredan RLS de sus tablas fuente en PostgreSQL.
--            Sin este fix, datos de todos los usuarios eran accesibles al rol
--            'authenticated' via REST API directa de Supabase.
--
--   FIX-08 · notification_logs: UPDATE policy documentada explícitamente.
--            DECISIÓN: No existe UPDATE policy para rol 'authenticated'.
--            opened_at se actualiza SOLO via service_role a través de
--            POST /notifications/:id/open (NestJS).
--
-- =============================================================================

-- =============================================================================
-- ── PASO 1: HABILITAR RLS EN TODAS LAS TABLAS DE USUARIO ─────────────────────
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
-- ── PASO 2: HABILITAR RLS EN VISTAS MATERIALIZADAS (FIX-02) ──────────────────
-- =============================================================================
-- Las Vistas Materializadas en PostgreSQL/Supabase NO heredan automáticamente
-- las políticas RLS de las tablas fuente. Deben declararse explícitamente.
-- Sin esto, un usuario autenticado puede leer datos de TODOS los usuarios
-- directamente via REST API o Supabase client.

ALTER MATERIALIZED VIEW daily_summary_mv ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ── PASO 3: POLÍTICAS POR TABLA ───────────────────────────────────────────────
-- =============================================================================

-- =============================================================================
-- TABLA: users
-- Solo el propio usuario puede leer y modificar su fila.
-- deleted_at IS NULL: usuarios borrados (GDPR) son invisibles.
-- INSERT/DELETE: service_role exclusivamente.
-- =============================================================================

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid() AND deleted_at IS NULL);

COMMENT ON TABLE users IS
  'RLS: SELECT y UPDATE para propietario (auth.uid()). '
  'INSERT y DELETE exclusivos de service_role. '
  'Filtro deleted_at IS NULL en todas las policies (soft delete GDPR).';

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
-- Acceso indirecto: el programa debe pertenecer al usuario.
-- =============================================================================

CREATE POLICY "workout_days_own"
  ON workout_days FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM   training_programs tp
      WHERE  tp.id      = workout_days.program_id
        AND  tp.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TABLA: exercises (CATÁLOGO PÚBLICO — Solo lectura para usuarios autenticados)
-- is_active = TRUE: los inactivos son invisibles al usuario.
-- =============================================================================

CREATE POLICY "exercises_read_authenticated"
  ON exercises FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

COMMENT ON TABLE exercises IS
  'Catálogo maestro de calistenia. '
  'RLS: SELECT para authenticated (is_active=TRUE). '
  'INSERT/UPDATE/DELETE exclusivos de service_role.';

-- =============================================================================
-- TABLA: workout_exercises
-- Acceso indirecto: workout_day → training_program → usuario.
-- =============================================================================

CREATE POLICY "workout_exercises_own"
  ON workout_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM   workout_days   wd
      JOIN   training_programs tp ON tp.id = wd.program_id
      WHERE  wd.id          = workout_exercises.workout_day_id
        AND  tp.user_id     = auth.uid()
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
-- Acceso indirecto: la sesión debe pertenecer al usuario.
-- =============================================================================

CREATE POLICY "workout_logs_own"
  ON workout_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM   workout_sessions ws
      WHERE  ws.id      = workout_logs.session_id
        AND  ws.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TABLA: foods (CATÁLOGO PÚBLICO — Solo lectura para usuarios autenticados)
-- is_active = TRUE: alimentos deprecados son invisibles.
-- =============================================================================

CREATE POLICY "foods_read_authenticated"
  ON foods FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

COMMENT ON TABLE foods IS
  'Base de datos nutricional USDA + local. '
  'RLS: SELECT para authenticated (is_active=TRUE). '
  'INSERT/UPDATE/DELETE exclusivos de service_role.';

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
-- Acceso indirecto: la conversación debe pertenecer al usuario.
-- DEFENSA EN PROFUNDIDAD: JWT (NestJS) + RLS (Supabase) + AES-256-GCM (campo)
-- =============================================================================

CREATE POLICY "ai_messages_own"
  ON ai_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM   ai_conversations ac
      WHERE  ac.id      = ai_messages.conversation_id
        AND  ac.user_id = auth.uid()
    )
  );

COMMENT ON TABLE ai_messages IS
  'Mensajes CALI encriptados AES-256-GCM (FD-DB-06). '
  'RLS: acceso indirecto via ai_conversations. '
  'Defensa en profundidad: JWT + RLS + encriptación de campo.';

-- =============================================================================
-- TABLA: subscriptions
-- SELECT: el usuario puede ver su propia suscripción.
-- INSERT/UPDATE: service_role exclusivamente (webhook RevenueCat).
-- =============================================================================

CREATE POLICY "subscriptions_read_own"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON TABLE subscriptions IS
  'Suscripciones RevenueCat (FD-DB-08). '
  'RLS: SELECT para propietario. '
  'INSERT y UPDATE exclusivos de service_role (webhook POST /webhooks/revenuecat). '
  'El cliente NUNCA modifica su propia suscripción.';

-- =============================================================================
-- TABLA: notification_logs
-- FIX-08: Política de escritura documentada explícitamente.
--
-- SELECT: el usuario puede leer sus notificaciones.
-- INSERT: service_role exclusivamente (NotificationsService.send()).
-- UPDATE: service_role exclusivamente via POST /notifications/:id/open.
--
-- DECISIÓN ARQUITECTÓNICA (FIX-08):
--   El campo opened_at NO es actualizado directamente por el cliente.
--   Flujo:
--     1. Usuario toca notificación → app navega via deep link
--     2. App llama POST /notifications/:id/open (con JWT)
--     3. NestJS verifica que notification.user_id = auth.user_id
--     4. Backend actualiza opened_at con service_role (bypass RLS)
--   Razón: evitar que el usuario marque como abierta una notificación ajena
--   mediante manipulación directa del ID en una request autenticada.
-- =============================================================================

CREATE POLICY "notification_logs_read_own"
  ON notification_logs FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON TABLE notification_logs IS
  'Log de notificaciones push (FD-DB-10). '
  'RLS FIX-08: SELECT para propietario. INSERT y UPDATE exclusivos de service_role. '
  'opened_at se actualiza via POST /notifications/:id/open (NestJS verifica userId). '
  'NUNCA el cliente hace UPDATE directo — previene manipulación de IDs ajenos.';

-- =============================================================================
-- TABLA: sync_queue_items
-- =============================================================================

CREATE POLICY "sync_queue_items_own"
  ON sync_queue_items FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- FIX-02: POLÍTICA RLS EN VISTA MATERIALIZADA daily_summary_mv
-- Las MV NO heredan RLS de tablas fuente — policy debe declararse explícitamente.
-- =============================================================================

CREATE POLICY "daily_summary_mv_own"
  ON daily_summary_mv FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON MATERIALIZED VIEW daily_summary_mv IS
  'FD-DB-03 v2.0 · FIX-02: RLS habilitado. '
  'Las MV no heredan RLS de tablas fuente — policy declarada explícitamente. '
  'SELECT restringido al propietario via auth.uid(). '
  'Backend NestJS accede via service_role (bypass RLS). '
  'Protección contra acceso REST API directo por rol authenticated.';

-- =============================================================================
-- VERIFICACIÓN POST-SETUP
-- =============================================================================
--
-- ── 1. Verificar RLS en tablas y MV:
-- SELECT schemaname, tablename AS objeto, rowsecurity
-- FROM pg_tables WHERE schemaname = 'public'
-- UNION ALL
-- SELECT schemaname, matviewname, TRUE FROM pg_matviews WHERE schemaname = 'public'
-- ORDER BY objeto;
-- → Todas deben mostrar rowsecurity = TRUE
--
-- ── 2. Verificar políticas por tabla:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- → Confirmar "daily_summary_mv_own" en la MV
--
-- =============================================================================
