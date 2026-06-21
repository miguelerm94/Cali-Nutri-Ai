##   
## CALI-NUTRI AI  
Arquitectura de Base de Datos  
Versión 1.0  
Motor: PostgreSQL  
ORM Recomendado: Prisma  
   
⸻  
   
## OBJETIVOS  
La base de datos debe soportar:  
* Usuarios.  
* Entrenamientos.  
* Nutrición.  
* Hidratación.  
* Composición corporal.  
* Integraciones externas.  
* IA conversacional.  
* Analítica.  
* Escalabilidad futura.  
   
⸻  
   
## TABLA USERS  
Información principal del usuario.  

| Campo             | Tipo      |
| ----------------- | --------- |
| id                | UUID      |
| email             | VARCHAR   |
| password_hash     | VARCHAR   |
| first_name        | VARCHAR   |
| last_name         | VARCHAR   |
| birth_date        | DATE      |
| sex               | VARCHAR   |
| height_cm         | INTEGER   |
| current_weight_kg | DECIMAL   |
| target_weight_kg  | DECIMAL   |
| experience_level  | VARCHAR   |
| goal              | VARCHAR   |
| created_at        | TIMESTAMP |
| updated_at        | TIMESTAMP |
  
   
⸻  
   
## TABLA BODY_MEASUREMENTS  
Histórico corporal.  

| Campo            | Tipo      |
| ---------------- | --------- |
| id               | UUID      |
| user_id          | UUID      |
| weight_kg        | DECIMAL   |
| waist_cm         | DECIMAL   |
| neck_cm          | DECIMAL   |
| hip_cm           | DECIMAL   |
| body_fat_percent | DECIMAL   |
| lean_mass_kg     | DECIMAL   |
| bmi              | DECIMAL   |
| created_at       | TIMESTAMP |
  
Relación:  
Many measurements → One user  
   
⸻  
   
## TABLA TRAINING_PROGRAMS  
Programas generados por IA.  

| Campo            | Tipo    |
| ---------------- | ------- |
| id               | UUID    |
| user_id          | UUID    |
| name             | VARCHAR |
| goal             | VARCHAR |
| weekly_frequency | INTEGER |
| start_date       | DATE    |
| end_date         | DATE    |
| status           | VARCHAR |
  
   
⸻  
   
## TABLA WORKOUT_DAYS  
Días programados.  

| Campo        | Tipo    |
| ------------ | ------- |
| id           | UUID    |
| program_id   | UUID    |
| day_name     | VARCHAR |
| workout_type | VARCHAR |
  
   
⸻  
   
## TABLA EXERCISES  
Catálogo maestro.  

| Campo       | Tipo    |
| ----------- | ------- |
| id          | UUID    |
| name        | VARCHAR |
| category    | VARCHAR |
| difficulty  | INTEGER |
| description | TEXT    |
  
   
⸻  
   
## TABLA WORKOUT_EXERCISES  
Ejercicios asignados.  

| Campo          | Tipo    |
| -------------- | ------- |
| id             | UUID    |
| workout_day_id | UUID    |
| exercise_id    | UUID    |
| sets           | INTEGER |
| reps           | INTEGER |
| rest_seconds   | INTEGER |
| target_rpe     | INTEGER |
  
   
⸻  
   
## TABLA WORKOUT_SESSIONS  
Entrenamientos realizados.  

| Campo            | Tipo      |
| ---------------- | --------- |
| id               | UUID      |
| user_id          | UUID      |
| started_at       | TIMESTAMP |
| finished_at      | TIMESTAMP |
| duration_minutes | INTEGER   |
| notes            | TEXT      |
  
   
⸻  
   
## TABLA WORKOUT_LOGS  
Registro detallado.  

| Campo          | Tipo    |
| -------------- | ------- |
| id             | UUID    |
| session_id     | UUID    |
| exercise_id    | UUID    |
| set_number     | INTEGER |
| reps_completed | INTEGER |
| rpe            | INTEGER |
  
   
⸻  
   
## TABLA FOODS  
Base de datos nutricional.  

| Campo          | Tipo    |
| -------------- | ------- |
| id             | UUID    |
| name           | VARCHAR |
| serving_size_g | DECIMAL |
| calories       | DECIMAL |
| protein_g      | DECIMAL |
| carbs_g        | DECIMAL |
| fat_g          | DECIMAL |
  
   
⸻  
   
## TABLA FOOD_DIARY  
Diario nutricional.  

| Campo       | Tipo      |
| ----------- | --------- |
| id          | UUID      |
| user_id     | UUID      |
| food_id     | UUID      |
| quantity_g  | DECIMAL   |
| meal_type   | VARCHAR   |
| calories    | DECIMAL   |
| protein_g   | DECIMAL   |
| carbs_g     | DECIMAL   |
| fat_g       | DECIMAL   |
| consumed_at | TIMESTAMP |
  
   
⸻  
   
## TABLA RECIPES  
Recetas generadas.  

| Campo          | Tipo    |
| -------------- | ------- |
| id             | UUID    |
| user_id        | UUID    |
| recipe_name    | VARCHAR |
| instructions   | TEXT    |
| total_calories | DECIMAL |
| total_protein  | DECIMAL |
  
   
⸻  
   
## TABLA RECIPE_INGREDIENTS  
Ingredientes receta.  

| Campo      | Tipo    |
| ---------- | ------- |
| id         | UUID    |
| recipe_id  | UUID    |
| food_id    | UUID    |
| quantity_g | DECIMAL |
  
   
⸻  
   
## TABLA WATER_LOGS  
Registro de agua.  

| Campo      | Tipo      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| amount_ml  | INTEGER   |
| created_at | TIMESTAMP |
  
   
⸻  
   
## TABLA WATER_TARGETS  
Objetivos diarios.  

| Campo         | Tipo      |
| ------------- | --------- |
| id            | UUID      |
| user_id       | UUID      |
| target_ml     | INTEGER   |
| calculated_at | TIMESTAMP |
  
   
⸻  
   
## TABLA DAILY_SUMMARY  
Resumen diario consolidado.  

| Campo             | Tipo    |
| ----------------- | ------- |
| id                | UUID    |
| user_id           | UUID    |
| date              | DATE    |
| calories_consumed | DECIMAL |
| calories_burned   | DECIMAL |
| protein_consumed  | DECIMAL |
| carbs_consumed    | DECIMAL |
| fat_consumed      | DECIMAL |
| water_consumed_ml | INTEGER |
| steps             | INTEGER |
  
   
⸻  
   
## TABLA HEALTH_DATA  
Información importada.  

| Campo           | Tipo      |
| --------------- | --------- |
| id              | UUID      |
| user_id         | UUID      |
| source          | VARCHAR   |
| steps           | INTEGER   |
| active_calories | DECIMAL   |
| heart_rate_avg  | DECIMAL   |
| sleep_minutes   | INTEGER   |
| imported_at     | TIMESTAMP |
  
   
⸻  
   
## TABLA AI_CONVERSATIONS  
Conversaciones.  

| Campo      | Tipo      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| created_at | TIMESTAMP |
  
   
⸻  
   
## TABLA AI_MESSAGES  
Mensajes.  

| Campo           | Tipo      |
| --------------- | --------- |
| id              | UUID      |
| conversation_id | UUID      |
| role            | VARCHAR   |
| content         | TEXT      |
| created_at      | TIMESTAMP |
  
   
⸻  
   
## TABLA GOALS  
Histórico de objetivos.  

| Campo       | Tipo    |
| ----------- | ------- |
| id          | UUID    |
| user_id     | UUID    |
| goal_type   | VARCHAR |
| start_date  | DATE    |
| target_date | DATE    |
| status      | VARCHAR |
  
   
⸻  
   
## TABLA ACHIEVEMENTS  
Sistema de logros.  

| Campo            | Tipo      |
| ---------------- | --------- |
| id               | UUID      |
| user_id          | UUID      |
| achievement_name | VARCHAR   |
| unlocked_at      | TIMESTAMP |
  
   
⸻  
   
## ÍNDICES RECOMENDADOS  
Crear índices para:  
users.email  
body_measurements.user_id  
workout_sessions.user_id  
food_diary.user_id  
water_logs.user_id  
daily_summary.user_id  
health_data.user_id  
ai_conversations.user_id  
   
⸻  
   
## SEGURIDAD  
Implementar:  
* JWT Authentication  
* Refresh Tokens  
* Row Level Security  
* Encriptación de datos sensibles  
* Auditoría de acceso  
   
⸻  
   
## ESCALABILIDAD  
Preparar arquitectura para:  
* 100.000 usuarios activos  
* 1 millón de registros diarios  
* Sincronización Apple Health  
* Sincronización Google Health Connect  
* Procesamiento IA en tiempo real  
   
⸻  
   
## FUTURAS TABLAS (VERSIÓN 2.0)  
* Progress Photos  
* Body Scan AI  
* Challenges  
* Social Feed  
* Friends  
* Leaderboards  
* Premium Subscriptions  
* Payments  
* Notifications  
* AI Recommendations  
   
⸻  
   
## RELACIONES PRINCIPALES  
User ├── Body Measurements ├── Training Programs ├── Workout Sessions ├── Food Diary ├── Water Logs ├── Health Data ├── Goals ├── Achievements └── AI Conversations  
Training Program └── Workout Days └── Workout Exercises  
Workout Session └── Workout Logs  
Recipe └── Recipe Ingredients  
Conversation └── Messages  
   
⸻  
   
## OBJETIVO FINAL  
Construir una base de datos escalable, segura y preparada para soportar una plataforma global de entrenamiento, nutrición, hidratación y coaching mediante inteligencia artificial.  
