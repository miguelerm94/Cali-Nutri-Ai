# CALI-NUTRI AI

## FinalDecisions.md — Fuente Oficial de Verdad del Proyecto

**Clasificación:** Documento Técnico Interno — CONFIDENCIAL  
**Estado:** APROBADO — Vigente desde Junio 2026  
**Versión:** 1.0.0  
**Emitido por:** CTO / Arquitectura Principal  
**Propósito:** Resolver todas las inconsistencias detectadas en Audit_report.md y establecer decisiones vinculantes para todo el desarrollo.

> ⚠️ **INSTRUCCIÓN OBLIGATORIA:** Toda generación de código, diseño de esquemas, definición de endpoints y decisión de producto debe consultar este documento primero. En caso de conflicto entre este documento y cualquier otro (Architecture.md, MVP.md, Training_Engine.md, Nutrition_Engines.md, Data_Base.md, API.md, UXUI.md, PRD.md, Vision.md), **FinalDecisions.md prevalece sin excepción.**

-----

## ÍNDICE

1. [Decisiones de Dominio — Training Engine](#sección-1--decisiones-de-dominio--training-engine)
1. [Decisiones de Dominio — Nutrition Engine](#sección-2--decisiones-de-dominio--nutrition-engine)
1. [Decisiones de Base de Datos](#sección-3--decisiones-de-base-de-datos)
1. [Decisiones de Arquitectura Backend](#sección-4--decisiones-de-arquitectura-backend)
1. [Decisiones de Seguridad](#sección-5--decisiones-de-seguridad)
1. [Decisiones de Producto y MVP Scope](#sección-6--decisiones-de-producto-y-mvp-scope)
1. [Decisiones de Escalabilidad](#sección-7--decisiones-de-escalabilidad)
1. [Decisiones de Infraestructura](#sección-8--decisiones-de-infraestructura)
1. [Schema de Base de Datos Canónico](#sección-9--schema-de-base-de-datos-canónico)
1. [Límites Free vs Premium — Tabla Oficial](#sección-10--límites-free-vs-premium--tabla-oficial)
1. [Timeline Oficial del MVP](#sección-11--timeline-oficial-del-mvp)
1. [Criterios de Lanzamiento Actualizados](#sección-12--criterios-de-lanzamiento-actualizados)

-----

## SECCIÓN 1 — DECISIONES DE DOMINIO: TRAINING ENGINE

-----

### FD-01 · SISTEMA DE CLASIFICACIÓN DE NIVELES DE ENTRENAMIENTO

**Problema detectado (INC-01):**  
Training_Engine.md define 6 niveles granulares (L0–L5) para clasificar al usuario según sus repeticiones máximas. MVP.md define 3 niveles operativos (Principiante / Intermedio / Avanzado). El backend no puede implementar ambos sistemas simultáneamente sin producir asignaciones de rutinas incorrectas para el 60% de los usuarios.

**Alternativas evaluadas:**

- A) Mantener los 6 niveles de Training_Engine.md → Alta granularidad, más complejidad de lógica de asignación, innecesaria para v1.0
- B) Reducir a 3 niveles según MVP.md → Suficiente para rutinas de lanzamiento, extensible
- C) Arquitectura de dos capas: nivel interno numérico + nivel de presentación de 3 grupos → Mejor solución, separa preocupaciones

**Decisión final:**  
**Opción C — Arquitectura de dos capas.**

El sistema usará internamente una **puntuación numérica continua por movimiento** (0–100) calculada en el momento de la evaluación. Esta puntuación se mapea a un **nivel de presentación** de 3 grupos para el usuario y para la lógica de selección de rutinas v1.0. Los umbrales son extensibles sin cambiar el schema.

**Tabla de clasificación canónica — Dominadas (referencia de implementación):**

|Repeticiones máximas|Puntuación interna|Nivel de presentación|Grupo de rutina v1.0|
|--------------------|------------------|---------------------|--------------------|
|0                   |0                 |Principiante         |Beginner            |
|1–3                 |10–25             |Principiante         |Beginner            |
|4–7                 |30–50             |Principiante         |Beginner            |
|8–12                |55–70             |Intermedio           |Intermediate        |
|13–20               |75–90             |Avanzado             |Advanced            |
|20+                 |95–100            |Avanzado             |Advanced            |

**Tabla de clasificación canónica — Flexiones:**

|Repeticiones máximas|Puntuación interna|Nivel de presentación|
|--------------------|------------------|---------------------|
|0–5                 |0–10              |Principiante         |
|6–15                |15–30             |Principiante         |
|16–30               |35–55             |Intermedio           |
|31–50               |60–75             |Intermedio           |
|51–75               |80–90             |Avanzado             |
|75+                 |95–100            |Avanzado             |

**Nivel global del usuario:** promedio ponderado de puntuaciones por movimiento (pesos: Dominadas 40%, Flexiones 30%, Sentadillas 15%, Core 15%). Resultado mapeado a Principiante / Intermedio / Avanzado.

**Justificación técnica:**  
La arquitectura de dos capas permite que en v2.0 se agreguen sub-niveles de progresión, logros granulares y ajuste fino de programas sin romper la API pública ni migrar datos existentes. La puntuación continua es más precisa para el algoritmo de generación de rutinas que un enum discreto.

**Impacto en arquitectura:**  
El módulo `TrainingEngine` del backend calcula y almacena `fitness_score` (DECIMAL 0–100) por movimiento. El nivel de presentación se deriva en runtime, nunca se almacena como string.

**Impacto en base de datos:**  
Ver FD-DB-01: campo `fitness_score` en tabla `USER_ASSESSMENTS`. El campo `experience_level` en `USERS` se elimina (derivado, no almacenado).

**Impacto en frontend:**  
La UI muestra siempre el nivel de presentación (Principiante / Intermedio / Avanzado). Las pantallas de evaluación registran repeticiones brutas; el cálculo de puntuación ocurre en el backend.

**Impacto en roadmap:**  
v1.0: implementar con 3 grupos. v1.1: activar 6 sub-niveles para progresión más granular usando la misma `fitness_score` ya almacenada.

-----

### FD-02 · DETECCIÓN DE ESTANCAMIENTO Y DELOAD AUTOMÁTICO

**Problema detectado (INC-03):**  
Training_Engine.md define detección de estancamiento (3 semanas sin mejora) y semana de descarga como funcionalidades del motor core. MVP.md los difiere explícitamente. Adicionalmente, el ajuste automático por sueño depende de Apple Health que es P2 en el MVP.

**Alternativas evaluadas:**

- A) Implementar detección completa con acción automática en v1.0 → Requiere 3+ semanas de datos que usuarios nuevos no tienen
- B) Implementar detección pasiva + alerta al usuario, sin acción automática → Balance entre utilidad y complejidad
- C) Diferir completamente a v1.1 → Pérdida de diferenciador competitivo en el lanzamiento

**Decisión final:**  
**Opción B — Detección pasiva con alerta informativa en v1.0. Acción automática en v1.1.**

**Implementación v1.0:**

- El backend calcula el indicador de estancamiento después de cada sesión registrada
- Si se detecta estancamiento (definición abajo), se almacena un flag `stagnation_alert: true` en `TRAINING_PROGRAMS`
- El usuario ve un mensaje informativo en la pantalla de resumen: *“Tu progreso se ha estabilizado. Considera hablar con CALI para ajustar tu programa.”*
- CALI puede sugerir manualmente un deload cuando el usuario lo consulta
- **No hay modificación automática del programa de entrenamiento en v1.0**

**Definición oficial de estancamiento:**

- Sin mejora (sin incremento de reps o series) durante **3 semanas consecutivas** de entrenamiento activo (mínimo 2 sesiones por semana), O
- Reducción de rendimiento (reps < objetivo) durante **2 semanas consecutivas**

**Implementación v1.1 (acción automática):**

- Tras detección de estancamiento confirmada: reducir volumen 20% automáticamente
- Proponer semana de descarga programada cada 6–8 semanas
- Requiere que el usuario tenga mínimo 4 semanas de datos

**Ajuste por sueño:**  
Diferido completamente a v1.1 junto con la integración completa de Apple Health / Health Connect como fuente de datos de sueño confiable. En v1.0, el usuario puede reportar fatiga subjetiva (1–10) manualmente; CALI la usa como señal conversacional pero no modifica el programa automáticamente.

**Justificación técnica:**  
La acción automática sin datos suficientes genera falsos positivos que dañan la confianza del usuario. Un usuario nuevo no tiene 3 semanas de datos en el lanzamiento. La detección pasiva entrega valor informativo inmediato sin riesgo de modificaciones incorrectas.

**Impacto en arquitectura:**  
Endpoint `GET /training/stagnation-status` retorna estado calculado en runtime. No requiere tabla nueva.

**Impacto en base de datos:**  
Campo `stagnation_alert` (BOOLEAN, DEFAULT FALSE) y `stagnation_detected_at` (TIMESTAMP, NULLABLE) en tabla `TRAINING_PROGRAMS`.

**Impacto en frontend:**  
Banner informativo condicional en pantalla de historial de entrenamiento. Sin modal bloqueante ni modificación de UI principal.

**Impacto en roadmap:**  
v1.0: detección pasiva. v1.1: acción automática + deload semanal programado.

-----

### FD-03 · FRECUENCIAS Y ESTRUCTURAS DE ENTRENAMIENTO DISPONIBLES

**Decisión final (fuente única para implementación):**

|Frecuencia   |Estructura                            |Descripción                           |
|-------------|--------------------------------------|--------------------------------------|
|3 días/semana|Full Body (A/B/A rotación)            |Para Principiante e Intermedio        |
|4 días/semana|Upper / Lower                         |Para Intermedio y Avanzado            |
|5 días/semana|Push / Pull / Legs + 2 complementarios|Para Avanzado                         |
|6 días/semana|Push / Pull / Legs × 2                |Solo para Avanzado con puntuación ≥ 80|

**Regla de negocio:** Si el usuario selecciona una frecuencia incompatible con su nivel (ej: Principiante solicita 6 días), la app muestra advertencia y permite continuar, pero el programa generado usará la estructura de la frecuencia elegida con volumen ajustado al nivel real.

-----

### FD-04 · REGLA DE GENERACIÓN DE SERIES Y PROGRESIÓN

**Fuente única canónica para implementación:**

**Regla de trabajo:** El volumen de trabajo se fija entre **el 60% y el 80% del máximo registrado** del usuario para ese movimiento.

**Algoritmo:**

```
trabajo_objetivo = floor(max_reps * 0.70)  // punto medio del rango
series = 4
reps_por_serie = trabajo_objetivo
// Si trabajo_objetivo < 3 → usar variante regresiva del ejercicio
```

**Regla de progresión automática (activa en v1.0):**

- Si el usuario completa **el 100% de las series programadas en 2 semanas consecutivas** → incrementar en 1 rep por serie
- Si el usuario alcanza el tope de reps para ese rango de nivel → escalar a variante más difícil del ejercicio

**RPE objetivo por objetivo:**

|Objetivo        |RPE target|
|----------------|----------|
|Hipertrofia     |7–9       |
|Pérdida de grasa|6–8       |
|Rendimiento     |7–8       |
|Recomposición   |7–8       |

-----

## SECCIÓN 2 — DECISIONES DE DOMINIO: NUTRITION ENGINE

-----

### FD-05 · FACTOR DE ACTIVIDAD PARA CÁLCULO DE TDEE

**Problema detectado (INC-08):**  
Nutrition_Engines.md define 5 factores de actividad sin vincularlos a frecuencia de entrenamiento. MVP.md los vincula a días de entrenamiento. Sin un mapeo explícito, el backend usa criterios subjetivos y calcula TDEE inconsistente para el mismo usuario.

**Decisión final — Tabla canónica de mapeo (fuente única):**

|Factor|Nivel               |Definición operativa                                        |Días entrenamiento/semana|
|------|--------------------|------------------------------------------------------------|-------------------------|
|1.2   |Sedentario          |Trabajo de escritorio, sin ejercicio regular                |0                        |
|1.375 |Ligeramente activo  |Ejercicio leve 1–2 días/semana o caminata regular           |1–2                      |
|1.55  |Moderadamente activo|Entrenamiento 3–4 días/semana (target principal CALI-NUTRI) |3–4                      |
|1.725 |Activo              |Entrenamiento 5–6 días/semana                               |5–6                      |
|1.9   |Muy activo          |Entrenamiento doble diario o trabajo físico intenso + 6 días|Doble sesión diaria      |

**Regla de implementación en onboarding:**  
El sistema mapea automáticamente la frecuencia seleccionada por el usuario (3/4/5/6 días) al factor correspondiente. El usuario **no selecciona el factor manualmente** — esto elimina el error de autoevaluación de nivel de actividad, que es la causa principal de cálculos de TDEE incorrectos en apps fitness.

**Fórmula TMB (Mifflin-St Jeor — única fórmula autorizada):**

```
Hombre: TMB = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) + 5
Mujer:  TMB = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) - 161
TDEE = TMB × factor_actividad
```

**Impacto en arquitectura:**  
El endpoint `POST /onboarding/calculate-macros` recibe `training_days_per_week` (INTEGER) y aplica el mapeo internamente. Nunca expone el factor numérico al cliente.

**Impacto en base de datos:**  
Campo `training_frequency` (INTEGER, 0–7) en tabla `USERS`. El factor se deriva en runtime, no se almacena.

-----

### FD-06 · DISTRIBUCIÓN DE MACRONUTRIENTES — VALORES CANÓNICOS

**Fuente única para implementación:**

|Macronutriente|Rango                                                  |Prioridad de cálculo   |
|--------------|-------------------------------------------------------|-----------------------|
|Proteína      |1.8–2.4 g/kg peso corporal (usar 2.0 g/kg como default)|1ª (se calcula primero)|
|Grasas        |0.8–1.0 g/kg peso corporal (mínimo absoluto: 0.6 g/kg) |2ª                     |
|Carbohidratos |Calorías restantes tras proteína y grasas              |3ª (residual)          |

**Objetivos calóricos sobre TDEE:**

|Objetivo         |Ajuste calórico                       |Notas                                              |
|-----------------|--------------------------------------|---------------------------------------------------|
|Ganancia muscular|TDEE + 200 a +400 kcal (default: +300)|Superávit conservador para minimizar ganancia grasa|
|Pérdida de grasa |TDEE − 300 a −600 kcal (default: −400)|Déficit moderado que preserva masa muscular        |
|Recomposición    |TDEE − 100 a −250 kcal (default: −150)|Déficit mínimo, alta proteína                      |
|Mantenimiento    |TDEE exacto                           |Sin ajuste                                         |

-----

### FD-07 · HIDRATACIÓN — CÁLCULO Y AJUSTES

**Problema detectado (INC-09):**  
Nutrition_Engines.md incluye ajuste por clima cálido (+500 ml) sin que exista ninguna integración de API de clima en el stack tecnológico.

**Decisión final:**  
Eliminar el ajuste por clima de v1.0 y v1.1. El clima es una variable externa no controlable sin GPS + API de clima + consentimiento de ubicación. Agrega complejidad de UX y privacidad desproporcionada al valor entregado.

**Fórmula canónica de hidratación v1.0:**

```
objetivo_base_ml = peso_kg × 40  // punto medio del rango 35-45 ml/kg
ajuste_entrenamiento = SI sesion_hoy → +500 ml (intensidad normal) ó +750 ml (alta intensidad)
ajuste_pasos = SI pasos_hoy > 10000 → +250 ml
objetivo_diario_ml = objetivo_base_ml + ajuste_entrenamiento + ajuste_pasos
```

**Opciones de registro rápido en UI (fuente única):**  
250 ml | 500 ml | 750 ml | 1000 ml | personalizado

**Recordatorios:**

- Si < 30% consumido a las 12:00 → notificación
- Si < 60% consumido a las 18:00 → notificación
- Si < 80% consumido a las 20:00 → notificación (última del día)

**Ajuste por clima:** Diferido a v2.0 condicionado a implementación de WeatherKit (iOS) + Weather API (Android) con consentimiento explícito del usuario.

-----

### FD-08 · FRECUENCIA CARDÍACA DE APPLE HEALTH

**Problema detectado (INC-10):**  
Nutrition_Engines.md lista la importación de frecuencia cardíaca pero ningún módulo de v1.0 la utiliza en ningún cálculo.

**Decisión final:**  
No importar frecuencia cardíaca en v1.0. Se elimina del scope de sincronización con Apple Health / Health Connect para MVP.

**Datos que SÍ se importan en v1.0 (lista canónica):**

- Pasos diarios
- Peso (lectura, no escritura)
- Minutos de sueño (solo lectura pasiva, no acciona cambios en v1.0)

**Datos diferidos:**

- Frecuencia cardíaca → v2.0 (requiere cálculo de VO2max estimado o zonas de trabajo para aportar valor real)
- Calorías activas → v1.1 (ajuste de TDEE por actividad real)
- Variabilidad de frecuencia cardíaca (HRV) → v3.0

-----

### FD-09 · AJUSTE AUTOMÁTICO DE CALORÍAS POR PROGRESO

**Problema detectado:**  
Nutrition_Engines.md describe ajuste automático de calorías después de 14–21 días sin progreso. Requiere datos históricos que los usuarios nuevos no tienen.

**Decisión final:**  
El ajuste automático se activa solo cuando se cumplen **todas** las condiciones:

1. El usuario tiene **mínimo 14 días** de registros nutricionales (con adherencia > 80%)
1. El objetivo activo es pérdida de grasa o ganancia muscular
1. Se cumple la condición de estancamiento de peso (definida abajo)

**Condiciones de activación:**

|Objetivo         |Condición                                       |Ajuste                                        |
|-----------------|------------------------------------------------|----------------------------------------------|
|Pérdida de grasa |14 días sin reducción de peso Y adherencia > 80%|Reducir 100–150 kcal (desde carbohidratos)    |
|Ganancia muscular|21 días sin aumento de peso Y adherencia > 80%  |Incrementar 100–150 kcal (desde carbohidratos)|

**Comportamiento en v1.0:** El sistema calcula el indicador y lo presenta a CALI como señal de contexto. CALI informa al usuario de la situación y **sugiere el ajuste**, pero el usuario debe confirmarlo. No hay ajuste silencioso.  
**v1.1:** Ajuste automático opcional (toggle en configuración, desactivado por default).

-----

### FD-10 · PLANIFICADOR DE COMIDAS Y RECETAS INTELIGENTES

**Problema detectado (INC-02, INC-04):**  
Nutrition_Engines.md incluye Planificador de Comidas y Recetas Inteligentes. MVP.md los excluye.

**Decisión final:**

|Feature                                          |v1.0      |Mecanismo                          |
|-------------------------------------------------|----------|-----------------------------------|
|Planificador de comidas (pantalla dedicada)      |❌ Excluido|—                                  |
|Recetas inteligentes (pantalla dedicada)         |❌ Excluido|—                                  |
|Sugerencias de qué comer (conversacional)        |✅ Incluido|A través de CALI chat              |
|Cálculo de porciones con ingredientes disponibles|✅ Incluido|Tool call de CALI: `calculate_meal`|
|Escaneo por fotografía                           |❌ Excluido|v2.0                               |
|Código de barras                                 |❌ Excluido|v2.0                               |

**Justificación técnica:**  
CALI puede responder “tengo pollo y arroz, ¿cuánto como?” mediante tool call que accede al contexto nutricional del día. Esto entrega el 80% del valor del planificador sin construir una pantalla dedicada, optimizando tiempo de desarrollo para el lanzamiento.

-----

## SECCIÓN 3 — DECISIONES DE BASE DE DATOS

-----

### FD-DB-01 · ELIMINACIÓN DE CAMPOS DUPLICADOS EN TABLA USERS

**Problema detectado (DUP-01, DUP-02):**

- `users.goal` duplica la tabla `GOALS`
- `users.current_weight_kg` duplica `BODY_MEASUREMENTS`

**Decisión final:**

|Campo                             |Acción      |Fuente canónica de datos                                   |
|----------------------------------|------------|-----------------------------------------------------------|
|`users.goal`                      |**ELIMINAR**|`GOALS` table, registro con `status = 'active'`            |
|`users.current_weight_kg`         |**ELIMINAR**|`BODY_MEASUREMENTS` — último registro por `MAX(created_at)`|
|`users.experience_level` (VARCHAR)|**ELIMINAR**|Derivado de `USER_ASSESSMENTS.fitness_score`               |

**Campos que se mantienen en USERS:**

```sql
CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              VARCHAR(255) UNIQUE NOT NULL,
  password_hash      VARCHAR(255),           -- NULL si usa OAuth
  first_name         VARCHAR(100) NOT NULL,
  last_name          VARCHAR(100),
  birth_date         DATE NOT NULL,
  sex                VARCHAR(10) NOT NULL,    -- 'male' | 'female'
  height_cm          INTEGER NOT NULL,
  target_weight_kg   DECIMAL(5,2),
  training_frequency INTEGER DEFAULT 3,       -- días/semana
  unit_preference    VARCHAR(10) DEFAULT 'metric', -- 'metric' | 'imperial'
  onboarding_step    INTEGER DEFAULT 0,       -- para state machine de onboarding
  onboarding_complete BOOLEAN DEFAULT FALSE,
  tier               VARCHAR(20) DEFAULT 'free', -- 'free' | 'premium'
  subscription_id    VARCHAR(255),             -- RevenueCat subscription ID
  google_id          VARCHAR(255) UNIQUE,      -- OAuth Google
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at         TIMESTAMP WITH TIME ZONE  -- soft delete GDPR
);
```

**Impacto en arquitectura:**  
Todos los endpoints que retornan datos del usuario deben hacer JOIN con `GOALS` y `BODY_MEASUREMENTS` para poblar `current_goal` y `current_weight`. Implementar como función PostgreSQL `get_user_profile(user_id UUID)` para centralizar esta lógica.

**Impacto en frontend:**  
El objeto de usuario en el cliente siempre vendrá del endpoint `GET /users/me` que incluye `current_goal` y `current_weight` como campos computados (no almacenados).

-----

### FD-DB-02 · ELIMINACIÓN DE TABLA WATER_TARGETS

**Problema detectado (DUP-04):**  
`WATER_TARGETS` almacena un valor determinístico que puede calcularse en runtime desde peso + actividad del día.

**Decisión final:**  
**Eliminar tabla `WATER_TARGETS` del schema.**

**Implementación:**  
El endpoint `GET /hydration/today` calcula el target en runtime usando la fórmula de FD-07 y cachea el resultado en Redis con TTL de 6 horas (key: `hydration:target:{user_id}:{date}`). La invalidación del caché ocurre cuando:

- El usuario registra una sesión de entrenamiento del día
- El peso del usuario cambia

**Impacto en base de datos:**  
Tabla eliminada. Reducción de complejidad de schema: −1 tabla, −1 índice, −1 punto de sincronización.

-----

### FD-DB-03 · DAILY_SUMMARY COMO VISTA MATERIALIZADA

**Problema detectado (DUP-05, RE-01):**  
`DAILY_SUMMARY` como tabla requiere escrituras síncronas en cada registro de comida/agua/entrenamiento. A escala de 100K usuarios, genera contención en rows individuales (hot row problem).

**Decisión final:**  
Implementar `DAILY_SUMMARY` como **PostgreSQL Materialized View** con refresh estratégico.

**Estrategia de implementación:**

```sql
CREATE MATERIALIZED VIEW daily_summary AS
SELECT
  fd.user_id,
  DATE(fd.consumed_at AT TIME ZONE 'UTC') AS date,
  SUM(fd.calories)    AS calories_consumed,
  SUM(fd.protein_g)   AS protein_consumed,
  SUM(fd.carbs_g)     AS carbs_consumed,
  SUM(fd.fat_g)       AS fat_consumed,
  COALESCE((
    SELECT SUM(wl.amount_ml) FROM water_logs wl
    WHERE wl.user_id = fd.user_id
    AND DATE(wl.created_at AT TIME ZONE 'UTC') = DATE(fd.consumed_at AT TIME ZONE 'UTC')
  ), 0) AS water_consumed_ml,
  COALESCE((
    SELECT hd.steps FROM health_data hd
    WHERE hd.user_id = fd.user_id
    AND DATE(hd.imported_at AT TIME ZONE 'UTC') = DATE(fd.consumed_at AT TIME ZONE 'UTC')
    ORDER BY hd.imported_at DESC LIMIT 1
  ), 0) AS steps
FROM food_diary fd
GROUP BY fd.user_id, DATE(fd.consumed_at AT TIME ZONE 'UTC');

CREATE UNIQUE INDEX ON daily_summary(user_id, date);
```

**Política de refresh:**

- El refresh se ejecuta como job en BullMQ (Redis): `REFRESH MATERIALIZED VIEW CONCURRENTLY daily_summary`
- Frecuencia: cada 30 minutos (no bloquea lecturas por el `CONCURRENTLY`)
- Para el dashboard en tiempo real: el endpoint `GET /dashboard/today` calcula los datos del día actual directamente desde las tablas fuente (no desde la vista), la vista se usa para analítica histórica (gráficas de progreso, semana pasada, etc.)

**Impacto en arquitectura:**  
Elimina todos los `UPDATE daily_summary` del código de la aplicación. Reduce la complejidad de transacciones en un 30–40%.

-----

### FD-DB-04 · DESNORMALIZACIÓN INTENCIONAL EN FOOD_DIARY

**Problema detectado (DUP-03):**  
`FOOD_DIARY` almacena `calories`, `protein_g`, `carbs_g`, `fat_g` aunque estos pueden calcularse desde `FOODS + quantity_g`. Esto puede llevar a que un desarrollador lo “corrija” eliminando los campos y generando un bug crítico.

**Decisión oficial:**  
**La desnormalización de macros en `FOOD_DIARY` es INTENCIONAL y PERMANENTE.**

**Justificación:** Los valores nutricionales en la base de alimentos (`FOODS`) pueden actualizarse cuando USDA actualiza sus datos. Si un alimento cambia su composición nutricional en la fuente, el historial del usuario no debe cambiar retroactivamente. Los macros registrados representan la realidad nutricional **en el momento del registro**, no la definición actual del alimento.

**Regla de implementación:**  
Al registrar en `FOOD_DIARY`, el backend copia los valores de `FOODS` multiplicados por el porcentaje de `quantity_g` y los guarda como campos independientes. Nunca se recalculan desde `FOODS` para registros históricos.

```
// Al insertar en FOOD_DIARY:
calories   = (food.calories   / food.serving_size_g) * quantity_g
protein_g  = (food.protein_g  / food.serving_size_g) * quantity_g
carbs_g    = (food.carbs_g    / food.serving_size_g) * quantity_g
fat_g      = (food.fat_g      / food.serving_size_g) * quantity_g
```

**Este comentario debe incluirse en el modelo Prisma:**

```typescript
// NOTA ARQUITECTÓNICA: Los campos nutricionales en food_diary son
// desnormalizados INTENCIONALMENTE. Representan los macros en el
// momento del registro. NO calcular desde foods.* para historial.
```

-----

### FD-DB-05 · NUEVA TABLA USER_ASSESSMENTS

**Problema detectado (INC-01 + FD-01):**  
No existe una tabla para almacenar los resultados de la evaluación inicial con la puntuación continua definida en FD-01.

**Decisión final — Nueva tabla:**

```sql
CREATE TABLE user_assessments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessed_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Repeticiones brutas registradas por el usuario
  pullups_max      INTEGER DEFAULT 0,
  pushups_max      INTEGER DEFAULT 0,
  squats_max       INTEGER DEFAULT 0,
  dips_max         INTEGER DEFAULT 0,
  plank_seconds    INTEGER DEFAULT 0,
  -- Puntuaciones calculadas (0–100)
  pullups_score    DECIMAL(5,2) DEFAULT 0,
  pushups_score    DECIMAL(5,2) DEFAULT 0,
  squats_score     DECIMAL(5,2) DEFAULT 0,
  core_score       DECIMAL(5,2) DEFAULT 0,
  -- Puntuación global ponderada
  global_score     DECIMAL(5,2) DEFAULT 0,
  -- Nivel de presentación derivado
  presentation_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner'|'intermediate'|'advanced'
  is_active        BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX idx_user_assessments_active ON user_assessments(user_id, is_active);
```

-----

### FD-DB-06 · TABLA AI_MESSAGES — ENCRIPTACIÓN DE CAMPO CONTENT

**Problema detectado (RS-02):**  
El campo `content` en `AI_MESSAGES` puede contener información médica sensible. RLS protege acceso entre usuarios pero no protege contra acceso directo a la base de datos por administradores.

**Decisión final:**  
Implementar **encriptación a nivel de aplicación** del campo `content` antes de persistir en base de datos.

**Implementación:**

- Algoritmo: AES-256-GCM
- Clave de encriptación: derivada por usuario (no por sistema) usando `user_id + app_secret` como input del KDF
- El campo `content` en la base de datos almacena el texto encriptado en base64
- La desencriptación ocurre en el backend NestJS antes de enviar al cliente
- AWS KMS gestiona el `app_secret` master (no en variables de entorno)

**Impacto en base de datos:**  
El campo `content` en `AI_MESSAGES` cambia de `TEXT` a `TEXT` (mismo tipo, contenido diferente — base64 encriptado). Agregar campo `content_iv` VARCHAR(100) para almacenar el IV de AES-GCM.

**Impacto en arquitectura:**  
Módulo `EncryptionService` en NestJS, inyectado en `AIModule`. Las búsquedas full-text sobre `AI_MESSAGES.content` no serán posibles (dato encriptado). Para analítica: usar metadatos no encriptados (timestamps, tool_calls, tokens_used).

-----

### FD-DB-07 · TABLA AI_MESSAGES — CAMPOS ADICIONALES REQUERIDOS

La tabla `AI_MESSAGES` del documento original es insuficiente. Schema canónico:

```sql
CREATE TABLE ai_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role             VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT NOT NULL,        -- AES-256-GCM encriptado (base64)
  content_iv       VARCHAR(100) NOT NULL, -- IV para desencriptación
  tokens_used      INTEGER,              -- Para control de costos
  tool_calls       JSONB,                -- Acciones ejecutadas por CALI
  latency_ms       INTEGER,              -- Para monitoreo SLA
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

-----

### FD-DB-08 · TABLA SUBSCRIPTIONS (NUEVA — REQUERIDA PARA REVENUCAT)

Tabla ausente en Data_Base.md pero requerida para la monetización:

```sql
CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revenuecat_user_id   VARCHAR(255) UNIQUE NOT NULL,
  plan_id              VARCHAR(100),           -- 'premium_monthly' | 'premium_annual'
  status               VARCHAR(50),            -- 'active' | 'expired' | 'trial' | 'cancelled'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end   TIMESTAMP WITH TIME ZONE,
  trial_end            TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscriptions_user ON subscriptions(user_id);
```

-----

### FD-DB-09 · TABLA OFFLINE_QUEUE (NUEVA — REQUERIDA PARA MVP)

Para el modo offline (FM-01 del audit), se requiere persistencia local en el dispositivo + tabla de sincronización:

**En dispositivo (MMKV / SQLite local — React Native):**

```typescript
interface OfflineQueueItem {
  id: string;              // UUID local
  operation: 'create' | 'update' | 'delete';
  endpoint: string;        // '/workout/logs' | '/food/diary' | '/hydration/logs'
  payload: object;
  created_at: string;      // ISO 8601
  retry_count: number;
  synced: boolean;
}
```

**Cola de operaciones soportadas offline:**

- `POST /workout/sessions` y `POST /workout/logs`
- `POST /food/diary`
- `POST /hydration/logs`
- `PATCH /workout/sessions/:id` (finalizar sesión)

**Operaciones que requieren conexión (no soportan offline):**

- Búsqueda de alimentos (USDA API)
- Chat con CALI
- Sincronización con Apple Health
- Onboarding (solo una vez, requiere conexión)

-----

### FD-DB-10 · TABLA NOTIFICATIONS (NUEVA — REQUERIDA PARA DEEP LINKING)

```sql
CREATE TABLE notification_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(50) NOT NULL,   -- 'workout_reminder' | 'hydration' | 'streak'
  deep_link       VARCHAR(255),           -- URL scheme para navegación directa
  sent_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at       TIMESTAMP WITH TIME ZONE,
  platform        VARCHAR(20)             -- 'ios' | 'android'
);
```

-----

## SECCIÓN 4 — DECISIONES DE ARQUITECTURA BACKEND

-----

### FD-ARCH-01 · CAPA DE AUTENTICACIÓN — EMISOR ÚNICO DE JWT

**Problema detectado (RT-02):**  
La arquitectura tenía tres capas de auth: Supabase Auth + NestJS Guards + AWS API Gateway. Esto genera tres puntos de fallo con mensajes de error inconsistentes.

**Decisión final:**  
**Supabase Auth es el único emisor de JWT.** NestJS valida contra la clave pública de Supabase (RS256). AWS API Gateway **no se incluye en v1.0 MVP** (se sustituye por AWS Application Load Balancer + NestJS).

**Cadena de confianza canónica:**

```
Cliente móvil
    → [JWT Supabase RS256]
    → AWS Application Load Balancer (TLS termination)
    → NestJS (valida JWT con Supabase JWKS endpoint)
    → Guard verifica claims (user_id, tier, exp)
    → Controller → Service → Database (RLS)
```

**Justificación:**  
AWS API Gateway agrega $0.0035/1000 requests de costo adicional y latencia de 10–30ms sin beneficio funcional para MVP. NestJS `ThrottlerGuard` reemplaza el rate limiting de API Gateway.

**Implementación:**

```typescript
// auth.strategy.ts
import { passportJwtSecret } from 'jwks-rsa';

JwtStrategy({
  secretOrKeyProvider: passportJwtSecret({
    jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
    cache: true,
    rateLimit: true,
  }),
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  audience: 'authenticated',
  issuer: process.env.SUPABASE_URL + '/auth/v1',
  algorithms: ['RS256'],
})
```

**Google OAuth Scope (RS-04):**  
Scope mínimo y único: `openid email profile`. Ningún scope adicional sin justificación documentada y aprobación del App Store.

-----

### FD-ARCH-02 · CHAT DE IA — SSE EN LUGAR DE WEBSOCKETS

**Problema detectado (RT-03):**  
WebSockets no son compatibles con escalado horizontal en ECS sin sticky sessions o Redis Pub/Sub.

**Decisión final:**  
**Server-Sent Events (SSE) para streaming de respuestas de CALI en v1.0.**

**Justificación técnica:**

- SSE es unidireccional (servidor → cliente) lo cual es suficiente para el chat de IA donde el cliente envía una petición HTTP POST y recibe el stream de respuesta
- Compatible con HTTP/2 sin configuración adicional
- No requiere sticky sessions — cada petición SSE es independiente
- Soportado nativamente en React Native con `EventSource` polyfill
- Migración a WebSocket bidireccional en v2.0 cuando se necesite colaboración en tiempo real (features sociales)

**Implementación NestJS:**

```typescript
@Get(':id/stream')
@Sse()
async streamMessage(
  @Param('id') conversationId: string,
  @Query('message') message: string,
  @CurrentUser() user: AuthUser,
): Promise<Observable<MessageEvent>> {
  return this.aiService.streamResponse(user.id, conversationId, message);
}
```

**Cliente React Native:**

```typescript
// Usar 'react-native-event-source' o fetch con ReadableStream
const response = await fetch(`${API_URL}/ai/conversations/${id}/stream`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ message }),
});
// Procesar stream token por token para typing effect
```

-----

### FD-ARCH-03 · VENTANA DE CONTEXTO DE IA — LÍMITES FIJOS

**Problema detectado (RE-02, RT-01):**  
El contexto enviado a Claude crece ilimitadamente con el tiempo, incrementando costo y latencia linealmente.

**Decisión final — Ventana de contexto fija (implementar desde Sprint 1 del AI module):**

|Componente del contexto    |Límite                |Justificación                        |
|---------------------------|----------------------|-------------------------------------|
|Mensajes de chat previos   |Últimos 20 mensajes   |Ventana conversacional suficiente    |
|Historial de entrenamientos|Últimas 10 sesiones   |Tendencia de progresión reciente     |
|Registros nutricionales    |Últimos 14 días       |Patrón alimentario semanal + anterior|
|Medidas corporales         |Últimas 3 lecturas    |Tendencia de peso                    |
|Resumen histórico          |1 bloque de 200 tokens|Comprimido por Claude y cacheado 24h |

**Estructura del prompt de sistema (canónica):**

```
[SYSTEM PROMPT — 400 tokens máx]
Eres CALI, coach de calistenia y nutrición de CALI-NUTRI AI...
[instrucciones de comportamiento]

[CONTEXTO DEL USUARIO — 800 tokens máx]
{user_profile_summary}    // nombre, objetivo, nivel, peso actual
{recent_nutrition}        // últimos 14 días, resumen por día
{recent_training}         // últimas 10 sesiones
{hydration_today}         // estado actual de hoy
{historical_summary}      // resumen comprimido (cacheado)

[HISTORIAL DE CONVERSACIÓN — 600 tokens máx]
{last_20_messages}

[MENSAJE DEL USUARIO — sin límite]
{current_message}

TOTAL ESTIMADO: ~1,800–2,200 tokens / request
```

**SLA oficial para CALI:**

- p50: < 3 segundos (objetivo de UX)
- p95: < 6 segundos (SLA de lanzamiento — no 5s)
- Streaming visible desde primer token en el cliente

**Justificación del cambio de SLA:**  
El SLA de 5s en MVP.md es frágil. Con contexto de 2K tokens y Claude Sonnet 4.6, la latencia real en p95 es 4–7 segundos. Se fija en 6s para el lanzamiento con streaming activo (el usuario ve la respuesta llegar), permitiendo ajuste posterior una vez medido el p95 real en staging.

-----

### FD-ARCH-04 · RATE LIMITING DEL AI ENDPOINT

**Problema detectado (RS-03, FM-03):**  
Sin límites por usuario, un usuario malintencionado genera costos ilimitados en Claude API.

**Decisión final — Rate limits por tier (implementación: Redis counters con TTL 24h):**

|Endpoint                             |Free           |Premium         |Admin       |
|-------------------------------------|---------------|----------------|------------|
|`POST /ai/conversations/:id/messages`|10 mensajes/día|100 mensajes/día|Ilimitado   |
|`GET /ai/conversations/:id/stream`   |10 streams/día |100 streams/día |Ilimitado   |
|General API                          |100 req/min    |300 req/min     |1000 req/min|

**Implementación:**

```typescript
// redis counter por usuario/día
const key = `rate:ai:${userId}:${today}`;
const count = await redis.incr(key);
await redis.expire(key, 86400); // TTL 24 horas
if (count > LIMITS[userTier]) throw new TooManyRequestsException();
```

**Respuesta al cliente cuando se excede el límite:**

```json
{
  "error": "DAILY_LIMIT_REACHED",
  "message": "Has alcanzado tu límite diario de mensajes con CALI.",
  "limit": 10,
  "reset_at": "2026-06-14T00:00:00Z",
  "upgrade_url": "cali://upgrade"
}
```

-----

### FD-ARCH-05 · MÓDULO DE IA — INSTANCIA ÚNICA CON ACCESO DUAL

**Problema detectado (DUP-06):**  
Training_Engine.md y Nutrition_Engines.md documentan el módulo de IA como si fueran dos sistemas independientes.

**Decisión final:**  
**Un único `AIModule` en NestJS** que tiene acceso al contexto de entrenamiento y nutrición simultáneamente. El módulo de IA es transversal y no pertenece a ningún dominio específico.

**Responsabilidades del AIModule:**

- Construir el contexto del usuario (llamadas a Training y Nutrition services)
- Gestionar el historial de conversación
- Enviar el prompt a Claude API
- Parsear tool calls y ejecutar acciones (registrar comida, actualizar entrenamiento, etc.)
- Rate limiting y conteo de tokens

**Tool calls de CALI disponibles en v1.0:**

|Tool                      |Descripción                                    |
|--------------------------|-----------------------------------------------|
|`log_food`                |Registrar alimento en food_diary               |
|`log_water`               |Registrar agua en hydration_logs               |
|`log_workout_set`         |Registrar serie/reps en workout_logs           |
|`get_daily_summary`       |Consultar resumen nutricional del día          |
|`calculate_meal`          |Calcular macros de una combinación de alimentos|
|`complete_workout_session`|Marcar sesión como completada                  |

-----

### FD-ARCH-06 · SINCRONIZACIÓN CON APPLE HEALTH / HEALTH CONNECT

**Problema detectado (RE-03):**  
No hay especificación de cuándo se dispara la sincronización. Sync síncrono al abrir la app genera spikes de carga.

**Decisión final:**  
**Background sync asíncrono con BullMQ — nunca sync síncrono en apertura de app.**

**Flujo de sincronización:**

1. La app envía los datos de Health al backend via `POST /health/sync` **en background** (no bloquea la UI)
1. El backend encola el job en BullMQ
1. El worker procesa: valida, deduplication, inserta en `health_data`
1. La invalidación del caché de hidratación y daily_summary se dispara como efecto secundario

**Frecuencia:**

- Al abrir la app: solicitar sync de las últimas 24h (no bloquea)
- Cada 6 horas si la app está en background (iOS Background Fetch / Android WorkManager)

**Datos importados en v1.0:**  
Pasos del día, último peso registrado, minutos de sueño de anoche

-----

### FD-ARCH-07 · ONBOARDING STATE MACHINE

**Problema detectado (FM-08):**  
Sin definición del estado de onboarding incompleto, el usuario puede quedar atrapado.

**Decisión final — State machine canónica:**

```
paso 0: inicio / no iniciado
paso 1: nombre + apellido
paso 2: fecha de nacimiento + sexo
paso 3: altura + peso + peso objetivo + unidades
paso 4: objetivo (ganancia muscular / pérdida de grasa / recomposición / mantenimiento)
paso 5: frecuencia de entrenamiento (3/4/5/6 días)
paso 6: evaluación de movimientos (reps máximas)
paso 7: completado → generación de rutina + cálculo de macros
```

**Comportamiento al abandono:**

- El paso actual se guarda en `users.onboarding_step` (campo en USERS — ver FD-DB-01)
- Al reabrir la app, si `onboarding_complete = FALSE`, el usuario retoma desde `onboarding_step`
- Los datos de pasos anteriores se conservan: el usuario no repite lo ya completado
- Si el usuario tiene `onboarding_step >= 4` pero no completó evaluación: el sistema puede generar una rutina de Principiante con evaluación pendiente, permitiendo usar la app inmediatamente

-----

## SECCIÓN 5 — DECISIONES DE SEGURIDAD

-----

### FD-SEC-01 · GDPR Y DERECHO AL OLVIDO — IMPLEMENTACIÓN OBLIGATORIA v1.0

**Problema detectado (RS-01, FM-02):**  
Bloqueante de lanzamiento en App Store (requerido desde iOS 15) y bloqueante legal para España (GDPR).

**Implementación canónica — Account Deletion Flow:**

```
Usuario → Configuración → Eliminar cuenta
  → Modal de confirmación con advertencia de datos perdidos
  → Solicitud de confirmación adicional (escribir "ELIMINAR")
  → POST /users/me/delete-request
  → Backend marca users.deleted_at = NOW() (soft delete)
  → Job asíncrono en BullMQ: borrado en cascada de todos los datos en 30 días
  → Email de confirmación al usuario
  → Logout forzado del dispositivo
```

**Datos que se borran en cascada (hard delete a los 30 días):**

- `body_measurements`
- `training_programs`, `workout_sessions`, `workout_logs`
- `food_diary`
- `water_logs`
- `health_data`
- `ai_conversations`, `ai_messages`
- `goals`, `achievements`
- `subscriptions` (cancelación en RevenueCat)
- `users` (registro principal)

**Datos que se anonimanizan (no se borran para métricas agregadas):**

- Eventos de analítica en PostHog (sin PII)

**Período de gracia:** 30 días. El usuario puede reactivar la cuenta dentro de este período contactando soporte. El job de borrado verifica `deleted_at < NOW() - INTERVAL '30 days'` antes de ejecutar.

**Política de privacidad:** Debe incluir sección explícita de derecho de eliminación, exportación y acceso, verificada por legal antes del lanzamiento.

-----

### FD-SEC-02 · GESTIÓN DE CLAVES — AWS KMS

**Problema detectado (RT-05):**  
Las claves RS256 no deben almacenarse en variables de entorno de ECS (accesibles para cualquier desarrollador con permisos IAM).

**Decisión final:**

- Supabase gestiona sus propias claves RS256 internamente — no es responsabilidad del backend de CALI-NUTRI AI
- La clave maestra para encriptación de `AI_MESSAGES` se gestiona en **AWS KMS** — nunca en variables de entorno
- El acceso a KMS se otorga al Task Role de ECS Fargate (IAM role, no credenciales estáticas)
- Rotación de claves: automática en KMS cada 365 días

-----

### FD-SEC-03 · CERTIFICATE PINNING

**Problema detectado (RS-05):**  
Sin certificate pinning, tokens JWT pueden interceptarse en redes públicas.

**Decisión final:**  
Implementar certificate pinning para el dominio de la API de CALI-NUTRI AI usando `react-native-ssl-pinning`. **No implementar para dominios de terceros** (Claude API, Supabase, USDA) ya que sus certificados rotan frecuentemente y causarían falsos bloqueos.

**Implementación v1.0:** Solo para `api.calinutri.app` (dominio propio).  
**Implementación v1.1:** Evaluar OkHttp certificate pinning en Android para mayor cobertura.

-----

## SECCIÓN 6 — DECISIONES DE PRODUCTO Y MVP SCOPE

-----

### FD-PROD-01 · FUNCIONALIDADES EXCLUIDAS DEL MVP v1.0 — LISTA DEFINITIVA

Las siguientes funcionalidades están **excluidas sin excepción** del MVP v1.0:

|#   |Funcionalidad                              |Origen             |Versión objetivo          |
|----|-------------------------------------------|-------------------|--------------------------|
|F-01|Planificador de comidas (pantalla dedicada)|Nutrition_Engine.md|v2.0                      |
|F-02|Recetas inteligentes (pantalla dedicada)   |Nutrition_Engine.md|v2.0                      |
|F-03|Fotografía de alimentos → macros           |Nutrition_Engine.md|v2.0                      |
|F-04|Código de barras                           |Nutrition_Engine.md|v2.0                      |
|F-05|Ajuste por clima en hidratación            |Nutrition_Engine.md|v2.0                      |
|F-06|Frecuencia cardíaca de Apple Health        |Nutrition_Engine.md|v2.0                      |
|F-07|Deload automático (acción)                 |Training_Engine.md |v1.1                      |
|F-08|Ajuste de volumen por sueño < 6h           |Training_Engine.md |v1.1                      |
|F-09|Logros completos (Achievements)            |Data_Base.md       |v2.0 (solo streak en v1.0)|
|F-10|Admin module y Webhooks                    |API.md             |v2.0                      |
|F-11|Analytics avanzados                        |Architecture.md    |v2.0                      |
|F-12|Ajuste automático de calorías (silencioso) |Nutrition_Engine.md|v1.1                      |
|F-13|Apple Sign-In                              |MVP.md             |v1.1                      |
|F-14|Exportación de datos                       |MVP.md             |v1.1                      |
|F-15|WebSocket bidireccional                    |Architecture.md    |v2.0                      |
|F-16|Admin via Supabase Studio                  |—                  |Operaciones manuales MVP  |

-----

### FD-PROD-02 · FUNCIONALIDADES AGREGADAS AL MVP v1.0 — OBLIGATORIAS

Las siguientes funcionalidades **no estaban en el MVP original** pero son **bloqueantes de lanzamiento**:

|#   |Funcionalidad                           |Motivo                                   |Sprint asignado     |
|----|----------------------------------------|-----------------------------------------|--------------------|
|A-01|Offline queue (workout, food, agua)     |Caso de uso central sin WiFi             |S1 (fundación)      |
|A-02|Flujo de eliminación de cuenta          |App Store Guidelines + GDPR              |S6 (QA/Polish)      |
|A-03|Preferencias de unidades (kg/lbs, cm/in)|Mercados LATAM, evitar reviews negativos |S2 (onboarding)     |
|A-04|Deep linking desde notificaciones       |Adherencia y UX de notificaciones        |S5 (notificaciones) |
|A-05|Estados de error para APIs externas     |Confianza del usuario en app de salud    |S3–S6 (transversal) |
|A-06|OTA Updates (Expo Updates)              |Corrección de bugs sin revisión de tienda|S1 (fundación CI/CD)|
|A-07|Rate limiting de CALI por tier          |Protección de costos Claude API          |S4 (CALI)           |
|A-08|Onboarding state machine (paso guardado)|UX básica requerida                      |S2 (onboarding)     |

-----

### FD-PROD-03 · OBJETIVO DE ESCALA — NÚMERO DE REFERENCIA ÚNICO

**Problema detectado (INC-07):**  
Architecture.md habla de 10K usuarios al lanzamiento, Vision.md de “cientos de miles”, MVP.md no menciona escala.

**Decisión final — Número único de referencia para todas las decisiones de infraestructura:**

|Fase                  |Usuarios Activos Mensuales|Usuarios Activos Diarios|Objetivo de tiempo        |
|----------------------|--------------------------|------------------------|--------------------------|
|Lanzamiento (Day 1–30)|1,000–5,000               |250–1,250               |Post-lanzamiento inmediato|
|MVP estable           |10,000                    |2,500                   |Mes 3–6                   |
|Escala objetivo       |100,000                   |25,000                  |Mes 12–18                 |
|Visión a largo plazo  |500,000+                  |125,000+                |Año 3+                    |

**Toda decisión de infraestructura debe ser válida para el tier “MVP estable” (10K MAU) sin rediseño, y escalable al tier “Escala objetivo” (100K MAU) con configuración, no con reescritura de código.**

-----

## SECCIÓN 7 — DECISIONES DE ESCALABILIDAD

-----

### FD-SCALE-01 · ESTRATEGIA DE CACHÉ CON REDIS

**Política de caché canónica (todas las keys en Upstash Redis):**

|Dato                   |Key pattern                    |TTL        |Invalidación                        |
|-----------------------|-------------------------------|-----------|------------------------------------|
|Target de hidratación  |`hydration:target:{uid}:{date}`|6 horas    |Al registrar sesión o cambio de peso|
|Búsqueda USDA foods    |`foods:search:{query_hash}`    |24 horas   |No (USDA no cambia frecuentemente)  |
|Perfil del usuario     |`user:profile:{uid}`           |15 minutos |Al actualizar datos del perfil      |
|Contexto IA histórico  |`ai:context:history:{uid}`     |24 horas   |Al registrar nueva sesión/comida    |
|Resumen nutricional hoy|`nutrition:today:{uid}:{date}` |5 minutos  |Al registrar en food_diary          |
|Rate limit AI          |`rate:ai:{uid}:{date}`         |24 horas   |TTL automático                      |
|Rate limit general     |`rate:api:{uid}`               |60 segundos|TTL automático                      |

-----

### FD-SCALE-02 · HEALTH SYNC — ESTRATEGIA DE BACKGROUND JOB

Ver FD-ARCH-06. La cola de sincronización en BullMQ usa **concurrencia 5** en el worker para procesar hasta 5 syncs simultáneos sin saturar la base de datos.

**Configuración de la cola:**

```typescript
@BullmqProcessor('health-sync')
healthSyncQueue = {
  concurrency: 5,
  limiter: { max: 100, duration: 1000 }, // 100 jobs/segundo máximo
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  }
}
```

-----

### FD-SCALE-03 · CDN PARA ASSETS ESTÁTICOS

**Problema detectado (RE-04):**  
No había estrategia de CDN para assets.

**Decisión final:**  
AWS CloudFront delante de S3 para todos los assets estáticos (imágenes de ejercicios, iconos del catálogo, thumbnails de progreso).

**Configuración:**

- Cache-Control: `max-age=31536000, immutable` para assets versionados
- Distribución: regiones de edge en LATAM (São Paulo) + Europa (Madrid) para los mercados objetivo

-----

## SECCIÓN 8 — DECISIONES DE INFRAESTRUCTURA

-----

### FD-INFRA-01 · TIMELINE OFICIAL — 12 SEMANAS REALES

**Problema detectado (INC-05):**  
Architecture.md presentaba un roadmap de 12 sprints que equivalía a 24 semanas. MVP.md definía 12 semanas. Se adoptan las 12 semanas de MVP.md como timeline oficial.

**Definición:** Los “sprints” de Architecture.md eran de 1 semana. El MVP se desarrolla en sprints de 1–2 semanas según complejidad.

**Timeline canónico (fuente única):**

|Semanas|Sprint                            |Entregable principal                                                                                                                  |Incluye post-auditoría                          |
|-------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
|1–2    |S1 — Fundación                    |Repo, CI/CD con OTA Updates, DB schema canónico (FD-DB), Auth email + Google, RLS policies, offline queue base                        |✅ OTA Updates, ✅ Offline queue                  |
|3–4    |S2 — Onboarding                   |Flujo de 7 pasos, biométricos, evaluación de movimientos, asignación de rutina, cálculo de macros, preferencia de unidades            |✅ Unidades, ✅ State machine onboarding          |
|5–6    |S3 — Training                     |Registro de sesión, progresión automática, historial de entrenamientos, detección pasiva de estancamiento                             |✅ Detección pasiva                              |
|7–8    |S4 — Nutrición                    |USDA API + base curada, diario nutricional CRUD, resumen diario en tiempo real, búsqueda fuzzy                                        |—                                               |
|9      |S5a — Hidratación + Home          |Cálculo de meta, registro rápido, Dashboard unificado, racha de días                                                                  |—                                               |
|10     |S5b — Coach IA CALI               |Integración Claude API, SSE streaming, tool calls, rate limiting por tier, deep linking notificaciones                                |✅ SSE, ✅ Rate limit, ✅ Deep link                |
|11     |S6a — Integraciones + Monetización|Apple HealthKit (pasos, peso, sueño), Health Connect, RevenueCat paywall, notificaciones push                                         |—                                               |
|12     |S6b — QA + Submission             |QA integral en dispositivos físicos, flujo de eliminación de cuenta, error states APIs externas, RLS testing, encriptación AI_MESSAGES|✅ Account deletion, ✅ Error states, ✅ Encryption|

-----

### FD-INFRA-02 · CI/CD PIPELINE CON OTA UPDATES

**Problema detectado (FM-07):**  
Architecture.md no definía Expo Updates para OTA.

**Decisión final — Pipeline oficial:**

```
Push a main branch
  → GitHub Actions: lint + typecheck + tests (Jest)
  → Build backend: Docker → ECR → deploy ECS Fargate (rolling update)
  → Build mobile:
      Si cambio en JS/TS únicamente → Expo Updates (OTA) — disponible en < 5 minutos
      Si cambio en código nativo → Expo EAS Build → Expo EAS Submit → App Store / Play Store review
```

**Canales de OTA:**

- `production` → usuarios en producción
- `staging` → equipo interno + beta testers

-----

## SECCIÓN 9 — SCHEMA DE BASE DE DATOS CANÓNICO

El schema completo integra todas las decisiones de FD-DB-01 a FD-DB-10. Esta es la fuente única para las migraciones Prisma.

### Tablas confirmadas para v1.0

```
✅ users                  (modificada: eliminados goal, current_weight_kg, experience_level)
✅ user_assessments       (NUEVA: FD-DB-05)
✅ body_measurements      (sin cambios)
✅ goals                  (sin cambios — ahora fuente única de objetivo activo)
✅ training_programs      (agregar: stagnation_alert, stagnation_detected_at)
✅ workout_days           (sin cambios)
✅ exercises              (sin cambios)
✅ workout_exercises      (sin cambios)
✅ workout_sessions       (sin cambios)
✅ workout_logs           (sin cambios)
✅ foods                  (agregar: source VARCHAR, external_id VARCHAR para USDA)
✅ food_diary             (sin cambios — desnormalización intencional FD-DB-04)
✅ water_logs             (sin cambios)
✅ health_data            (eliminar heart_rate_avg de importación activa v1.0)
✅ ai_conversations       (sin cambios)
✅ ai_messages            (modificada: agregar content_iv, tokens_used, tool_calls, latency_ms)
✅ subscriptions          (NUEVA: FD-DB-08)
✅ notification_logs      (NUEVA: FD-DB-10)
```

### Tablas eliminadas del schema v1.0

```
❌ water_targets          (eliminada: FD-DB-02 — calcular en runtime)
❌ daily_summary (tabla)  (eliminada: FD-DB-03 — reemplazada por Materialized View)
❌ recipes                (diferida a v2.0)
❌ recipe_ingredients     (diferida a v2.0)
❌ achievements           (diferida a v2.0 — solo streak en v1.0 como campo en users)
```

### Vista materializada

```
✅ daily_summary_mv       (VISTA MATERIALIZADA: FD-DB-03)
```

### Índices adicionales requeridos (sobre los del documento original)

```sql
-- Para onboarding resumido
CREATE INDEX idx_users_onboarding ON users(onboarding_complete) WHERE onboarding_complete = FALSE;

-- Para subscription lookup
CREATE INDEX idx_subscriptions_status ON subscriptions(user_id, status);

-- Para sincronización de salud
CREATE INDEX idx_health_data_date ON health_data(user_id, imported_at DESC);

-- Para rate limiting queries
-- (Manejado por Redis, no requiere índice en PostgreSQL)

-- Para goals activos
CREATE INDEX idx_goals_active ON goals(user_id, status) WHERE status = 'active';

-- Para workout recents (contexto IA)
CREATE INDEX idx_workout_sessions_recent ON workout_sessions(user_id, started_at DESC);

-- Para food diary recents (contexto IA)
CREATE INDEX idx_food_diary_date ON food_diary(user_id, consumed_at DESC);
```

-----

## SECCIÓN 10 — LÍMITES FREE vs PREMIUM — TABLA OFICIAL

**Problema detectado (FM-03):**  
MVP.md menciona “freemium con límites” sin definir qué es qué. Sin esta tabla, el desarrollador no sabe qué bloquear con el paywall.

**Esta tabla es la fuente única de verdad para RevenueCat y toda lógica de gating:**

|Funcionalidad                       |Free                 |Premium         |
|------------------------------------|---------------------|----------------|
|**Entrenamiento**                   |                     |                |
|Programas de entrenamiento activos  |1 programa           |Ilimitados      |
|Progresión automática               |✅ Activada           |✅ Activada      |
|Historial de entrenamientos         |30 días              |Ilimitado       |
|Semana de descarga sugerida por CALI|✅                    |✅               |
|**Nutrición**                       |                     |                |
|Registro de alimentos               |✅ Ilimitado          |✅ Ilimitado     |
|Historial nutricional               |30 días              |Ilimitado       |
|Base de alimentos USDA              |✅                    |✅               |
|Cálculo de macros                   |✅                    |✅               |
|**Hidratación**                     |                     |                |
|Registro de agua                    |✅ Ilimitado          |✅ Ilimitado     |
|**Coach IA CALI**                   |                     |                |
|Mensajes por día                    |10 mensajes/día      |100 mensajes/día|
|Tool calls (registrar vía chat)     |✅ (dentro del límite)|✅               |
|**Progreso y Analítica**            |                     |                |
|Gráfica de peso                     |30 días              |Ilimitado       |
|Adherencia de entrenamiento         |7 días               |90 días         |
|Adherencia nutricional              |7 días               |90 días         |
|Records personales                  |✅                    |✅               |
|**Integraciones**                   |                     |                |
|Apple Health / Health Connect       |❌ No                 |✅ Sí            |
|**Notificaciones**                  |                     |                |
|Recordatorios básicos               |✅                    |✅               |
|Notificaciones inteligentes         |❌                    |✅ v1.1          |
|**Gamificación**                    |                     |                |
|Racha de días activos               |✅                    |✅               |
|Logros (v2.0)                       |Básicos              |Todos           |

**Planes de suscripción Premium:**

- Premium Mensual: $9.99 USD / mes
- Premium Anual: $59.99 USD / año (equivale a $4.99/mes — ahorro del 50%)
- Trial gratuito: 7 días Premium para todos los usuarios nuevos

**Implementación técnica del gating:**  
El campo `users.tier` (‘free’ | ‘premium’) se mantiene sincronizado con RevenueCat via webhook `POST /webhooks/revenuecat`. El NestJS guard `PremiumGuard` verifica el tier para endpoints restringidos.

-----

## SECCIÓN 11 — TIMELINE OFICIAL DEL MVP

Ver FD-INFRA-01 para el timeline completo. Resumen ejecutivo:

**12 semanas · Equipo mínimo: 2 desarrolladores + 1 PM/Diseñador**

|Hito                        |Semana|Criterio                                         |
|----------------------------|------|-------------------------------------------------|
|Auth + DB schema funcionando|2     |App con login en simulador iOS/Android           |
|Onboarding completo         |4     |Usuario ve rutina y macros después del onboarding|
|Entrenamiento completo      |6     |Usuario registra sesión completa con progresión  |
|Nutrición completa          |8     |Usuario registra alimentación del día con macros |
|Home Dashboard              |9     |Vista unificada del día                          |
|CALI (chat IA)              |10    |CALI responde con contexto y ejecuta tool calls  |
|Integraciones + Paywall     |11    |Apple Health sync + Premium activo               |
|Submission                  |12    |App enviada a App Store y Google Play            |

-----

## SECCIÓN 12 — CRITERIOS DE LANZAMIENTO ACTUALIZADOS

**Un feature está completo cuando cumple los criterios de DoD del MVP.md.**  
**La app lanza cuando cumple TODOS los criterios listados abajo:**

### Criterios originales (MVP.md) — Todos vigentes

- [ ] Onboarding completo en < 5 minutos
- [ ] Rutina generada correctamente para los 3 niveles
- [ ] Macros calculados con fórmula Mifflin-St Jeor validada
- [ ] USDA búsqueda de alimentos < 500ms
- [ ] Registro de series/reps sin crashes en iOS y Android
- [ ] CALI respondiendo con contexto real en 20 escenarios de prueba
- [ ] RevenueCat configurado y probado en Sandbox
- [ ] Apple Health lectura de pasos funcionando en iPhone real
- [ ] Rating ≥ 4.2 en beta testing

### Criterios adicionales post-auditoría — Todos bloqueantes

- [ ] **Offline:** Registro de entrenamiento y comida funciona sin conexión a internet (probado en modo avión)
- [ ] **Offline sync:** Datos registrados offline se sincronizan correctamente al recuperar conexión
- [ ] **Account deletion:** Flujo de eliminación de cuenta funciona end-to-end; datos borrados confirmados en base de datos tras período de gracia
- [ ] **RLS:** Test automatizado verifica que ningún usuario puede leer datos de otro usuario
- [ ] **Rate limit CALI:** Usuario Free alcanza límite de 10 mensajes y recibe error correcto
- [ ] **Premium gate:** Funcionalidades premium están bloqueadas para usuarios free
- [ ] **RevenueCat webhook:** Cambio de tier se refleja en la app en < 30 segundos tras pago
- [ ] **CALI SLA:** p95 de respuesta de CALI < 6 segundos medido en staging con carga real
- [ ] **Deep linking:** Notificación de recordatorio de entrenamiento abre la pantalla de entrenamiento directamente
- [ ] **Unidades:** Preferencia kg/lbs persiste entre sesiones y se aplica en todos los módulos
- [ ] **Error states:** Cuando Claude API está caída, el usuario ve mensaje de error amigable (no crash)
- [ ] **Error states:** Cuando USDA está caído, la búsqueda usa la base local de 500 alimentos
- [ ] **Encriptación AI_MESSAGES:** Verificar que el campo `content` en la base de datos no es legible en texto plano
- [ ] **Política de privacidad:** Publicada, incluye sección de eliminación de datos, aprobada por legal
- [ ] **Onboarding state machine:** Usuario que abandona en paso 3 retoma desde paso 3 al re-abrir la app
- [ ] **OTA Updates:** Corrección de bug JS desplegada via OTA sin revisión de tienda (probado en pre-producción)

-----

## REGISTRO DE CAMBIOS

|Versión|Fecha     |Cambio                                                                    |Resuelve                                                                                    |
|-------|----------|--------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
|1.0.0  |Junio 2026|Documento inicial — resuelve todas las inconsistencias del Audit_report.md|INC-01 a INC-10, DUP-01 a DUP-06, RT-01 a RT-06, RE-01 a RE-04, RS-01 a RS-05, FM-01 a FM-08|

-----

*FinalDecisions.md · CALI-NUTRI AI · Emitido por CTO/Arquitectura · Junio 2026*  
*Próxima revisión obligatoria: inicio de Sprint S3 o cuando se detecte cualquier nueva inconsistencia entre documentos.*