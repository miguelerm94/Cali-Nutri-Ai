# CALI-NUTRI AI

## MVP.md — Versión 1.0

### Documento de Alcance para Lanzamiento en App Store y Google Play

**Clasificación:** Documento de Producto Interno  
**Estado:** Aprobado para Desarrollo  
**Versión:** 1.0.0  
**Última actualización:** Junio 2026  
**Owner:** Product & Architecture Team

-----

## ÍNDICE

1. [Filosofía del MVP](#1-filosofía-del-mvp)
1. [Criterios de Inclusión / Exclusión](#2-criterios-de-inclusión--exclusión)
1. [Módulos del MVP](#3-módulos-del-mvp)
1. [Pantallas Requeridas](#4-pantallas-requeridas)
1. [Motor de Entrenamiento — Alcance v1.0](#5-motor-de-entrenamiento--alcance-v10)
1. [Motor de Nutrición — Alcance v1.0](#6-motor-de-nutrición--alcance-v10)
1. [Motor de Hidratación — Alcance v1.0](#7-motor-de-hidratación--alcance-v10)
1. [Coach IA CALI — Alcance v1.0](#8-coach-ia-cali--alcance-v10)
1. [Integraciones v1.0](#9-integraciones-v10)
1. [Stack Técnico Confirmado](#10-stack-técnico-confirmado)
1. [Requisitos No Funcionales](#11-requisitos-no-funcionales)
1. [Definición de Hecho (DoD)](#12-definición-de-hecho-dod)
1. [Sprints y Timeline](#13-sprints-y-timeline)
1. [Criterios de Lanzamiento](#14-criterios-de-lanzamiento)
1. [Backlog Post-MVP (v2.0)](#15-backlog-post-mvp-v20)
1. [Riesgos y Mitigaciones](#16-riesgos-y-mitigaciones)

-----

## 1. FILOSOFÍA DEL MVP

### Principio Rector

> **Lanzar con lo mínimo que entrega valor real. No con lo mínimo posible.**

Un MVP de una aplicación de salud y fitness tiene un estándar de calidad más alto que el promedio: los usuarios la comparan inmediatamente contra MyFitnessPal, Hevy, y Strong. No puede sentirse como un prototipo.

El objetivo del MVP no es construir el producto completo. Es **validar la hipótesis central**:

> *“Un usuario de calistenia usará diariamente una sola aplicación que gestione su entrenamiento, nutrición e hidratación con IA contextual, en lugar de tres aplicaciones separadas.”*

### Las Tres Preguntas del MVP

Antes de incluir cualquier funcionalidad, se aplican estas tres preguntas:

|Pregunta                                                                  |Criterio de inclusión         |
|--------------------------------------------------------------------------|------------------------------|
|¿Un usuario nuevo puede completar su primera sesión en menos de 5 minutos?|Si no → simplificar onboarding|
|¿Esta funcionalidad impacta DAU o retención a 7 días?                     |Si no → diferir a v2.0        |
|¿Puede construirse en menos de 2 semanas por 1 desarrollador senior?      |Si no → simplificar o diferir |

### Métricas de Validación del MVP

Si al mes 2 post-lanzamiento se alcanzan estos números, el MVP es un éxito:

- **DAU/MAU ≥ 0.25** — Usuarios activos diarios sobre mensuales (benchmark: apps fitness top = 0.20–0.30)
- **Retención día 7 ≥ 30%** — Estándar industria apps fitness
- **Retención día 30 ≥ 15%** — Umbral mínimo para justificar inversión en v2.0
- **≥ 3 sesiones de entrenamiento registradas** por el 40% de usuarios en el primer mes
- **Rating App Store / Google Play ≥ 4.2** en los primeros 100 reviews

-----

## 2. CRITERIOS DE INCLUSIÓN / EXCLUSIÓN

### Reglas de Corte

|Categoría                |Incluido en v1.0                                                         |Diferido a v2.0+                                                 |
|-------------------------|-------------------------------------------------------------------------|-----------------------------------------------------------------|
|**Autenticación**        |Email + contraseña, Google Sign-In                                       |Apple Sign-In (v1.1), biometría                                  |
|**Perfil**               |Datos biométricos, objetivo, nivel, frecuencia                           |Foto de perfil, historial de peso detallado                      |
|**Evaluación inicial**   |Test de reps máximas por movimiento                                      |Test de fuerza relativa, análisis de video                       |
|**Entrenamiento**        |Rutinas generadas, registro de series/reps/RPE                           |Personalización avanzada de ejercicios, supersets, circuitos     |
|**Progresión**           |Progresión automática basada en RPE                                      |Periodización por bloques, deload automático                     |
|**Biblioteca ejercicios**|15–20 ejercicios core (calistenia básica + barra)                        |Variaciones avanzadas, video demostrativo                        |
|**Nutrición**            |Cálculo de macros, búsqueda de alimentos, registro manual                |Escaneo por foto, código de barras, recetas personalizadas       |
|**Base de alimentos**    |USDA FoodData Central (API) + 500 alimentos comunes precargados          |Base regional expandida, alimentos de marca                      |
|**Hidratación**          |Cálculo de meta, registro por vasos/litros                               |Integración con smart bottles, recordatorios adaptativos         |
|**IA**                   |Chat contextual con acciones (registrar comida, actualizar entrenamiento)|Predicción de resultados, ajuste automático sin input del usuario|
|**Analítica**            |Dashboard semanal básico, gráfica de peso, adherencia                    |Analítica avanzada, comparativas periódicas, tendencias          |
|**Integraciones**        |Apple Health (lectura de pasos, peso, sueño), Health Connect             |Apple Watch, Garmin, Polar, Whoop                                |
|**Notificaciones**       |Recordatorio de entrenamiento, hidratación                               |Notificaciones inteligentes adaptativas                          |
|**Monetización**         |Acceso freemium con límites, suscripción premium (RevenueCat)            |In-app purchases de contenido, planes de equipo                  |
|**Social**               |Ninguno                                                                  |Feed, retos grupales, rankings                                   |
|**Gamificación**         |Racha de días activos                                                    |Badges, XP, logros, rankings                                     |

-----

## 3. MÓDULOS DEL MVP

### Arquitectura de Módulos v1.0

```
┌────────────────────────────────────────────────────────────────────┐
│                        CALI-NUTRI AI v1.0                          │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   ONBOARDING │  │    PERFIL    │  │   AUTH       │             │
│  │   & SETUP    │  │  & PROGRESO  │  │   SEGURA     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ ENTRENAMIENTO│  │  NUTRICIÓN   │  │  HIDRATACIÓN │             │
│  │   ENGINE     │  │   ENGINE     │  │   ENGINE     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    COACH IA — CALI                           │  │
│  │         (Claude API con contexto completo del usuario)       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   DASHBOARD  │  │  ANALYTICS   │  │   HEALTH     │             │
│  │    HOME      │  │   BÁSICA     │  │    SYNC      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────────────────────────────────────────────┘
```

### Prioridad por Módulo

|Módulo                       |Prioridad   |Justificación                          |
|-----------------------------|------------|---------------------------------------|
|Auth + Onboarding            |P0 — Crítico|Sin esto no existe la app              |
|Perfil + Biométricos         |P0 — Crítico|Base para todos los cálculos           |
|Motor de Entrenamiento       |P0 — Crítico|Core value proposition #1              |
|Motor de Nutrición           |P0 — Crítico|Core value proposition #2              |
|Dashboard Home               |P0 — Crítico|Retención diaria                       |
|Motor de Hidratación         |P1 — Alto   |Diferenciador vs competidores          |
|Coach IA CALI                |P1 — Alto   |Diferenciador principal de la marca    |
|Analítica básica             |P1 — Alto   |Motivación y retención                 |
|Apple Health / Health Connect|P2 — Medio  |Nice-to-have para lanzamiento          |
|Notificaciones               |P2 — Medio  |Impacta DAU pero no bloquea lanzamiento|
|RevenueCat / Paywall         |P2 — Medio  |Necesario antes de lanzamiento público |

-----

## 4. PANTALLAS REQUERIDAS

### Mapa Completo de Pantallas v1.0

```
AUTH
├── Splash Screen
├── Onboarding (slides informativos — 3 pantallas)
├── Login (email/contraseña + Google)
├── Registro
└── Forgot Password

ONBOARDING SETUP (primera vez, post-registro)
├── Paso 1: Datos biométricos (edad, sexo, peso, estatura)
├── Paso 2: Objetivo principal (ganar músculo / perder grasa / recomposición / mantener)
├── Paso 3: Nivel de experiencia (principiante / intermedio / avanzado)
├── Paso 4: Frecuencia semanal (3 / 4 / 5 / 6 días)
├── Paso 5: Test de evaluación inicial (reps máximas por movimiento)
└── Paso 6: Resumen de perfil generado (macros + rutina asignada)

HOME / DASHBOARD
└── Dashboard Principal
    ├── Anillo de progreso diario (entrenamiento + nutrición + hidratación)
    ├── Card de entrenamiento del día
    ├── Card de progreso calórico
    ├── Card de hidratación
    ├── Racha de días activos
    └── Botón flotante de Coach CALI

ENTRENAMIENTO
├── Pantalla de Rutina Semanal (vista de semana)
├── Sesión de Entrenamiento Activa
│   ├── Ejercicio actual (nombre, sets planeados vs completados)
│   ├── Input de reps realizadas y RPE
│   ├── Timer de descanso
│   ├── Botón "Siguiente ejercicio"
│   └── Botón "Finalizar sesión"
├── Resumen Post-Sesión (volumen total, comparativa vs semana anterior)
├── Historial de Entrenamientos (lista de sesiones pasadas)
└── Detalle de Sesión Pasada

NUTRICIÓN
├── Diario Nutricional (vista del día)
│   ├── Resumen de macros (proteína, grasa, carbos, calorías)
│   ├── Comidas del día (desayuno, almuerzo, cena, snacks)
│   └── Botón Agregar Alimento por comida
├── Búsqueda de Alimentos
│   ├── Barra de búsqueda (texto libre)
│   ├── Resultados con macros
│   └── Recientes / Frecuentes
├── Detalle de Alimento (macros por 100g + gramaje editable)
├── Alimentos Frecuentes (acceso rápido)
└── Resumen Nutricional Semanal

HIDRATACIÓN
└── Widget en Dashboard + Pantalla Dedicada
    ├── Meta diaria calculada (ml)
    ├── Ingesta actual (barra de progreso)
    ├── Botones de registro rápido (200ml, 300ml, 500ml, personalizado)
    └── Historial del día (vasos registrados con hora)

COACH IA — CALI
├── Chat Principal
│   ├── Historial de conversación
│   ├── Input de texto
│   └── Acciones rápidas (sugerencias contextuales)
└── Modal de Confirmación de Acción
    (cuando CALI propone registrar algo, el usuario confirma)

PROGRESO
├── Gráfica de Peso Corporal (línea temporal)
├── Adherencia Semanal (entrenamiento + nutrición + hidratación)
├── Records Personales por Ejercicio (reps máximas)
└── Registro Manual de Peso

PERFIL Y CONFIGURACIÓN
├── Perfil de Usuario (datos, objetivo, nivel)
├── Editar Biométricos
├── Preferencias de Notificaciones
├── Conexión Apple Health / Health Connect (toggle)
├── Suscripción Premium (estado + upgrade)
├── Privacidad y Datos
└── Cerrar Sesión

PAYWALL / PREMIUM
├── Pantalla de Upgrade
│   ├── Lista de beneficios premium
│   ├── Opciones de plan (mensual / anual)
│   └── Botón de compra (RevenueCat)
└── Pantalla de Confirmación de Compra
```

**Total de pantallas únicas: 34**
**Estimación sin paywall ni onboarding: 28 pantallas core**

-----

## 5. MOTOR DE ENTRENAMIENTO — ALCANCE v1.0

### Qué se construye

#### 5.1 Evaluación Inicial

El usuario registra repeticiones máximas en los movimientos de diagnóstico. Esto determina el nivel real y la rutina asignada.

**Movimientos de evaluación:**

|Categoría|Ejercicio         |Nivel Principiante|Nivel Intermedio|Nivel Avanzado|
|---------|------------------|------------------|----------------|--------------|
|Empuje   |Flexiones normales|0–9               |10–20           |21+           |
|Tracción |Dominadas         |0–2               |3–8             |9+            |
|Pierna   |Sentadilla normal |0–19              |20–40           |41+           |
|Core     |Plancha (segundos)|0–29s             |30–60s          |61s+          |

Si el usuario no puede hacer dominadas → se asigna variante de remo en mesa o negativas.

#### 5.2 Generación de Rutina

**Frecuencias disponibles:**

|Frecuencia   |Split                                  |Semanas de bloque   |
|-------------|---------------------------------------|--------------------|
|3 días/semana|Full Body A / Full Body B / Full Body A|4 semanas por bloque|
|4 días/semana|Upper / Lower / Upper / Lower          |4 semanas por bloque|
|5 días/semana|Push / Pull / Legs / Upper / Lower     |4 semanas por bloque|
|6 días/semana|Push / Pull / Legs (x2)                |4 semanas por bloque|

**Ejercicios incluidos en v1.0 (biblioteca mínima viable):**

|Categoría          |Ejercicios                                                               |
|-------------------|-------------------------------------------------------------------------|
|Empuje horizontal  |Flexiones, Flexiones diamante, Flexiones inclinadas, Flexiones declinadas|
|Empuje vertical    |Pike Push Ups, Elevated Pike Push Ups                                    |
|Tracción vertical  |Dominadas pronadas, Chin Ups supinados, Dominadas negativas              |
|Tracción horizontal|Remo en mesa (bodyweight row)                                            |
|Pierna             |Sentadilla, Zancada, Sentadilla búlgara, Hip Thrust                      |
|Core               |Plancha, Plancha lateral, Elevaciones de piernas, Hollow Body Hold       |
|Compensación       |Extensión de espalda en suelo, Puente de glúteos                         |

**Total: 18 ejercicios con progresiones claras definidas**

#### 5.3 Prescripción por Sesión

Cada sesión incluye:

- **Series:** 3–5 por ejercicio según nivel y fase
- **Reps:** Zona objetivo calculada por nivel (e.g., 3×6–8 dominadas nivel intermedio)
- **RPE objetivo:** 7–8 para hipertrofia, 6–7 para volumen, 9 para semanas de intensidad
- **Descanso prescrito:** 90s–3min según intensidad del movimiento
- **Notas de ejecución:** Texto breve (no video en v1.0)

#### 5.4 Progresión Automática

**Regla de progresión sencilla y efectiva para v1.0:**

```
SI el usuario alcanza el límite superior de reps en TODAS las series
  con RPE ≤ 8
ENTONCES la siguiente sesión:
  → Incrementar 1–2 reps en la zona objetivo
  O si ya se supera el rango de reps superior:
  → Avanzar a variante más difícil del ejercicio
```

**Ejemplo de progresión:**

```
Semana 1: Flexiones 3×8 (zona 6–10) RPE 7 → progresa
Semana 2: Flexiones 3×10 (zona 8–12) RPE 8 → progresa
Semana 3: Flexiones 3×12 (zona 10–14) → cambio a Flexiones Diamante 3×6–8
```

#### 5.5 Registro de Sesión

El usuario registra por cada serie:

- **Reps realizadas** (número)
- **RPE percibido** (escala 1–10, con referencia visual)

Campos opcionales (no obligatorios para reducir fricción):

- Notas de la serie
- Dolor o molestia (flag)

**Tiempo objetivo de registro:** < 5 segundos por serie.

#### 5.6 Qué NO se construye en v1.0

- Deload automático (se diferiere a v1.1)
- Edición manual de la rutina por el usuario
- Creación de rutinas personalizadas
- Video demostrativo de ejercicios
- Supersets / circuitos / AMRAP
- Estimación de 1RM
- Volumen semanal por grupo muscular (dashboard analítico — v2.0)

-----

## 6. MOTOR DE NUTRICIÓN — ALCANCE v1.0

### Qué se construye

#### 6.1 Cálculo de Macros Personalizados

**Flujo de cálculo (ejecutado en backend durante onboarding):**

```
1. TMB = Mifflin-St Jeor
   Hombre: (10 × peso_kg) + (6.25 × altura_cm) − (5 × edad) + 5
   Mujer:  (10 × peso_kg) + (6.25 × altura_cm) − (5 × edad) − 161

2. TDEE = TMB × Factor de Actividad
   Sedentario (0 días/semana): × 1.2
   Ligero (1–2 días): × 1.375
   Moderado (3–4 días): × 1.55
   Activo (5–6 días): × 1.725
   Muy activo (7 días): × 1.9

3. Calorías objetivo según goal:
   Déficit (perder grasa):       TDEE − 300 kcal/día
   Superávit (ganar músculo):    TDEE + 200 kcal/día
   Recomposición:                TDEE (ajuste por macros)
   Mantenimiento:                TDEE

4. Distribución de macros:
   Proteína: 1.8–2.2 g/kg de peso corporal (usar 2.0 por defecto)
   Grasa: 25% de calorías totales (mínimo 0.8 g/kg)
   Carbohidratos: calorías restantes / 4

5. Ajuste para recomposición:
   Días de entrenamiento: +100 kcal (carbos)
   Días de descanso: −100 kcal (carbos)
```

#### 6.2 Base de Datos de Alimentos

**Fuentes en v1.0:**

|Fuente                          |Detalles                                                 |Implementación                           |
|--------------------------------|---------------------------------------------------------|-----------------------------------------|
|USDA FoodData Central           |API pública, 300k+ alimentos                             |API calls en tiempo real con caché Redis |
|Base propia curada              |500 alimentos comunes en español (mercado LATAM + España)|Seed en base de datos propia (PostgreSQL)|
|Alimentos recientes del usuario |Últimos 50 alimentos registrados                         |Cache local (MMKV) + BD                  |
|Alimentos frecuentes del usuario|Top 20 más usados                                        |Calculado dinámicamente                  |

**Campos por alimento:**

- Nombre
- Calorías por 100g
- Proteína por 100g
- Grasas por 100g
- Carbohidratos por 100g
- Fibra por 100g (opcional, mostrar si disponible)

#### 6.3 Registro de Alimentos

**Flujo de registro (objetivo: < 10 segundos):**

1. Usuario toca “+” en la comida (desayuno/almuerzo/cena/snack)
1. Aparece búsqueda de alimentos
1. Selecciona alimento → aparece gramaje editable (default: 100g)
1. Ajusta gramaje → macros se actualizan en tiempo real
1. Confirma → se suma al diario

**Comidas del día:**

- Desayuno
- Almuerzo
- Cena
- Snack (uno o múltiples)

#### 6.4 Visualización Diaria

El diario nutricional muestra:

- Barra de progreso de calorías (consumido vs objetivo)
- Barra de progreso por macro (proteína, grasa, carbos)
- Lista de alimentos por comida con macros individuales
- Total calórico al pie

**Indicadores de color:**

- Verde: dentro del rango (±10% del objetivo)
- Amarillo: entre 10–20% de desviación
- Rojo: +20% exceso o déficit importante de proteína

#### 6.5 Qué NO se construye en v1.0

- Escaneo de alimentos por cámara
- Lectura de código de barras
- Recetas y comidas compuestas guardables
- Plan de comidas semanal automático
- Análisis micronutricional (vitaminas, minerales)
- Integración con supermercados o delivery
- Ajuste automático de calorías por entrenamiento del día

-----

## 7. MOTOR DE HIDRATACIÓN — ALCANCE v1.0

### Qué se construye

#### 7.1 Cálculo de Meta Diaria

```
Meta base = peso_kg × 35 ml

Ajuste por actividad:
  + 500 ml si entrenó ese día
  + 250 ml si temperatura > 25°C (dato manual del usuario, no automático en v1.0)

Rango válido: mínimo 1500 ml, máximo 4500 ml
```

#### 7.2 Registro de Ingesta

**Botones de registro rápido:**

- 200 ml (vaso pequeño)
- 300 ml (vaso normal)
- 500 ml (botella pequeña)
- 750 ml (botella mediana)
- Custom (input numérico)

Cada registro se guarda con timestamp (hora del día).

#### 7.3 Visualización

- Barra circular de progreso (consumido / meta)
- Número exacto: “1.2 L de 2.8 L”
- Lista de registros del día con hora
- Mensaje contextual de CALI si falta > 500ml al atardecer

#### 7.4 Notificaciones (v1.0 básico)

Recordatorios fijos configurables:

- Mañana: 8:00 AM
- Mediodía: 12:00 PM
- Tarde: 16:00 PM
- Noche: 20:00 PM

El usuario activa/desactiva individualmente. No hay inteligencia adaptativa en v1.0.

-----

## 8. COACH IA CALI — ALCANCE v1.0

### Filosofía del Coach en v1.0

CALI es el diferenciador principal de la aplicación. No debe sentirse como un chatbot genérico. Tiene contexto completo del usuario en cada conversación.

### 8.1 Contexto Que Recibe CALI en Cada Llamada

```json
{
  "user_profile": {
    "age": 28,
    "sex": "male",
    "weight_kg": 75,
    "height_cm": 178,
    "goal": "muscle_gain",
    "experience_level": "intermediate",
    "training_days_per_week": 4
  },
  "today": {
    "date": "2026-06-13",
    "trained": true,
    "workout_completed": {
      "session_type": "Upper",
      "exercises": [
        { "name": "Dominadas", "sets": [{"reps": 8, "rpe": 8}, {"reps": 7, "rpe": 9}] }
      ],
      "duration_minutes": 52
    },
    "nutrition": {
      "calories_consumed": 1820,
      "calories_target": 2200,
      "protein_g": 142,
      "protein_target_g": 150,
      "carbs_g": 180,
      "fats_g": 55
    },
    "hydration_ml": 1400,
    "hydration_target_ml": 2800
  },
  "week_summary": {
    "workouts_completed": 3,
    "workouts_planned": 4,
    "avg_calories": 2050,
    "avg_protein": 138
  }
}
```

### 8.2 Capacidades de CALI en v1.0

|Capacidad                  |Descripción                                                               |Implementación                          |
|---------------------------|--------------------------------------------------------------------------|----------------------------------------|
|Respuesta contextual       |Responde basándose en el estado real del usuario hoy                      |Contexto JSON en el system prompt       |
|Registro de comida por chat|“Comí 200g de pollo con arroz” → CALI extrae macros y propone registrar   |Tool call: `log_food`                   |
|Actualización de ejercicio |“Hice 10 dominadas, no 8” → CALI actualiza el registro                    |Tool call: `update_exercise_log`        |
|Registro de agua           |“Tomé un litro de agua” → actualiza hidratación                           |Tool call: `log_hydration`              |
|Feedback de entrenamiento  |Analiza sesión completada y da retroalimentación                          |Análisis del contexto + respuesta       |
|Motivación contextual      |Detecta bajo cumplimiento y ofrece apoyo                                  |Lógica de prompts                       |
|Explicación nutricional    |“¿Por qué necesito tanta proteína?”                                       |Knowledge base embebida en system prompt|
|Ajuste de meta de calorías |“Quiero cambiar a déficit más agresivo” → propone cambio, usuario confirma|Tool call: `update_nutrition_goal`      |

### 8.3 Limitaciones Explícitas de CALI v1.0

- **No ajusta la rutina automáticamente** sin que el usuario lo pida explícitamente
- **No predice resultados** futuros
- **No detecta lesiones** ni da consejos médicos
- **No recuerda conversaciones** entre sesiones (solo el contexto del día actual)
- **No genera planes de comida semanales**

Estas limitaciones se comunicarán al usuario con respuestas honestas del tipo: *“Eso estará disponible pronto. Por ahora, puedo ayudarte con…”*

### 8.4 System Prompt de CALI (Estructura)

```
Eres CALI, el coach personal de [nombre_usuario] en CALI-NUTRI AI.

Especialidades:
- Entrenamiento de calistenia (solo peso corporal y barra de dominadas)
- Nutrición para recomposición corporal
- Hidratación deportiva

Personalidad:
- Directo, técnico, motivador
- Basado en evidencia científica
- No das consejos médicos
- Si el usuario describe dolor agudo, recomiendas consultar un médico

Estado actual del usuario hoy:
[CONTEXTO JSON DEL USUARIO]

Reglas:
1. Siempre usa el nombre del usuario
2. Si propones registrar algo, usa las herramientas disponibles
3. Respuestas cortas para preguntas simples, detalladas para consultas técnicas
4. Nunca inventes datos que no están en el contexto
5. Si no sabes algo, dilo con honestidad
```

### 8.5 Modelo y Configuración

|Parámetro         |Valor                          |
|------------------|-------------------------------|
|Modelo            |`claude-sonnet-4-6`            |
|Max tokens        |800 (respuestas de chat cortas)|
|Temperature       |0.7                            |
|Llamadas estimadas|5–10 por usuario activo por día|
|Costo estimado    |~$0.002–0.005 por conversación |

### 8.6 Rate Limiting del Chat

- **Usuarios free:** 15 mensajes/día con CALI
- **Usuarios premium:** Ilimitado
- El contador se resetea a medianoche UTC-local del usuario

-----

## 9. INTEGRACIONES v1.0

### 9.1 Apple Health (iOS)

**Solo lectura en v1.0.** No escribir datos de vuelta a Apple Health en esta versión.

|Dato            |Tipo                                      |Frecuencia de sincronización|
|----------------|------------------------------------------|----------------------------|
|Pasos diarios   |HKQuantityTypeIdentifierStepCount         |Al abrir la app             |
|Peso corporal   |HKQuantityTypeIdentifierBodyMass          |Al abrir la app             |
|Horas de sueño  |HKCategoryTypeIdentifierSleepAnalysis     |Al abrir la app             |
|Calorías activas|HKQuantityTypeIdentifierActiveEnergyBurned|Al abrir la app             |

**Pantalla de onboarding:** El usuario da permisos explícitos. Si los rechaza, la app funciona 100% sin Health.

**Uso de datos importados:**

- Pasos → se muestran en dashboard (contexto para CALI)
- Peso → se importa como registro de peso si el usuario no tiene uno manual para hoy
- Sueño → se muestra en contexto de CALI (no en dashboard principal v1.0)

### 9.2 Google Health Connect (Android)

Equivalente funcional a Apple Health. Mismos datos, mismas reglas.

**Permisos requeridos:**

```
health.permission.READ_STEPS
health.permission.READ_WEIGHT
health.permission.READ_SLEEP
health.permission.READ_ACTIVE_CALORIES_BURNED
```

### 9.3 RevenueCat (Monetización)

**Modelo de suscripción:**

|Plan               |Precio sugerido|Beneficios                                                     |
|-------------------|---------------|---------------------------------------------------------------|
|**Free**           |$0             |3 entrenamientos/semana, 15 mensajes CALI/día, nutrición básica|
|**Premium Mensual**|$9.99/mes      |Todo ilimitado + analítica avanzada                            |
|**Premium Anual**  |$59.99/año     |Todo premium + descuento 50%                                   |

**Límites Free vs Premium:**

|Feature                    |Free   |Premium  |
|---------------------------|-------|---------|
|Entrenamientos/semana      |3      |Ilimitado|
|Mensajes CALI/día          |15     |Ilimitado|
|Historial de entrenamientos|30 días|Ilimitado|
|Exportar datos             |No     |Sí (v1.1)|
|Analítica avanzada         |No     |Sí       |

**Implementación:** RevenueCat SDK para iOS y Android. El paywall se muestra al intentar superar límites del plan free.

-----

## 10. STACK TÉCNICO CONFIRMADO

### Frontend

|Tecnología                 |Versión|Rol                          |
|---------------------------|-------|-----------------------------|
|React Native               |0.74+  |Base mobile cross-platform   |
|Expo SDK                   |51+    |Build system, APIs nativas   |
|TypeScript                 |5.x    |Type safety end-to-end       |
|React Navigation           |v6     |Navegación                   |
|Zustand                    |4.x    |Estado global cliente        |
|TanStack Query             |v5     |Server state + caching       |
|React Native MMKV          |2.x    |Storage local seguro y rápido|
|React Native Reanimated    |3.x    |Animaciones nativas fluidas  |
|Victory Native             |40+    |Gráficas de progreso         |
|React Hook Form + Zod      |latest |Formularios con validación   |
|Expo Notifications         |latest |Push notifications           |
|react-native-health        |latest |Apple HealthKit              |
|react-native-health-connect|latest |Google Health Connect        |
|RevenueCat SDK             |latest |Monetización                 |

### Backend

|Tecnología          |Versión          |Rol                       |
|--------------------|-----------------|--------------------------|
|Node.js             |20 LTS           |Runtime                   |
|NestJS              |10.x             |Framework backend         |
|TypeScript          |5.x              |Type safety               |
|Prisma              |5.x              |ORM + migraciones         |
|PostgreSQL          |15 (Supabase)    |Base de datos principal   |
|Redis (Upstash)     |latest           |Caché + rate limiting     |
|Anthropic Claude API|claude-sonnet-4-6|Coach IA                  |
|JWT + Supabase Auth |—                |Autenticación             |
|AWS S3              |—                |Almacenamiento de archivos|
|Zod                 |3.x              |Validación de DTOs        |

### Infraestructura

|Servicio       |Uso                                    |
|---------------|---------------------------------------|
|Supabase       |PostgreSQL gestionado + Auth + Realtime|
|Upstash Redis  |Caché serverless + rate limiting       |
|AWS ECS Fargate|Backend containerizado                 |
|AWS S3         |Fotos de progreso, assets              |
|Expo EAS       |Build y distribución de la app         |
|GitHub Actions |CI/CD                                  |
|Sentry         |Error monitoring                       |
|PostHog        |Analytics de producto (events)         |

-----

## 11. REQUISITOS NO FUNCIONALES

### Performance

|Métrica                             |Target MVP        |Método de medición          |
|------------------------------------|------------------|----------------------------|
|Tiempo de carga inicial (cold start)|< 3 segundos      |Expo + Sentry performance   |
|Respuesta de CALI                   |< 3 segundos (p50)|Timestamp en API            |
|Búsqueda de alimentos               |< 500ms           |TanStack Query + Redis cache|
|Registro de serie (entrenamiento)   |< 1 segundo       |Optimistic update local     |
|API response time (p95)             |< 300ms           |CloudWatch metrics          |

### Seguridad

- **HTTPS obligatorio** en todas las comunicaciones
- **JWT con expiración de 7 días** + refresh token de 30 días
- **Row-Level Security (RLS)** en Supabase: ningún usuario puede leer datos de otro
- **Datos de salud nunca salen del dispositivo** sin consentimiento explícito
- **Cifrado en reposo** para datos sensibles (biométricos, historial de salud)
- **Rate limiting** en todos los endpoints de API (100 req/min por usuario)
- **Input sanitization** en todos los campos de texto libre
- **No logging de datos de salud** en ningún sistema de monitoring

### Privacidad (GDPR / CCPA compatible desde v1.0)

- Política de privacidad aprobada por legal antes del lanzamiento
- Opción de eliminar cuenta y todos los datos personales (RTBF)
- Exportación de datos disponible en v1.1
- Consentimiento granular para Apple Health / Health Connect
- Los datos no se venden ni comparten con terceros

### Compatibilidad

|Plataforma|Versión mínima      |
|----------|--------------------|
|iOS       |16.0+               |
|Android   |API 29 (Android 10+)|

Justificación: iOS 16 cubre el 95%+ de dispositivos activos. Android 10 es requerido por Health Connect.

### Disponibilidad

- **Uptime objetivo:** 99.5% (permite ~3.6 horas de downtime/mes)
- **Backups de BD:** Automáticos cada 24h (Supabase gestionado)
- **Mantenimiento programado:** Domingos 02:00–04:00 UTC

-----

## 12. DEFINICIÓN DE HECHO (DoD)

Una funcionalidad está **completa** cuando cumple todos los criterios:

### Para cada Feature

- [ ] Código revisado por al menos 1 desarrollador senior (PR review)
- [ ] Tests unitarios con cobertura ≥ 70% en lógica de negocio crítica
- [ ] Tests de integración para todos los endpoints de API
- [ ] Funciona correctamente en iOS y Android
- [ ] Funciona en modo offline (datos disponibles sin conectividad)
- [ ] No hay errores en Sentry durante QA
- [ ] Performance dentro de los targets definidos
- [ ] Accesible (Dynamic Type iOS, font scaling Android)
- [ ] Revisado por diseño (sigue el sistema de diseño definido en UXUI.md)
- [ ] Documentado en el README del módulo

### Para el MVP Completo

- [ ] Todos los módulos P0 y P1 completados y aprobados
- [ ] App pasa la revisión de App Store Guidelines
- [ ] App pasa la revisión de Google Play Policies
- [ ] Política de privacidad y términos de uso publicados
- [ ] RevenueCat configurado y probado en ambiente de Sandbox
- [ ] Sentry configurado con alertas a equipo
- [ ] PostHog configurado con eventos core trackeados
- [ ] Apple Health aprobado por Apple (requiere revisión de HealthKit)
- [ ] CALI respondiendo correctamente con contexto real en al menos 20 escenarios de prueba

-----

## 13. SPRINTS Y TIMELINE

### Estimación: 12 semanas (3 meses) con equipo de 3 personas

**Composición del equipo mínimo:**

- 1 Full-Stack Developer (backend NestJS + React Native)
- 1 Mobile Developer (React Native especialista)
- 1 Product/Design (puede ser el fundador o un PM/Designer part-time)

### Sprint 1–2 (Semanas 1–2): Fundación

|Task                                           |Responsable|
|-----------------------------------------------|-----------|
|Setup de proyecto Expo + estructura de carpetas|Mobile Dev |
|Setup de NestJS con módulos base               |Full-Stack |
|Supabase: schema inicial + RLS policies        |Full-Stack |
|Sistema de autenticación (email + Google)      |Full-Stack |
|Pantallas de Login, Registro, Forgot Password  |Mobile Dev |
|CI/CD con GitHub Actions + Expo EAS            |Full-Stack |

**Entregable:** App con auth funcionando en simulador iOS y Android.

### Sprint 3–4 (Semanas 3–4): Onboarding y Perfil

|Task                                              |Responsable|
|--------------------------------------------------|-----------|
|Flujo de onboarding (6 pasos)                     |Mobile Dev |
|Motor de cálculo: TMB, TDEE, macros (backend)     |Full-Stack |
|Motor de evaluación inicial y asignación de rutina|Full-Stack |
|Pantalla de perfil + edición de biométricos       |Mobile Dev |
|Tests unitarios del motor de cálculo              |Full-Stack |

**Entregable:** Usuario puede registrarse, completar onboarding y ver su rutina y macros asignados.

### Sprint 5–6 (Semanas 5–6): Entrenamiento

|Task                                              |Responsable|
|--------------------------------------------------|-----------|
|API de rutinas (get semana, get sesión)           |Full-Stack |
|Pantalla de rutina semanal                        |Mobile Dev |
|Pantalla de sesión activa (sets, reps, RPE, timer)|Mobile Dev |
|Lógica de progresión automática (backend)         |Full-Stack |
|Pantalla de resumen post-sesión                   |Mobile Dev |
|Historial de entrenamientos                       |Mobile Dev |

**Entregable:** Usuario puede completar y registrar un entrenamiento completo con progresión.

### Sprint 7–8 (Semanas 7–8): Nutrición

|Task                                        |Responsable|
|--------------------------------------------|-----------|
|Integración USDA FoodData API + caché Redis |Full-Stack |
|Seed de base de alimentos curada (500 items)|Full-Stack |
|API de diario nutricional (CRUD)            |Full-Stack |
|Pantalla de diario nutricional (vista día)  |Mobile Dev |
|Búsqueda de alimentos + detalle             |Mobile Dev |
|Alimentos frecuentes / recientes            |Mobile Dev |

**Entregable:** Usuario puede registrar toda su alimentación del día y ver macros en tiempo real.

### Sprint 9 (Semana 9): Hidratación + Dashboard Home

|Task                                                   |Responsable            |
|-------------------------------------------------------|-----------------------|
|API de hidratación (CRUD registro diario)              |Full-Stack             |
|Pantalla de hidratación                                |Mobile Dev             |
|Dashboard Home con anillo de progreso                  |Mobile Dev             |
|Cards de entrenamiento, nutrición e hidratación en Home|Mobile Dev             |
|Racha de días activos                                  |Full-Stack + Mobile Dev|

**Entregable:** Dashboard unificado que muestra el estado del día completo.

### Sprint 10 (Semana 10): Coach IA CALI

|Task                                                    |Responsable|
|--------------------------------------------------------|-----------|
|Integración Anthropic Claude API (backend)              |Full-Stack |
|Context builder (construye JSON de usuario para prompt) |Full-Stack |
|Tool calls: log_food, update_exercise_log, log_hydration|Full-Stack |
|Pantalla de chat con CALI                               |Mobile Dev |
|Rate limiting del chat (free vs premium)                |Full-Stack |
|Testing de 20 escenarios de conversación                |Ambos      |

**Entregable:** CALI responde con contexto real y puede actualizar datos del usuario vía chat.

### Sprint 11 (Semana 11): Integraciones + Monetización

|Task                                              |Responsable|
|--------------------------------------------------|-----------|
|Apple HealthKit: lectura de pasos, peso, sueño    |Mobile Dev |
|Google Health Connect: equivalente Android        |Mobile Dev |
|RevenueCat: setup plans, paywall UI               |Mobile Dev |
|Notificaciones push (recordatorios básicos)       |Mobile Dev |
|Pantalla de progreso (gráfica de peso, adherencia)|Mobile Dev |

**Entregable:** Integraciones de salud funcionando + paywall activo.

### Sprint 12 (Semana 12): QA, Polish y Submission

|Task                                                           |Responsable         |
|---------------------------------------------------------------|--------------------|
|QA exhaustivo en dispositivos físicos (iOS + Android)          |Ambos               |
|Performance profiling y optimización                           |Mobile Dev          |
|Error handling y edge cases                                    |Ambos               |
|Sentry + PostHog configurados con eventos                      |Full-Stack          |
|Preparación de assets para App Store (screenshots, descripción)|Product             |
|Submission a App Store                                         |Product + Mobile Dev|
|Submission a Google Play                                       |Product + Full-Stack|

**Entregable:** App en revisión en ambas tiendas.

### Timeline Visual

```
Sem 1-2   ████████ Fundación + Auth
Sem 3-4   ████████ Onboarding + Perfil + Motores de Cálculo
Sem 5-6   ████████ Módulo de Entrenamiento
Sem 7-8   ████████ Módulo de Nutrición
Sem 9     ████     Dashboard + Hidratación
Sem 10    ████     Coach IA CALI
Sem 11    ████     Integraciones + Monetización
Sem 12    ████     QA + Submission
──────────────────────────────────────────
Total:    12 semanas → App en revisión de tiendas
Post-rev: 1-2 semanas de aprobación estimada
Lanzamiento: Semana 14
```

-----

## 14. CRITERIOS DE LANZAMIENTO

### Gatekeepers Obligatorios (Bloqueantes)

Ninguno de estos puede estar pendiente el día de lanzamiento:

- [ ] La app no crashea en iOS 16+ y Android 10+
- [ ] Onboarding completo funciona < 5 minutos en usuario nuevo
- [ ] Un entrenamiento puede registrarse completamente
- [ ] Un día de nutrición puede registrarse completamente
- [ ] CALI responde en < 5 segundos el 95% de las veces
- [ ] Pago premium procesa correctamente (sandbox + producción)
- [ ] RLS de Supabase verificado: ningún usuario ve datos de otro
- [ ] Política de privacidad y ToS publicados en URL pública
- [ ] App pasa revisión de HealthKit (Apple requiere descripción de uso)
- [ ] Screenshots y metadata aprobados en App Store Connect y Play Console

### Gatekeepers Recomendados (No Bloqueantes)

- [ ] Rating de usabilidad ≥ 4/5 en pruebas con 5 usuarios beta
- [ ] Todos los textos revisados por native speaker en español
- [ ] Modo oscuro funciona correctamente en todas las pantallas
- [ ] Accessibility: Dynamic Type funciona en pantallas principales

### Soft Launch Strategy

**Fase 1 — Closed Beta (Semana 12–13):**

- TestFlight: 100 usuarios invitados
- Google Play Internal Testing: 50 usuarios
- Objetivo: detectar bugs críticos, validar UX con usuarios reales

**Fase 2 — Open Beta (Semana 13–14):**

- TestFlight público
- Google Play Open Testing
- Objetivo: carga real, performance en producción

**Fase 3 — Lanzamiento Público (Semana 14–15):**

- App Store: lanzamiento en México, España, Argentina, Colombia
- Google Play: mismos mercados
- Marketing: lanzamiento orgánico en redes + comunidades de calistenia

-----

## 15. BACKLOG POST-MVP (v2.0)

Funcionalidades confirmadas para la siguiente versión, ordenadas por impacto estimado:

|# |Feature                                                 |Impacto |Esfuerzo|
|--|--------------------------------------------------------|--------|--------|
|1 |Escaneo de alimentos por foto (Claude Vision)           |Muy Alto|Alto    |
|2 |Deload automático y manejo de fatiga                    |Alto    |Medio   |
|3 |Apple Sign-In                                           |Alto    |Bajo    |
|4 |Exportación de datos (PDF/CSV)                          |Medio   |Bajo    |
|5 |Apple Watch companion app                               |Alto    |Alto    |
|6 |Coach CALI con memoria persistente entre sesiones       |Muy Alto|Medio   |
|7 |Ajuste automático de calorías basado en progreso real   |Muy Alto|Alto    |
|8 |Análisis de composición corporal por foto (Body Scan AI)|Muy Alto|Muy Alto|
|9 |Notificaciones inteligentes adaptativas                 |Medio   |Medio   |
|10|Historial y analytics avanzados (periodización, volumen)|Alto    |Medio   |
|11|Gamificación: badges, rachas avanzadas, logros          |Medio   |Medio   |
|12|Comunidad y retos grupales                              |Alto    |Muy Alto|
|13|Múltiples idiomas (inglés como segundo mercado)         |Alto    |Medio   |
|14|Web app (React para usuarios de escritorio)             |Medio   |Alto    |

-----

## 16. RIESGOS Y MITIGACIONES

|Riesgo                                   |Probabilidad|Impacto |Mitigación                                                                                                                  |
|-----------------------------------------|------------|--------|----------------------------------------------------------------------------------------------------------------------------|
|Rechazo de App Store por uso de HealthKit|Media       |Alto    |Documentar caso de uso médico legítimo, policy de privacidad robusta, descripción precisa de uso de datos                   |
|Costo de Claude API mayor al proyectado  |Media       |Medio   |Rate limiting agresivo en free tier, monitoring de tokens por usuario, caché de respuestas frecuentes                       |
|USDA Food API con downtime o cambios     |Baja        |Alto    |Base de datos propia de 500 alimentos como fallback, caché Redis agresivo (TTL 7 días)                                      |
|Baja retención en semana 1               |Alta        |Muy Alto|Onboarding con valor inmediato (rutina generada en < 5 min), push notification de “tu entrenamiento de hoy” al día siguiente|
|Complejidad del Motor de Entrenamiento   |Media       |Medio   |Simplificar a solo 3 frecuencias para MVP si el tiempo apremia, añadir 4ta y 5ta en v1.1                                    |
|Competidor lanza feature similar         |Media       |Bajo    |La integración Entrenamiento+Nutrición+IA contextual es el diferenciador, no features individuales                          |
|Performance en Android gama baja         |Media       |Medio   |Testing temprano en dispositivos Android de gama media, lazy loading agresivo, evitar listas sin virtualización             |
|Equipo de 2 personas (sin diseñador)     |Alta        |Medio   |Usar componentes del sistema de diseño desde UXUI.md como spec, limitar pantallas custom, UI library como NativeWind        |

-----

## APÉNDICE — Resumen Ejecutivo del MVP

### En una página

**CALI-NUTRI AI v1.0 es:**

Una aplicación móvil para iOS y Android que unifica entrenamiento de calistenia, nutrición y hidratación bajo la guía de un coach de IA llamado CALI.

**Lo que el usuario puede hacer el Día 1:**

1. Registrarse y completar su perfil en 5 minutos
1. Recibir una rutina de calistenia personalizada basada en su evaluación
1. Ver sus macros diarios calculados para su objetivo
1. Registrar un entrenamiento completo con sets, reps y RPE
1. Registrar su alimentación del día
1. Registrar su hidratación
1. Hablar con CALI para obtener feedback sobre su día

**Por qué alguien pagará $9.99/mes:**

- CALI tiene su contexto completo y puede registrar cosas por él con lenguaje natural
- La rutina se adapta automáticamente basándose en su rendimiento real
- Todo en una sola app en lugar de 3 apps separadas
- Especialización en calistenia que MyFitnessPal y Strong no ofrecen

**Timeline:** 12 semanas de desarrollo → 14 semanas en App Store y Google Play.

**Métricas de éxito a 60 días:** DAU/MAU ≥ 0.25, Retención 30d ≥ 15%, Rating ≥ 4.2.

-----

*Documento generado por el equipo de arquitectura y producto de CALI-NUTRI AI. Versión aprobada para inicio de desarrollo.*  
*Revisión programada: al completar Sprint 6 para ajustar alcance si es necesario.*