# CALI-NUTRI AI

## UX/UI Design Document

### Versión 1.0 — MVP + Commercial Foundation

**Clasificación:** Documento de Diseño Interno
**Estado:** Aprobado para Implementación
**Última actualización:** Junio 2026

-----

## ÍNDICE

1. [Filosofía de Diseño](#1-filosofía-de-diseño)
1. [Sistema de Diseño](#2-sistema-de-diseño)
1. [Arquitectura de Navegación](#3-arquitectura-de-navegación)
1. [Flujo de Onboarding](#4-flujo-de-onboarding)
1. [Dashboard — Home](#5-dashboard--home)
1. [Módulo de Entrenamiento](#6-módulo-de-entrenamiento)
1. [Módulo de Nutrición](#7-módulo-de-nutrición)
1. [Módulo de Hidratación](#8-módulo-de-hidratación)
1. [Coach IA — CALI](#9-coach-ia--cali)
1. [Módulo de Perfil y Progreso](#10-módulo-de-perfil-y-progreso)
1. [Configuración](#11-configuración)
1. [Biblioteca de Componentes](#12-biblioteca-de-componentes)
1. [Patrones de Interacción](#13-patrones-de-interacción)
1. [Estados de UI](#14-estados-de-ui)
1. [Accesibilidad](#15-accesibilidad)

-----

## 1. FILOSOFÍA DE DISEÑO

### Principio Central: Datos que Motivan, No que Abruman

CALI-NUTRI AI no es un tracker genérico. Es un entrenador y nutricionista digital. El diseño debe comunicar esa autoridad: información densa presentada con claridad clínica, progresión visible que genera adherencia, y una IA que se siente como un compañero real, no un chatbot.

### Los Cinco Pilares de Diseño

**1. Densidad Controlada**
El usuario de calistenia es metódico. La UI debe mostrar datos completos sin parecer recargada. Cada pantalla tiene una jerarquía de información clara: un número principal, datos secundarios de soporte, y acciones disponibles.

**2. Progresión como Narrativa**
Cada pantalla debe responder implícitamente: “¿Estoy mejorando?” El progreso no se esconde en submenús — se exhibe en el flujo principal como motivación continua.

**3. Input Mínimo, Output Máximo**
Registrar un entrenamiento, una comida o el agua debe tomar menos de 10 segundos. La fricción de registro es el enemigo número uno de la adherencia.

**4. IA Integrada, No Anexada**
CALI (el coach de IA) no vive solo en un chat. Sus recomendaciones aparecen contextualmente en cada módulo, como un entrenador que está presente en todo momento.

**5. Confianza a través de la Precisión**
Gramajes exactos, RPE objetivos, macros calculados. La UI no redondea ni simplifica — muestra los números reales, porque los usuarios avanzados los necesitan y los principiantes aprenden a leer los suyos.

### Identidad Visual: “Athletic Precision”

El estilo visual rechaza el minimalismo estéril y la estética de gimnasio cliché (gradientes naranja, sans-serif gritona). CALI-NUTRI AI es técnica, precisa y sofisticada — como un equipo de alto rendimiento, no un influencer de fitness.

**Referente visual:** La interfaz de un monitor cardíaco de élite cruzado con una app de análisis deportivo profesional. Oscuro, denso de información, con un acento que señala exactamente lo que importa.

-----

## 2. SISTEMA DE DISEÑO

### 2.1 Paleta de Colores

```
FONDOS
─────────────────────────────────────────────
Background Base     #080810    (casi negro azulado)
Surface 100         #10101C    (fondo de cards)
Surface 200         #18182A    (cards elevadas)
Surface 300         #22223A    (cards interactivas)
Border Subtle       #2A2A42    (bordes y separadores)

ACENTO PRIMARIO — Electric Lime
─────────────────────────────────────────────
Lime 500  (base)    #C8FF47    (acción principal, progreso)
Lime 400  (hover)   #D4FF6E    (estados hover / pressed)
Lime 300  (soft)    #E8FFB0    (texto sobre fondo claro)
Lime 100  (ghost)   #C8FF471A  (fondos de badges)

ACENTO SECUNDARIO — Recovery Mint
─────────────────────────────────────────────
Mint 500  (base)    #3DFFC8    (hidratación, recuperación)
Mint 100  (ghost)   #3DFFC81A  (fondos de indicadores)

SEMÁNTICOS
─────────────────────────────────────────────
Success             #3DFFC8    (= Mint 500)
Warning             #FFBB33    (alertas leves, descarga)
Error               #FF4D6A    (errores, estancamiento)
Info                #4D9EFF    (información, sueño)

TIPOGRAFÍA
─────────────────────────────────────────────
Text Primary        #F0F0FA    (títulos, datos principales)
Text Secondary      #8888AA    (labels, texto de soporte)
Text Disabled       #44445A    (estados deshabilitados)
Text Inverse        #080810    (texto sobre Lime)
```

**Justificación de paleta:** El near-black azulado (#080810 en lugar de negro puro) evita el harshness visual durante sesiones nocturnas — uso primario de esta app. El Lime como acento es energético sin caer en el verde deportivo genérico; su saturación alta crea jerarquía inmediata sin sobrecargar la UI. El Mint como secundario diferencia claramente los estados de salud/recuperación de los de rendimiento.

### 2.2 Tipografía

```
ROLES TIPOGRÁFICOS
─────────────────────────────────────────────────────────────

Display / Números Heroicos
  Fuente:    Space Grotesk (variable)
  Uso:       Números de progreso principales, dominadas, kcal
  Ejemplo:   "847" (calorías del día), "8" (dominadas máx)
  Config:    700 weight, tracking -0.5px

Headlines de Sección
  Fuente:    Space Grotesk
  Tamaños:   H1: 28px / H2: 22px / H3: 18px
  Weight:    600
  Uso:       Títulos de pantalla y secciones principales

Body / Interfaz
  Fuente:    Inter (variable)
  Tamaños:   Body: 16px / Small: 14px / Caption: 12px
  Weight:    Regular 400 / Medium 500
  Uso:       Todo el texto de navegación, labels, descripciones

Datos / Métricas
  Fuente:    JetBrains Mono
  Tamaños:   14px / 12px
  Weight:    400 / 500
  Uso:       Macros (P/G/C), RPE, tiempos, gramajes exactos
  Justif:    La monospace comunica precisión y legibilidad
             en filas de datos numéricos
```

**Escala Tipográfica**

```
Display XL  → Space Grotesk 700   48px  (número heroico único)
Display L   → Space Grotesk 700   36px  (stats de progreso)
Display M   → Space Grotesk 600   28px  (header de pantalla)
H1          → Space Grotesk 600   24px
H2          → Space Grotesk 600   20px
H3          → Space Grotesk 500   17px
Body L      → Inter 400           16px
Body M      → Inter 400           14px
Body S      → Inter 400           13px
Caption     → Inter 500           12px
Mono L      → JetBrains Mono 500  14px  (macros, datos)
Mono S      → JetBrains Mono 400  12px  (timestamps)
```

### 2.3 Espaciado y Grid

```
SISTEMA DE ESPACIADO (base 4px)
─────────────────────────────────
sp-1   →   4px
sp-2   →   8px
sp-3   →   12px
sp-4   →   16px     (padding interno de cards)
sp-5   →   20px
sp-6   →   24px     (gap entre cards)
sp-8   →   32px     (secciones)
sp-10  →   40px
sp-12  →   48px     (header height)
sp-16  →   64px     (padding de safe area)

GRID DE PANTALLA
─────────────────────────────────
Margin horizontal:   16px
Gutter entre cols:   12px
Columnas (mobile):   4 cols
Cards full width:    calc(100% - 32px)
Cards mitad:         calc(50% - 22px)
Cards tercio:        calc(33.3% - 20px)
```

### 2.4 Bordes y Elevación

```
Border Radius
─────────────────────────────────
br-sm    →   8px    (badges, chips)
br-md    →   12px   (cards pequeñas, inputs)
br-lg    →   16px   (cards principales)
br-xl    →   24px   (bottom sheets, modales)
br-full  →   9999px (botones pill, avatares)

Elevación (via sombra + borde)
─────────────────────────────────
Level 0  →   sin sombra, borde Border Subtle
Level 1  →   0 2px 8px rgba(0,0,0,0.4) + borde
Level 2  →   0 4px 16px rgba(0,0,0,0.5) + borde
Level 3  →   0 8px 32px rgba(0,0,0,0.6) — modales
```

### 2.5 Iconografía

Sistema: **Phosphor Icons** (outline para inactivo, fill para activo/acción)

```
Categorías de íconos usados
─────────────────────────────────────────────────
Navegación:    House, Barbell, Fork, Drop, Robot
Entrenamiento: Repeat, Timer, TrendUp, Checkmark
Nutrición:     BowlFood, Scales, Fire, Plus
Hidratación:   Drop, Waves, Bell
Perfil:        User, Camera, Chart, Award
IA:            Robot, Sparkle, ChatDots
Sistema:       Gear, Bell, Lock, Eye, ChevronRight
```

-----

## 3. ARQUITECTURA DE NAVEGACIÓN

### 3.1 Mapa de Navegación Completo

```
ROOT
│
├── AUTH STACK (sin autenticación)
│   ├── Splash Screen
│   ├── Welcome
│   ├── Login
│   ├── Register
│   └── ONBOARDING FLOW (post-registro)
│       ├── Step 1: Datos Físicos
│       ├── Step 2: Objetivo Principal
│       ├── Step 3: Frecuencia de Entrenamiento
│       ├── Step 4: Evaluación Física (test de máximos)
│       ├── Step 5: Conexión Apple Health / Google Health
│       └── Step 6: Resumen de Plan Generado
│
└── MAIN TAB NAVIGATOR (autenticado)
    │
    ├── TAB 1: Dashboard (Home)
    │   └── Daily Summary Screen
    │       ├── → Quick Log Food (modal)
    │       ├── → Quick Log Water (modal)
    │       └── → Today Workout (deep link a Training)
    │
    ├── TAB 2: Entrenamiento
    │   ├── Training Home
    │   │   ├── → Today Workout Screen
    │   │   │   └── → Active Session Screen
    │   │   │       ├── → Exercise Detail Screen
    │   │   │       ├── → Rest Timer Screen
    │   │   │       └── → Session Summary Screen
    │   │   ├── → Program Overview Screen
    │   │   ├── → Exercise Library Screen
    │   │   │   └── → Exercise Detail Screen
    │   │   └── → Training Progress Screen
    │   │       └── → Movement History Screen
    │
    ├── TAB 3: Nutrición
    │   ├── Nutrition Home
    │   │   ├── → Food Diary Screen
    │   │   │   └── → Meal Detail Screen
    │   │   ├── → Log Food Screen
    │   │   │   ├── → Food Search Screen
    │   │   │   ├── → Barcode Scanner Screen
    │   │   │   ├── → Photo Estimate Screen (v2.0)
    │   │   │   └── → Natural Language Input Screen
    │   │   ├── → Meal Planner Screen
    │   │   │   └── → Recipe Detail Screen
    │   │   └── → Nutrition Progress Screen
    │
    ├── TAB 4: Hidratación
    │   └── Hydration Screen
    │       ├── → Water Log History Screen
    │       └── → Hydration Settings Screen
    │
    └── TAB 5: Coach IA (CALI)
        └── AI Chat Screen
            ├── → Quick Action Shortcuts
            └── → Full Conversation History

    ACCESO GLOBAL (desde Header)
    ├── → Notifications Screen
    └── → Profile Stack
        ├── Profile Home
        ├── → Body Measurements Screen
        ├── → Progress Photos Screen
        ├── → Achievements Screen
        └── → Settings Stack
            ├── Settings Home
            ├── → Personal Data Screen
            ├── → Goals Screen
            ├── → Health Integrations Screen
            ├── → Notifications Settings Screen
            ├── → Privacy & Data Screen
            └── → Account Screen
```

### 3.2 Tab Bar

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ○─────────○─────────○─────────○─────────○             │
│  Home   Train    Nutri    Water    CALI                 │
│  [act]                                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

Especificaciones del Tab Bar:
  Altura:           83px (incluyendo safe area iOS)
  Fondo:            Surface 100 (#10101C) con blur backdrop
  Borde superior:   1px Border Subtle
  Ícono inactivo:   24px, Text Secondary (#8888AA), Phosphor Outline
  Ícono activo:     24px, Lime 500 (#C8FF47), Phosphor Fill
  Label inactivo:   Inter 500, 10px, Text Secondary
  Label activo:     Inter 700, 10px, Lime 500
  Badge:            8px circle, Error (#FF4D6A), Text Inverse
```

### 3.3 Header Global

```
┌─────────────────────────────────────────────────────────┐
│  ←   TÍTULO DE PANTALLA              🔔   [Avatar]     │
│      Caption: subtítulo contextual                      │
└─────────────────────────────────────────────────────────┘

Especificaciones:
  Altura:           56px + safe area
  Fondo:            transparent (blur backdrop en scroll)
  Título:           Space Grotesk 600, 20px, Text Primary
  Subtítulo:        Inter 400, 12px, Text Secondary
  Ícono notif:      24px Phosphor Bell, Text Secondary
  Badge notif:      Error (#FF4D6A) cuando hay alertas
  Avatar:           32px circle, borde 2px Lime 500 (si tiene foto)
```

-----

## 4. FLUJO DE ONBOARDING

### SCREEN: Splash

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                        CALI                             │
│                    ▲ NUTRI  AI                          │
│                                                         │
│              [logotipo: símbolo calistenia              │
│               + hoja / átomo en Lime]                   │
│                                                         │
│                                                         │
│                                                         │
│                  ─────────────────                      │
│                  Cargando perfil...                     │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘

Comportamiento:
  - Dura 2s máximo
  - Verifica token JWT
  - Redirige a Main si autenticado
  - Redirige a Welcome si no autenticado
```

-----

### SCREEN: Welcome

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │   [Imagen/ilustración: silueta calistenia —       │  │
│  │    figura haciendo muscle-up, minimalista,         │  │
│  │    trazo fino en Lime sobre fondo oscuro]          │  │
│  │                                                   │  │
│  │                                                   │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Tu entrenador personal.                               │
│  Tu nutricionista deportivo.                           │
│  Siempre disponible.                                   │
│                                                         │
│  CALI-NUTRI AI combina calistenia y nutrición          │
│  en un plan que evoluciona contigo cada semana.        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Crear cuenta gratuita         [→]        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│              Ya tengo cuenta — Iniciar sesión           │
│                                                         │
└─────────────────────────────────────────────────────────┘

Componentes:
  - Hero image: ilustración de alta calidad (no foto stock)
  - Headline: Space Grotesk 700, 28px, Text Primary
  - Body: Inter 400, 16px, Text Secondary
  - CTA principal: Button Primary (Lime)
  - CTA secundario: Text button, Text Secondary
```

-----

### SCREEN: Registro

```
┌─────────────────────────────────────────────────────────┐
│  ←  Crear cuenta                                        │
│                                                         │
│  Nombre                                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Juan                                             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Correo electrónico                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  juan@email.com                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Contraseña                                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ●●●●●●●●●●●●                            [👁]   │  │
│  └───────────────────────────────────────────────────┘  │
│  ✓ 8+ caracteres  ✓ Una mayúscula  ✗ Un número          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │             Continuar                    [→]      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ──────────────── o registrarse con ────────────────── │
│                                                         │
│  ┌───────────────┐          ┌───────────────────────┐  │
│  │  [G] Google  │          │  [🍎] Apple ID        │  │
│  └───────────────┘          └───────────────────────┘  │
│                                                         │
│  Al continuar aceptas los Términos y la               │
│  Política de Privacidad de CALI-NUTRI AI.             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Onboarding — Step 1: Datos Físicos

```
┌─────────────────────────────────────────────────────────┐
│  ────●────○────○────○────○────○                        │
│  Paso 1 de 6                                            │
│                                                         │
│  Cuéntanos sobre ti                                     │
│  Calculamos todo a partir de tus datos reales.         │
│                                                         │
│  Sexo biológico                                         │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │  ♂  Hombre          │  │  ♀  Mujer               │  │
│  └─────────────────────┘  └─────────────────────────┘  │
│                                                         │
│  Fecha de nacimiento                                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  15 / 08 / 1995                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Estatura                                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  175  cm                                          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Peso actual                                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  78  kg                                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Peso objetivo                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  72  kg                                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Siguiente                   [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Onboarding — Step 2: Objetivo Principal

```
┌─────────────────────────────────────────────────────────┐
│  ────●────●────○────○────○────○                        │
│  Paso 2 de 6                                            │
│                                                         │
│  ¿Cuál es tu objetivo principal?                       │
│  Tu plan se construye alrededor de esta prioridad.     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🔥  Perder grasa corporal                 [○]   │  │
│  │      Déficit calórico + mantener músculo          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  💪  Ganar masa muscular                   [●]   │  │
│  │      Superávit calórico + volumen progresivo      │  │
│  └───────────────────────────────────────────────────┘  │
│  [card seleccionada: borde Lime 500, fondo Lime ghost]  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ⚡  Recomposición corporal               [○]   │  │
│  │      Quemar grasa y ganar músculo en paralelo     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🎯  Mejorar rendimiento                  [○]   │  │
│  │      Más repeticiones, más fuerza relativa        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Siguiente                   [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Onboarding — Step 3: Frecuencia de Entrenamiento

```
┌─────────────────────────────────────────────────────────┐
│  ────●────●────●────○────○────○                        │
│  Paso 3 de 6                                            │
│                                                         │
│  ¿Cuántos días entrenas por semana?                    │
│  Elige lo que puedes mantener, no lo ideal.            │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │    3     │  │    4     │  │    5     │  │   6    │  │
│  │  días    │  │  días    │  │  días    │  │  días  │  │
│  │          │  │  [●]     │  │          │  │        │  │
│  │ Full     │  │ Upper /  │  │ PPL +    │  │ PPL x2 │  │
│  │ Body     │  │ Lower    │  │ Compl.   │  │        │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                         │
│  Plan seleccionado:                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  4 días — Upper / Lower Split                     │  │
│  │                                                   │  │
│  │  Lun: Upper  |  Mar: Lower  |  Jue: Upper        │  │
│  │  Vie: Lower  |  Sáb-Dom: Descanso                │  │
│  │                                                   │  │
│  │  Óptimo para hipertrofia con recuperación        │  │
│  │  completa entre sesiones del mismo grupo.        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Siguiente                   [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Onboarding — Step 4: Evaluación Física

```
┌─────────────────────────────────────────────────────────┐
│  ────●────●────●────●────○────○                        │
│  Paso 4 de 6                                            │
│                                                         │
│  Test de evaluación                                     │
│  Haz el máximo de repeticiones posibles con            │
│  buena técnica. Para en el fallo técnico.              │
│                                                         │
│  ── EMPUJE ──────────────────────────────────────────  │
│                                                         │
│  Flexiones normales         [ _ _ ] reps               │
│  Flexiones inclinadas       [ _ _ ] reps               │
│  Flexiones diamante         [ _ _ ] reps               │
│  Pike Push Ups              [ _ _ ] reps               │
│                                                         │
│  ── TRACCIÓN ────────────────────────────────────────  │
│                                                         │
│  Dominadas                  [ _ _ ] reps               │
│  Chin Ups                   [  0 ] reps                │
│  ↳ Si = 0: Negativas        [ _ _ ] reps               │
│                                                         │
│  ── PIERNA ──────────────────────────────────────────  │
│                                                         │
│  Sentadillas                [ _ _ ] reps               │
│  Zancadas (por pierna)      [ _ _ ] reps               │
│                                                         │
│  ── CORE ────────────────────────────────────────────  │
│                                                         │
│  Plancha                    [  _ ] segundos            │
│  Hollow Hold                [  _ ] segundos            │
│  Elevaciones de piernas     [ _ _ ] reps               │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Calcular mi nivel               [→]       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Notas de diseño:
  - Cada campo numérico es un NumericInput compacto
  - Campos opcionales se revelan condicionalmente
  - "Si = 0" expandible inline para negativas/isométricos
  - Tooltip de técnica disponible por ejercicio [?]
```

-----

### SCREEN: Onboarding — Step 5: Conexión de Salud

```
┌─────────────────────────────────────────────────────────┐
│  ────●────●────●────●────●────○                        │
│  Paso 5 de 6                                            │
│                                                         │
│  Conecta tus datos de salud                            │
│  Importamos pasos, calorías y sueño automáticamente.   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🍎  Apple Health                                  │  │
│  │                                                   │  │
│  │  Importaremos:                                    │  │
│  │  ✓ Pasos diarios                                  │  │
│  │  ✓ Calorías activas                               │  │
│  │  ✓ Sueño (horas y calidad)                        │  │
│  │  ✓ Peso corporal                                  │  │
│  │  ✓ Frecuencia cardíaca                            │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │    Conectar Apple Health              [→]   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🤖  Google Health Connect                         │  │
│  │      [mismo contenido para Android]               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Tus datos de salud están cifrados y nunca se          │
│  comparten con terceros. Puedes revocar el acceso      │
│  en cualquier momento desde Configuración.             │
│                                                         │
│              Conectar más tarde                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Onboarding — Step 6: Plan Generado

```
┌─────────────────────────────────────────────────────────┐
│  ────●────●────●────●────●────●                        │
│  Tu plan está listo                                     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │  Hola, Juan.                                      │  │
│  │                                                   │  │
│  │  Basado en tu evaluación:                         │  │
│  │                                                   │  │
│  │  NIVEL  Dominadas: Nivel 2  (4-7 reps)            │  │
│  │  NIVEL  Flexiones: Nivel 3  (31-50 reps)          │  │
│  │                                                   │  │
│  │  ─────────────────────────────────────────────── │  │
│  │                                                   │  │
│  │  🎯 Objetivo: Ganar masa muscular                 │  │
│  │  📅 Programa: 4 días — Upper/Lower                │  │
│  │  🔥 Calorías: 2,840 kcal (+300 superávit)         │  │
│  │  💪 Proteína objetivo: 154 g/día                  │  │
│  │  💧 Agua objetivo: 3.1 litros/día                 │  │
│  │                                                   │  │
│  │  ─────────────────────────────────────────────── │  │
│  │                                                   │  │
│  │  Tu primer entrenamiento está listo.              │  │
│  │  El plan se ajusta cada semana según              │  │
│  │  tu rendimiento real.                             │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Empezar mi primer día            [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

## 5. DASHBOARD — HOME

### SCREEN: Dashboard Principal

```
┌─────────────────────────────────────────────────────────┐
│  Lunes, 9 de junio                          🔔  [Juan]  │
│  ¡Buenos días! Toca Upper Body hoy.                     │
│                                                         │
│  ── RESUMEN DEL DÍA ────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                   CALORÍAS                        │  │
│  │                                                   │  │
│  │           1,240  /  2,840 kcal                   │  │
│  │                                                   │  │
│  │  ████████████████░░░░░░░░░░░░░░░░░░░░░  44%      │  │
│  │                                                   │  │
│  │   Restante: 1,600 kcal                            │  │
│  │                                                   │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐    │  │
│  │  │  P  68g    │ │  G  42g   │ │  C  134g   │    │  │
│  │  │  / 154g    │ │  / 71g    │ │  / 320g    │    │  │
│  │  │  ████░░░░  │ │  ████░░░  │ │  ███░░░░░  │    │  │
│  │  └────────────┘ └────────────┘ └────────────┘    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── ENTRENAMIENTO ──────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Upper Body — 8 ejercicios              [→ Ir]    │  │
│  │                                                   │  │
│  │  Dominadas    4×3   │  Chin Ups     4×4           │  │
│  │  Flex. Diam.  3×8   │  Pike PU      3×6           │  │
│  │  + 4 más...                                       │  │
│  │                                                   │  │
│  │  ○ No iniciado           Duración est.: 45 min    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── HIDRATACIÓN ────────────────────────────────────── │
│                                                         │
│  ┌─────────────────────────────┐  ┌─────────────────┐  │
│  │  💧 1.2 / 3.1 L            │  │  +500ml    [+]  │  │
│  │  ████████░░░░░░░░░░░  39%  │  │  +250ml    [+]  │  │
│  └─────────────────────────────┘  └─────────────────┘  │
│                                                         │
│  ── ACTIVIDAD (APPLE HEALTH) ──────────────────────── │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  👟 Pasos    │  │  🔥 Activo   │  │  😴 Sueño    │  │
│  │  6,240       │  │  312 kcal    │  │  7h 20m      │  │
│  │  / 10,000    │  │              │  │  ✓ Bueno     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ── CALI RECOMIENDA ───────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🤖  "Llevas 6 días cumpliendo tu meta de         │  │
│  │       proteína. Esta semana podemos subir          │  │
│  │       una repetición en dominadas."               │  │
│  │                                                   │  │
│  │  Hablar con CALI →                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌─────┐   ┌──────┐   ┌──────┐   ┌─────┐   ┌──────┐   │
│  Home   Train    Nutri    Water    CALI                 │
│  [▲]                                                   │
└─────────────────────────────────────────────────────────┘

Notas de diseño:
  - Card de Calorías: elemento heroico, barra de progreso
    con fill Lime 500 sobre fondo Surface 300
  - Macros: tres mini-cards con JetBrains Mono para números
  - Entrenamiento: card tappable que lleva a sesión activa
  - Hidratación: botones de quicklog inline (no modal)
  - Actividad: importada de Apple Health / Google Health
  - CALI: card de recomendación contextual del día
```

### SCREEN: Dashboard — Quick Log Comida (Modal Bottom Sheet)

```
┌─────────────────────────────────────────────────────────┐
│  ▬▬▬▬▬▬▬  (drag handle)                               │
│                                                         │
│  Registrar comida                                       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🔍  Buscar alimento o describe en texto libre    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Recientes                                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Pollo a la plancha, 180g     P:45  G:3  C:0  [+]│  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Arroz blanco cocido, 200g    P:5   G:1  C:44 [+]│  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Aguacate, 80g               P:2   G:12 C:4  [+]│  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ──────────────  o  ──────────────                      │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  📸  Escanear código de barras                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ¿Qué comida es?  ┌────────────────────────────────┐   │
│                   │ Desayuno ▾                      │   │
│                   └────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

-----

## 6. MÓDULO DE ENTRENAMIENTO

### SCREEN: Training Home

```
┌─────────────────────────────────────────────────────────┐
│  ←  Entrenamiento               🔔  [Juan]              │
│     Semana 4 — Ciclo 1                                  │
│                                                         │
│  ── HOY ────────────────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Upper Body                          Lunes        │  │
│  │                                                   │  │
│  │  8 ejercicios  ·  ~45 min  ·  RPE objetivo 7-8   │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │         Iniciar entrenamiento        [→]    │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── ESTA SEMANA ────────────────────────────────────── │
│                                                         │
│  Lun  ┤ Upper     ✓ Completado                         │
│  Mar  ┤ Lower     → Hoy                                │
│  Mié  ┤ Descanso  ○                                    │
│  Jue  ┤ Upper     ○                                    │
│  Vie  ┤ Lower     ○                                    │
│  Sáb  ┤ Descanso  ○                                    │
│  Dom  ┤ Descanso  ○                                    │
│                                                         │
│  ── PROGRESO ───────────────────────────────────────── │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │  Dominadas máx.      │  │  Flexiones máx.      │    │
│  │                      │  │                      │    │
│  │      7 → 8 reps      │  │    32 → 37 reps      │    │
│  │  ▲ +14% este mes     │  │  ▲ +15% este mes     │    │
│  └──────────────────────┘  └──────────────────────┘    │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │  Sentadillas máx.    │  │  Elev. piernas máx.  │    │
│  │      48 reps         │  │      18 reps         │    │
│  │  ▲ +6% este mes      │  │  ▲ +12% este mes     │    │
│  └──────────────────────┘  └──────────────────────┘    │
│                                                         │
│  ── BIBLIOTECA ─────────────────────────────────────── │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │  Ver todos los ejercicios     →      │              │
│  └──────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Today Workout — Vista de Rutina

```
┌─────────────────────────────────────────────────────────┐
│  ←  Upper Body                          Lunes, 9 Jun   │
│     Semana 4 · 8 ejercicios · ~45 min                   │
│                                                         │
│  ── EMPUJE ─────────────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Dominadas                                        │  │
│  │  4 series × 3 repeticiones   RPE objetivo: 7-8   │  │
│  │  Descanso: 90 segundos                            │  │
│  │                                                   │  │
│  │  ○ ─────────────────────────────────── [Info]    │  │
│  │  Tu máximo actual: 5 reps                         │  │
│  │  Trabajando al 60% → 3 reps                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Chin Ups                                         │  │
│  │  4 series × 4 repeticiones   RPE objetivo: 7-8   │  │
│  │  Descanso: 90 segundos                            │  │
│  │  ○ ─────────────────────────────────── [Info]    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Flexiones Diamante                               │  │
│  │  3 series × 8 repeticiones   RPE objetivo: 7     │  │
│  │  Descanso: 75 segundos                            │  │
│  │  ○ ─────────────────────────────────── [Info]    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── TRACCIÓN ACCESORIA ─────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Pike Push Ups                                    │  │
│  │  3 series × 6 repeticiones   RPE objetivo: 7     │  │
│  │  ○ ─────────────────────────────────── [Info]    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [... 4 ejercicios más ...]                            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Comenzar sesión                  [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Active Session — Entrenamiento en Curso

```
┌─────────────────────────────────────────────────────────┐
│  ✕ Cancelar         Upper Body          ⏱  00:23:41    │
│                                                         │
│  Ejercicio 2 de 8                    Progreso ████░░░░  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │              DOMINADAS                            │  │
│  │                                                   │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │  Serie  │  Objetivo  │  Reps  │  RPE     │    │  │
│  │  │─────────│────────────│────────│──────────│    │  │
│  │  │   1     │     3      │  ✓ 3   │  7/10    │    │  │
│  │  │   2     │     3      │  ✓ 3   │  8/10    │    │  │
│  │  │   3     │     3      │  [ _ ] │  [ _ ]   │    │  │
│  │  │   4     │     3      │  [ _ ] │  [ _ ]   │    │  │
│  │  └──────────────────────────────────────────┘    │  │
│  │                                                   │  │
│  │  Serie activa:  3 / 4                             │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Repeticiones completadas                               │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │   -    │  │   3    │  │   +    │  │ Fallo  │        │
│  └────────┘  └────────┘  └────────┘  └────────┘        │
│                                                         │
│  ¿Cómo estuvo?                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  1   2   3   4   5   6   7   8   9   10         │   │
│  │  ○   ○   ○   ○   ○   ○   [7]  ○   ○   ○        │   │
│  │  Fácil           Moderado          Al fallo      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │       ✓  Completar serie y descansar      [→]     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Rest Timer — Descanso Entre Series

```
┌─────────────────────────────────────────────────────────┐
│  ✕               Descansando                 00:23:58   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │            ┌─────────────────┐                   │  │
│  │            │                 │                   │  │
│  │            │     1:24        │                   │  │
│  │            │                 │                   │  │
│  │            │  de 1:30        │                   │  │
│  │            │                 │                   │  │
│  │            └─────────────────┘                   │  │
│  │        [círculo de progreso animado]              │  │
│  │                                                   │  │
│  │  Próximo: Serie 3 — Dominadas × 3                 │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         -15s          Saltar           +15s        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── ÚLTIMA SERIE ───────────────────────────────────── │
│  Serie 2: 3 reps · RPE 8                               │
│                                                         │
│  ── MIENTRAS DESCANSAS ─────────────────────────────── │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🤖 CALI: "Buen control en la bajada. En la       │  │
│  │     serie 3 intenta sostener 2 segundos           │  │
│  │     arriba antes de bajar."                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘

Notas de diseño:
  - Timer circular con animación fluida (60fps)
  - El número hace countdown con Space Grotesk 700, 64px
  - Vibración háptica a 10s, 5s, 0s
  - Notificación push si pantalla apagada
  - Tip de CALI contextual por ejercicio (no siempre)
```

-----

### SCREEN: Session Summary — Fin de Entrenamiento

```
┌─────────────────────────────────────────────────────────┐
│                  Entrenamiento completado               │
│                        ✓ 🎯                            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Upper Body — Semana 4                            │  │
│  │                                                   │  │
│  │  Duración        Series       Volumen             │  │
│  │  47 min          28/28        100%                │  │
│  │                                                   │  │
│  │  RPE promedio: 7.4 / 10  →  Intensidad óptima    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── DESTACADOS ─────────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🏆 Nuevo máximo: Dominadas  8 reps   (era 7)     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Ejercicio     Series   Reps completados   RPE    │  │
│  │  Dominadas     4/4      3-3-3-3            7.5    │  │
│  │  Chin Ups      4/4      4-4-4-3            7.8    │  │
│  │  Flex. Diam.   3/3      8-8-7              7.2    │  │
│  │  Pike Push Up  3/3      6-6-6              7.0    │  │
│  │  ...                                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── CALI ANALIZA ────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🤖 "Excelente sesión. Completaste todas las      │  │
│  │     series dentro del RPE objetivo. Si            │  │
│  │     repites esto la próxima semana, tu plan       │  │
│  │     progresa a 4×4 en dominadas."                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Notas del entrenamiento (opcional)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Rodilla izquierda algo tensa al inicio...        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Guardar y salir             [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Training Progress — Gráficas de Progreso

```
┌─────────────────────────────────────────────────────────┐
│  ←  Progreso de Entrenamiento                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  1M     3M     6M     1A     Todo               │   │
│  │  ────                                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ── DOMINADAS (máximo histórico) ─────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  10│                                   ●          │  │
│  │   9│                             ●                │  │
│  │   8│                       ●  ●                  │  │
│  │   7│               ●  ●                          │  │
│  │   6│           ●                                 │  │
│  │   5│       ●                                     │  │
│  │   4│   ●                                         │  │
│  │    └─────────────────────────────────────────── │  │
│  │    Sem1  Sem3  Sem5  Sem7  Sem9  Sem11 Sem13    │  │
│  │                                                   │  │
│  │  ▲ +100% en 13 semanas    Actual: 8 reps         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── OTROS MOVIMIENTOS ──────────────────────────────── │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │  Flexiones           │  │  Sentadillas         │    │
│  │  32 → 47 reps        │  │  45 → 58 reps        │    │
│  │  ▲ +47% / 13 sem     │  │  ▲ +29% / 13 sem     │    │
│  │  [mini gráfica]      │  │  [mini gráfica]      │    │
│  └──────────────────────┘  └──────────────────────┘    │
│                                                         │
│  ── VOLUMEN SEMANAL ────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Series/sem: 28 ████████████████░░░░  Óptimo ✓   │  │
│  │  Adherencia: 87% ████████████████░░░  Excelente   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── HISTORIAL POR MOVIMIENTO ───────────────────────── │
│  Dominadas →                                           │
│  Flexiones →                                           │
│  Chin Ups →                                            │
│  Sentadilla →                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Exercise Library

```
┌─────────────────────────────────────────────────────────┐
│  ←  Biblioteca de Ejercicios                            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🔍  Buscar ejercicio...                          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Todos   │ │  Empuje  │ │ Tracción │ │  Pierna  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────────┐                                        │
│  │    Core      │                                        │
│  └──────────────┘                                        │
│                                                         │
│  EMPUJE (6)                                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Flexiones normales                  Nivel 1-3   │  │
│  │  Empuje · Pecho, tríceps, hombros         →     │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Flexiones diamante                  Nivel 2-4   │  │
│  │  Empuje · Tríceps, pecho interior         →     │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Pike Push Ups                        Nivel 1-3   │  │
│  │  Empuje · Hombros, tríceps                →     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  TRACCIÓN (4)                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Dominadas                           Nivel 1-5   │  │
│  │  Tracción · Espalda, bíceps, core         →     │  │
│  └───────────────────────────────────────────────────┘  │
│  [...]                                                  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Exercise Detail

```
┌─────────────────────────────────────────────────────────┐
│  ←  Dominadas                                           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Ilustración técnica: posición inicial,          │  │
│  │   punto medio, posición final — 3 frames          │  │
│  │   en formato horizontal, trazo Lime sobre         │  │
│  │   fondo Surface 200]                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  🎯 Músculos primarios:  Dorsal, Bíceps               │
│  ✦ Músculos secundarios: Romboides, Core, Antebrazo  │
│  🏋️ Equipamiento: Barra de dominadas                  │
│                                                         │
│  ── CLASIFICACIÓN DE NIVEL ─────────────────────────── │
│  Nivel 0   →   0 reps       Usar negativas            │
│  Nivel 1   →   1-3 reps     Fuerza base               │
│  Nivel 2   →   4-7 reps  ●  Tu nivel actual           │
│  Nivel 3   →   8-12 reps    Hipertrofia estándar      │
│  Nivel 4   →   13-20 reps   Volumen alto              │
│  Nivel 5   →   20+ reps     Élite                     │
│                                                         │
│  ── EJECUCIÓN ─────────────────────────────────────── │
│  1. Cuelga de la barra con agarre prono               │
│     a la anchura de los hombros.                       │
│  2. Retrae escápulas antes de iniciar.                 │
│  3. Tira hasta que el mentón supere la barra.          │
│  4. Baja de forma controlada (2-3 segundos).           │
│  5. Extiende completamente al final de cada rep.       │
│                                                         │
│  ── TU HISTORIAL ──────────────────────────────────── │
│  [mini gráfica de progreso de dominadas]               │
│  Máximo actual: 8 reps · +14% este mes                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

-----

## 7. MÓDULO DE NUTRICIÓN

### SCREEN: Nutrition Home

```
┌─────────────────────────────────────────────────────────┐
│  ←  Nutrición                           🔔  [Juan]     │
│     Lunes, 9 de junio                                   │
│                                                         │
│  ── RESUMEN DEL DÍA ────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                 1,240 / 2,840 kcal                │  │
│  │  ██████████████████░░░░░░░░░░░░░░  44%           │  │
│  │                          Faltan: 1,600 kcal       │  │
│  │                                                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────┐│  │
│  │  │ Proteínas    │ │ Grasas       │ │ Carbos     ││  │
│  │  │  68 / 154 g  │ │  42 / 71 g  │ │ 134 / 320 ││  │
│  │  │  ████░░░░░   │ │  ████░░░░░  │ │ ███░░░░░░  ││  │
│  │  │   44%        │ │   59%        │ │   42%      ││  │
│  │  └──────────────┘ └──────────────┘ └────────────┘│  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── COMIDAS DEL DÍA ────────────────────────────────── │
│                                                         │
│  Desayuno  ·  8:30 AM  ·  520 kcal                [+] │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Avena 80g + Proteína en polvo 30g + Plátano     │  │
│  │  P: 38g  ·  G: 9g  ·  C: 72g                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Almuerzo  ·  1:00 PM  ·  720 kcal                [+] │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Pollo 180g + Arroz 220g + Aguacate 60g           │  │
│  │  P: 45g  ·  G: 16g  ·  C: 54g                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Cena  ·  Pendiente                               [+] │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Aún no registrada · Faltan 1,600 kcal            │  │
│  │  Necesitas: ~86 g proteína más                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Snacks  ·  Pendiente                             [+] │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         ＋  Registrar comida             [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Log Food — Registro de Alimentos

```
┌─────────────────────────────────────────────────────────┐
│  ←  Registrar comida                                    │
│     Cena                                                │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Buscar   │  │ Texto    │  │ Código   │  │  Foto  │  │
│  │          │  │ Libre    │  │ de Barras│  │  v2.0  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│  [tab activo: Texto Libre]                              │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  "Comí tres huevos con dos arepas y un vaso       │  │
│  │   de leche..."                                    │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── INTERPRETANDO... ──────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Identificamos:                                   │  │
│  │                                                   │  │
│  │  Huevos enteros        × 3           150g         │  │
│  │  Arepas de maíz        × 2           ~160g        │  │
│  │  Leche entera          × 1 vaso      ~200ml       │  │
│  │                                                   │  │
│  │  Total estimado:                                  │  │
│  │  Calorías:  548 kcal                              │  │
│  │  Proteínas:  26 g                                 │  │
│  │  Grasas:     21 g                                 │  │
│  │  Carbos:     52 g                                 │  │
│  │                                                   │  │
│  │  ¿Ajustar alguna cantidad?                        │  │
│  │  [Huevos: 3 ▾]  [Arepas: 2 ▾]  [Leche: 1v ▾]   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │          ✓  Confirmar y guardar          [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Notas de diseño:
  - Parsing en tiempo real mientras el usuario escribe
  - Spinner inline durante el análisis de IA
  - Cada alimento es ajustable con selector numérico
  - Nivel de confianza visible por ítem (verde/amarillo)
```

-----

### SCREEN: Meal Planner — Planificador de Comidas

```
┌─────────────────────────────────────────────────────────┐
│  ←  Planificador de Hoy                                 │
│     Faltan 1,600 kcal · 86g proteína                   │
│                                                         │
│  ── ¿QUÉ TIENES EN CASA? ──────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  "Tengo pollo cocido, arroz, aguacate y huevos"   │  │
│  │  [campo de texto, ícono micrófono]                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── PROPUESTAS DE CALI ─────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Opción A — Cena completa                         │  │
│  │                                                   │  │
│  │  Pollo a la plancha           200 g               │  │
│  │  Arroz blanco cocido          220 g               │  │
│  │  Aguacate                      80 g               │  │
│  │                                                   │  │
│  │  580 kcal · P:50g · G:18g · C:52g                │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │   Usar esta opción                    [→]   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Opción B — Snack + Cena ligera                   │  │
│  │                                                   │  │
│  │  Snack: 3 huevos duros                            │  │
│  │  Cena: Arroz + Aguacate                           │  │
│  │                                                   │  │
│  │  620 kcal · P:53g · G:21g · C:58g                │  │
│  │  [Usar esta opción →]                             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Opción C — Solo proteína (déficit hoy)           │  │
│  │  [...]                                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Nutrition Progress

```
┌─────────────────────────────────────────────────────────┐
│  ←  Progreso Nutricional                                │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  7D     14D    1M     3M                         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ── ADHERENCIA (últimos 7 días) ────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Calorías:   ████████████████████░░   87%  ✓     │  │
│  │  Proteína:   ████████████████░░░░░░   74%  ▲     │  │
│  │  Grasas:     ████████████████████░░   88%  ✓     │  │
│  │  Hidratac.:  █████████████░░░░░░░░░   62%  ↓     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── PESO CORPORAL ──────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  78.0│●                                           │  │
│  │  77.8│  ●                                         │  │
│  │  77.5│    ●  ●                                    │  │
│  │  77.2│          ●                                 │  │
│  │  77.0│            ●  ●                            │  │
│  │      └────────────────────────────────────────── │  │
│  │       L    M    X    J    V    S    D             │  │
│  │                                                   │  │
│  │  Tendencia: -0.3 kg/semana   Objetivo: -0.5/sem  │  │
│  │  🤖 "Tu pérdida es sostenible. Mantén el plan."  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── CALORÍAS DIARIAS ───────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Gráfica de barras de calorías por día]          │  │
│  │  Objetivo marcado con línea Lime horizontal       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Registrar peso de hoy               [→]          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

## 8. MÓDULO DE HIDRATACIÓN

### SCREEN: Hydration — Pantalla Principal

```
┌─────────────────────────────────────────────────────────┐
│  ←  Hidratación                         🔔  [Juan]     │
│     Lunes, 9 de junio                                   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │              1.2 / 3.1 L                          │  │
│  │                                                   │  │
│  │         [ilustración: botella de agua             │  │
│  │          con fill animado al 39%,                 │  │
│  │          color Mint #3DFFC8]                      │  │
│  │                                                   │  │
│  │              39% completado                       │  │
│  │                                                   │  │
│  │     Faltan 1.9 litros para tu objetivo            │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── REGISTRO RÁPIDO ────────────────────────────────── │
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────┐  │
│  │  +250 ml  │  │  +500 ml  │  │  +750 ml  │  │  1L │  │
│  │   1 vaso  │  │  botella  │  │           │  │     │  │
│  └───────────┘  └───────────┘  └───────────┘  └─────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  💧  Cantidad personalizada                [→]   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── OBJETIVO AJUSTADO ──────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Base (78 kg × 40ml):         3,120 ml           │  │
│  │  + Entrenamiento hoy:         + 750 ml            │  │
│  │  + Pasos (8,000):             + 0 ml              │  │
│  │  ─────────────────────────────────────────        │  │
│  │  Total objetivo:              3,870 ml            │  │
│  │                                                   │  │
│  │  * Ajustado por entrenamiento Upper Body         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── HISTORIAL DE HOY ───────────────────────────────── │
│                                                         │
│  08:15   +500 ml                                        │
│  10:30   +250 ml                                        │
│  12:45   +500 ml                                        │
│                                                         │
│  Ver historial completo →                              │
│                                                         │
└─────────────────────────────────────────────────────────┘

Notas de diseño:
  - La botella es el elemento heroico: animación física
    con el agua subiendo al registrar (spring animation)
  - Color Mint diferencia claramente este módulo del
    verde Lime del entrenamiento
  - Botones de quicklog siempre visibles, sin modal
  - Alerta contextual si va por debajo del ritmo esperado
```

-----

### SCREEN: Hydration Settings — Configuración de Hidratación

```
┌─────────────────────────────────────────────────────────┐
│  ←  Configuración de Hidratación                        │
│                                                         │
│  Objetivo base                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Calculado automáticamente: 3.1 L                 │  │
│  │  [Toggle: Ajuste manual]  ○                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Ajuste por actividad                                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Toggle: Agregar +750ml en días de entreno]  ●   │  │
│  │  [Toggle: Agregar +500ml si pasos > 10,000]   ●   │  │
│  │  [Toggle: Ajuste por clima cálido]            ○   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Recordatorios                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Alerta: < 30% a las 12:00 pm         ●           │  │
│  │  Alerta: < 60% a las 6:00 pm          ●           │  │
│  │  Alerta: < 80% a las 8:00 pm          ●           │  │
│  │                                                   │  │
│  │  [Toggle: Recordatorios activados]    ●           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Tamaño de vaso predeterminado                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  250 ml   [▾]                                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Guardar cambios                  [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

## 9. COACH IA — CALI

### SCREEN: AI Chat — Principal

```
┌─────────────────────────────────────────────────────────┐
│  ←  CALI                               Coach Personal   │
│     Tu entrenador y nutricionista IA                    │
│                                                         │
│  ── ACCIONES RÁPIDAS ───────────────────────────────── │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ 🏋️ Registrar │ │ 🍽️ Registrar │ │ 💧 Registrar │    │
│  │  entreno     │ │  comida      │ │  agua        │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│  ┌──────────────┐ ┌──────────────┐                      │
│  │ 😴 Reportar  │ │ 📊 Ver       │                      │
│  │  sueño       │ │  resumen     │                      │
│  └──────────────┘ └──────────────┘                      │
│                                                         │
│  ────────────────────────────────────────────────────   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🤖 CALI                                           │  │
│  │                                                   │  │
│  │ Hola Juan. Veo que completaste el Upper           │  │
│  │ Body de hoy con RPE 7.4. Muy bien.                │  │
│  │                                                   │  │
│  │ Tu proteína lleva 6 días arriba del 70%.          │  │
│  │ La semana que viene subimos dominadas a           │  │
│  │ 4×4. ¿Algo que quieras ajustar del plan?         │  │
│  │                                                   │  │
│  │                                      9:41 AM ✓   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                       Juan  [Tú]  │  │
│  │                                                   │  │
│  │    Hice 8 dominadas hoy, ¿es un nuevo máximo?   │  │
│  │                                                   │  │
│  │                                       9:43 AM ✓  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🤖 CALI                                           │  │
│  │                                                   │  │
│  │ ¡Sí! 8 dominadas es tu nuevo máximo — subiste    │  │
│  │ desde 7 la semana pasada. Eso es un +14%.        │  │
│  │                                                   │  │
│  │ Ya lo registré. Si mantienes 8 la próxima        │  │
│  │ semana, el plan avanza a 4×4.                    │  │
│  │                                                   │  │
│  │                                      9:43 AM ✓   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  CALI está escribiendo...                              │
│  ●●●                                                    │
│                                                         │
│  ────────────────────────────────────────────────────   │
│                                                         │
│  ┌───────────────────────────────────────┐  ┌─────┐    │
│  │  Escribe un mensaje o habla con CALI  │  │ [→] │    │
│  └───────────────────────────────────────┘  └─────┘    │
│  [🎙 ]  [📷 ]  [📊 ]                                   │
└─────────────────────────────────────────────────────────┘

Notas de diseño:
  - Burbujas de CALI: Surface 200, borde Border Subtle,
    acento con línea izquierda Lime 500
  - Burbujas del usuario: Surface 300, alineadas a la derecha
  - Avatar de CALI: ícono Robot en círculo Lime ghost
  - Typing indicator: animación de 3 puntos pulsantes
  - Acciones rápidas como chips horizontales en scroll
  - Micro-íconos de voz, foto y datos abajo del input
```

-----

### SCREEN: AI Context Display — Contexto Visible

```
┌─────────────────────────────────────────────────────────┐
│  ←  CALI conoce tu situación actual                    │
│                                                         │
│  CALI accede a esta información para darte             │
│  recomendaciones personalizadas en tiempo real.        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  👤 Tu perfil                                     │  │
│  │  Juan · 29 años · 175cm · 78kg                   │  │
│  │  Objetivo: Ganar masa muscular                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🏋️ Entrenamiento de hoy                          │  │
│  │  Upper Body ✓ completado · 47 min · RPE 7.4      │  │
│  │  Semana 4 — Ciclo 1                               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🍽️ Nutrición de hoy                              │  │
│  │  1,240 / 2,840 kcal · P: 68/154g                │  │
│  │  Adherencia semanal: 87%                          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  💧 Hidratación                                    │  │
│  │  1.2 / 3.1 L · 39%                               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  😴 Recuperación                                   │  │
│  │  Sueño: 7h 20m ✓ · Fatiga: 3/10 · Pasos: 6,240  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Tus datos nunca se usan para entrenar modelos de IA. │
│  Solo para personalizar tus recomendaciones.          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

-----

## 10. MÓDULO DE PERFIL Y PROGRESO

### SCREEN: Profile Home

```
┌─────────────────────────────────────────────────────────┐
│  ←  Perfil                              🔔  [Editar]   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │           [📸 Foto de perfil 80px]               │  │
│  │                Juan García                        │  │
│  │           Miembro desde Enero 2026               │  │
│  │                                                   │  │
│  │  175 cm  ·  78 kg  ·  29 años  ·  Hombre        │  │
│  │  🎯 Ganar masa muscular                           │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── LOGROS ─────────────────────────────────────────── │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  🏆          │ │  🔥          │ │  💪          │    │
│  │  Primera     │ │  Racha 30d   │ │  8 dominadas  │    │
│  │  Dominada    │ │              │ │  Nivel 2      │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
│  Ver todos los logros (12) →                           │
│                                                         │
│  ── COMPOSICIÓN CORPORAL ───────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Peso actual    IMC      Grasa est.  Masa magra   │  │
│  │   78.0 kg      25.5      21.3%       61.4 kg      │  │
│  │                                                   │  │
│  │  Medidas actuales:                                │  │
│  │  Cintura: 84 cm  ·  Cuello: 38 cm               │  │
│  │                                                   │  │
│  │  Última actualización: 6 Jun 2026                │  │
│  │                                                   │  │
│  │  [Registrar nuevas medidas →]                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── ACCESOS DIRECTOS ───────────────────────────────── │
│                                                         │
│  Fotos de progreso              →                       │
│  Historial de medidas           →                       │
│  Configuración                  →                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Body Measurements — Registro de Medidas

```
┌─────────────────────────────────────────────────────────┐
│  ←  Medidas Corporales                                  │
│                                                         │
│  Registrar hoy (6 Jun 2026)                            │
│                                                         │
│  Peso                                                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  78.0  kg                                         │  │
│  │  Importado de Apple Health — hace 2h             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Cintura                                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  84  cm                                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Cuello                                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  38  cm                                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Cadera (opcional, si aplica)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  —  cm                                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── CALCULADO AUTOMÁTICAMENTE ──────────────────────── │
│                                                         │
│  IMC:              25.5 (Peso normal)                  │
│  Grasa corporal:   21.3% (Fórmula U.S. Navy)          │
│  Masa magra:       61.4 kg                             │
│  Masa grasa:       16.6 kg                             │
│                                                         │
│  ── HISTORIAL ──────────────────────────────────────── │
│                                                         │
│  Fecha       Peso    Cintura   % Grasa   Masa Magra    │
│  6 Jun      78.0    84 cm     21.3%      61.4 kg       │
│  30 May     78.4    84.5 cm   21.5%      61.5 kg       │
│  15 May     79.0    86 cm     21.9%      61.7 kg       │
│  1 May      80.2    88 cm     22.4%      62.2 kg       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Guardar medidas                [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Achievements — Sistema de Logros

```
┌─────────────────────────────────────────────────────────┐
│  ←  Logros                          12 desbloqueados    │
│                                                         │
│  ── RECIENTES ──────────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🏆  Nuevo máximo: 8 dominadas                    │  │
│  │      Desbloqueado hoy, 9 Jun 2026                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── ENTRENAMIENTO ──────────────────────────────────── │
│                                                         │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐    │
│  │  🥇   │ │  🔥   │ │  💪   │ │  ⚡   │ │  🌙   │    │
│  │1ª Dom.│ │7 días │ │Nv 2   │ │30 min │ │21:00  │    │
│  │ ✓ OK  │ │ ✓ OK  │ │ ✓ OK  │ │ ✓ OK  │ │ ✓ OK  │    │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘    │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐    │
│  │  🏅   │ │  🎯   │ │  💯   │ │  ░░░  │ │  ░░░  │    │
│  │10 Ses.│ │1 mes  │ │100%   │ │Nv 3   │ │50 ses.│    │
│  │ ✓ OK  │ │ ✓ OK  │ │ ✓ OK  │ │Bloq.  │ │Bloq.  │    │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘    │
│                                                         │
│  ── NUTRICIÓN ──────────────────────────────────────── │
│                                                         │
│  [grid similar, logros de adherencia nutricional]      │
│                                                         │
│  ── PROGRESO CORPORAL ──────────────────────────────── │
│                                                         │
│  [grid de logros de medidas y composición]             │
│                                                         │
└─────────────────────────────────────────────────────────┘

Notas de diseño:
  - Logros desbloqueados: color completo, borde Lime
  - Logros bloqueados: gris desaturado, icono ░░░
  - Al tocar un logro bloqueado: muestra condición para
    desbloquearlo
  - Animación de confetti al desbloquear uno nuevo
```

-----

## 11. CONFIGURACIÓN

### SCREEN: Settings Home

```
┌─────────────────────────────────────────────────────────┐
│  ←  Configuración                                       │
│                                                         │
│  ── CUENTA ─────────────────────────────────────────── │
│                                                         │
│  Datos personales                              →        │
│  Nombre, sexo, fecha de nacimiento                     │
│                                                         │
│  Datos físicos                                 →        │
│  Estatura, peso, medidas                               │
│                                                         │
│  Objetivos                                     →        │
│  Meta principal, calorías, macros objetivo             │
│                                                         │
│  ── INTEGRACIONES ──────────────────────────────────── │
│                                                         │
│  Apple Health                                  →        │
│  ● Conectado · Última sync: hace 2h                   │
│                                                         │
│  Google Health Connect                         →        │
│  ○ No conectado                                        │
│                                                         │
│  ── PREFERENCIAS ───────────────────────────────────── │
│                                                         │
│  Notificaciones                                →        │
│  Entreno, hidratación, motivación                      │
│                                                         │
│  Unidades de medida                            →        │
│  kg / cm  [Métrico ✓]                                  │
│                                                         │
│  Idioma                                        →        │
│  Español                                               │
│                                                         │
│  ── PRIVACIDAD Y DATOS ─────────────────────────────── │
│                                                         │
│  Privacidad y uso de datos                     →        │
│  Exportar mis datos                            →        │
│  Eliminar mi cuenta                            →        │
│                                                         │
│  ── SOPORTE ─────────────────────────────────────────  │
│                                                         │
│  Ayuda y FAQ                                   →        │
│  Reportar un problema                          →        │
│  Sobre CALI-NUTRI AI                           →        │
│  Versión 1.0.0 (build 100)                            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Cerrar sesión                        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Notifications Settings

```
┌─────────────────────────────────────────────────────────┐
│  ←  Notificaciones                                      │
│                                                         │
│  Activar notificaciones               [Toggle ●]       │
│                                                         │
│  ── ENTRENAMIENTO ──────────────────────────────────── │
│                                                         │
│  Recordatorio de entreno              [Toggle ●]       │
│  Hora:  07:00 AM  [editar]                             │
│  Solo en días de entrenamiento        [Toggle ●]       │
│                                                         │
│  ── HIDRATACIÓN ────────────────────────────────────── │
│                                                         │
│  Alertas de hidratación               [Toggle ●]       │
│  < 30% a las 12:00 PM                 [Toggle ●]       │
│  < 60% a las 6:00 PM                  [Toggle ●]       │
│  < 80% a las 8:00 PM                  [Toggle ●]       │
│                                                         │
│  ── NUTRICIÓN ──────────────────────────────────────── │
│                                                         │
│  Recordatorio de registro de comidas  [Toggle ○]       │
│  Resumen nutricional diario           [Toggle ●]       │
│  Hora del resumen: 9:00 PM  [editar]                   │
│                                                         │
│  ── PROGRESO ───────────────────────────────────────── │
│                                                         │
│  Recomendaciones de CALI              [Toggle ●]       │
│  Nuevos logros desbloqueados          [Toggle ●]       │
│  Resumen semanal (Domingos)           [Toggle ●]       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Guardar preferencias          [→]       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

### SCREEN: Goals — Objetivos

```
┌─────────────────────────────────────────────────────────┐
│  ←  Mis Objetivos                                       │
│                                                         │
│  Objetivo principal                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  💪 Ganar masa muscular                    [→]   │  │
│  │  Iniciado: 1 Feb 2026                             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Fecha objetivo                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Agosto 2026  (14 semanas restantes)       [→]   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── OBJETIVOS NUTRICIONALES ────────────────────────── │
│                                                         │
│  Calorías objetivo                                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  2,840 kcal/día                                   │  │
│  │  Calculado: TDEE (2,540) + superávit (+300)      │  │
│  │  [Ajuste manual]  ○                               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Proteína objetivo                                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  154 g/día  (2.0 g/kg)                            │  │
│  │  Rango: 140-187 g (1.8-2.4 g/kg)                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ── OBJETIVOS DE ENTRENAMIENTO ─────────────────────── │
│                                                         │
│  Dominadas objetivo                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Nivel 3 — 8 a 12 repeticiones                   │  │
│  │  Actual: 8 reps · Progreso: 67%                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │        Recalcular objetivos              [→]      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-----

## 12. BIBLIOTECA DE COMPONENTES

### 12.1 Botones

```
BUTTON PRIMARY
┌─────────────────────────────────────────────────────┐
│              Texto de acción               [→]       │
└─────────────────────────────────────────────────────┘
  Fondo: Lime 500 (#C8FF47)
  Texto: Text Inverse (#080810), Inter 600, 16px
  Borde-radius: 12px
  Padding: 16px vertical, 24px horizontal
  Estado pressed: Lime 400, escala 0.98
  Estado disabled: Surface 300, Text Disabled
  Sombra: 0 4px 16px Lime 500 @ 25%

─────────────────────────────────────────────────────

BUTTON SECONDARY
┌─────────────────────────────────────────────────────┐
│              Texto de acción                        │
└─────────────────────────────────────────────────────┘
  Fondo: transparent
  Texto: Lime 500, Inter 600, 16px
  Borde: 1.5px Lime 500
  Borde-radius: 12px

─────────────────────────────────────────────────────

BUTTON GHOST / TEXT
  Texto: Text Secondary, Inter 500, 14px
  Sin fondo ni borde
  Estado pressed: Text Primary

─────────────────────────────────────────────────────

BUTTON DESTRUCTIVE
  Fondo: Error (#FF4D6A) @ 20%
  Texto: Error (#FF4D6A), Inter 600
  Borde: 1px Error @ 40%

─────────────────────────────────────────────────────

QUICK ACTION BUTTON (hidratación)
┌──────────────────┐
│  +500 ml         │
│  botella         │
└──────────────────┘
  Fondo: Surface 200
  Texto principal: Inter 600, 16px, Text Primary
  Texto secundario: Inter 400, 12px, Text Secondary
  Borde: 1px Border Subtle
  Borde-radius: 12px
  Ancho: ~22% de pantalla
```

-----

### 12.2 Cards

```
CARD DE RESUMEN PRINCIPAL (Dashboard)
┌───────────────────────────────────────────────────────┐
│  Label pequeño (Inter 500, 12px, Text Secondary)      │
│                                                       │
│  Número principal (Space Grotesk 700, 36px, Text Prim)│
│  / Objetivo (Space Grotesk 400, 20px, Text Secondary) │
│                                                       │
│  ████████████░░░░░░░░░  66%                           │
│                                                       │
│  Footer info (Inter 400, 12px, Text Secondary)        │
└───────────────────────────────────────────────────────┘
  Fondo: Surface 100 (#10101C)
  Borde: 1px Border Subtle (#2A2A42)
  Borde-radius: 16px
  Padding: 16px
  Barra de progreso: height 6px, br-full
    Fill: Lime 500 (o Mint 500 para hidratación)
    Track: Surface 300

─────────────────────────────────────────────────────

CARD DE EJERCICIO
┌───────────────────────────────────────────────────────┐
│  Nombre ejercicio               Nivel · Categoría    │
│  X series × Y repeticiones      RPE objetivo: Z      │
│  Descanso: N segundos                                 │
│  ○ Estado                                   [Info]   │
└───────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────

CARD DE COMIDA
┌───────────────────────────────────────────────────────┐
│  Nombre del alimento            Xg                    │
│  P: Xg · G: Xg · C: Xg         XXX kcal              │
└───────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────

CARD DE RECOMENDACIÓN CALI
┌───────────────────────────────────────────────────────┐
│  🤖 "Texto de la recomendación contextual             │
│      en máximo 2 líneas."                             │
│                                                       │
│  Hablar con CALI →                                   │
└───────────────────────────────────────────────────────┘
  Línea izquierda: 3px Lime 500
  Fondo: Lime ghost (#C8FF471A)
  Borde: 1px Lime 100
```

-----

### 12.3 Inputs

```
INPUT DE TEXTO
  Label arriba: Inter 500, 14px, Text Secondary
  Campo: Surface 200, borde 1px Border Subtle, br-md
  Texto: Inter 400, 16px, Text Primary
  Placeholder: Text Disabled
  Focus: borde 1.5px Lime 500
  Error: borde 1px Error, helper text error debajo

─────────────────────────────────────────────────────

INPUT NUMÉRICO (ejercicio, gramajes)
  ┌────────┐  ┌────────────┐  ┌────────┐
  │   -    │  │    78.5    │  │   +    │
  └────────┘  └────────────┘  └────────┘
  Botones ± tienen feedback háptico
  Doble tap en el número abre teclado numérico

─────────────────────────────────────────────────────

SELECTOR RPE
  1   2   3   4   5   6   7   8   9   10
  ○   ○   ○   ○   ○   ○   [●]  ○   ○   ○
  
  Zona coloreada:
  1-4: Info azul (muy fácil)
  5-7: Lime (óptimo)
  8-9: Warning naranja (intenso)
  10:  Error rojo (fallo)

─────────────────────────────────────────────────────

TOGGLE SWITCH
  ○──────    Off: Surface 300, thumb Surface 100
  ──────●    On: Lime 500, thumb blanco
  Tamaño: 51 × 31px (iOS standard)

─────────────────────────────────────────────────────

SELECTOR DE OPCIÓN (objetivo, frecuencia)
  ┌───────────────────────────────────────────────┐
  │  Ícono  Label principal              [○ / ●]  │
  │         Descripción secundaria                │
  └───────────────────────────────────────────────┘
  Seleccionado: borde 1.5px Lime 500, fondo Lime ghost
  Sin seleccionar: borde 1px Border Subtle
```

-----

### 12.4 Indicadores de Progreso

```
BARRA DE PROGRESO LINEAL
  Track:   Surface 300, height 6px, br-full
  Fill:    Lime 500 (default) / Mint 500 (hidratación)
           / Info (pasos) / Warning (descarga)
  Label:   Inter 500, 12px, Text Secondary

─────────────────────────────────────────────────────

ANILLO DE PROGRESO (timer de descanso)
  Anillo exterior: 120px × 120px
  Track: Border Subtle
  Fill: Lime 500, animación fluida
  Centro: Space Grotesk 700, 48px, número de tiempo

─────────────────────────────────────────────────────

MINI GRÁFICA (sparkline, tarjetas de progreso)
  Línea: 1.5px, Lime 500
  Área: gradiente Lime 500 → transparente
  Puntos: 4px circle, Lime 500
  Sin ejes ni labels en formato mini

─────────────────────────────────────────────────────

GRÁFICA COMPLETA (pantallas de progreso)
  Línea: 2px, Lime 500
  Área: gradiente 30% → 0%
  Puntos activos: 8px circle, borde 2px Surface 100
  Eje X: Inter 400, 11px, Text Secondary
  Eje Y: JetBrains Mono 400, 11px, Text Secondary
  Grid lines: Border Subtle, 1px, dashed
  Tooltip: Surface 200, borde Lime 500, br-sm
```

-----

### 12.5 Badges y Chips

```
BADGE DE NIVEL
  ┌──────────┐
  │  Nivel 2  │
  └──────────┘
  Fondo: Lime ghost, borde 1px Lime 300
  Texto: Lime 500, Inter 600, 12px, br-full

─────────────────────────────────────────────────────

CHIP DE ESTADO
  ✓ Completado    →  Mint ghost + Mint 500
  ○ Pendiente     →  Surface 300 + Text Secondary
  ▲ En progreso   →  Warning ghost + Warning
  ✗ Omitido       →  Error ghost + Error

─────────────────────────────────────────────────────

CHIP DE CATEGORÍA (biblioteca)
  [Empuje]  [Tracción]  [Pierna]  [Core]
  Inactivo: Surface 300, Text Secondary, br-full
  Activo: Lime 500, Text Inverse, br-full

─────────────────────────────────────────────────────

BADGE DE NOTIFICACIÓN
  Círculo 8px, Error (#FF4D6A)
  Posición: top-right del ícono, offset -4px
```

-----

### 12.6 Navegación Modal

```
BOTTOM SHEET
  Drag handle: 4px × 36px, Surface 300, centrado, br-full
  Fondo: Surface 100
  Borde: 1px Border Subtle (top)
  Borde-radius top: 24px
  Detents: 40% / 70% / fullscreen según contenido
  Backdrop: negro @ 60%, dismissible con tap

─────────────────────────────────────────────────────

ACTION SHEET
  Lista de opciones con íconos izquierda
  Último ítem: destructivo (Error)
  "Cancelar" como ítem siempre visible
  Se presenta desde abajo, mismo estilo Bottom Sheet

─────────────────────────────────────────────────────

TOAST / SNACKBAR
  ┌────────────────────────────────────────────┐
  │  ✓  Dominadas registradas — 8 reps        │
  └────────────────────────────────────────────┘
  Posición: bottom center, 16px sobre Tab Bar
  Duración: 3s con dismiss swipe
  Éxito: Mint ghost, borde Mint
  Info: Info ghost
  Error: Error ghost
```

-----

## 13. PATRONES DE INTERACCIÓN

### 13.1 Flujo de Registro de Entrenamiento

```
FLUJO ACTIVO (durante sesión)
──────────────────────────────────────────────────────

Acción del usuario → Feedback inmediato

1. Toca "Iniciar entrenamiento"
   → Haptic: impact medium
   → Pantalla transición a Active Session
   → Timer inicia automáticamente

2. Completa repeticiones
   → Ingresa número o usa ± botones
   → Haptic: selection change por cada toque

3. Selecciona RPE
   → Haptic: selection change
   → Color del slider cambia dinámicamente

4. Toca "Completar serie y descansar"
   → Haptic: impact heavy (confirmación)
   → Checkmark animado en fila de la serie
   → Pantalla cambia a Rest Timer

5. Timer finaliza
   → Haptic: notification (3 pulsos)
   → Push notification si pantalla apagada
   → Pantalla vuelve automáticamente al ejercicio

6. Último set completado
   → Pantalla avanza al siguiente ejercicio
   → Progress bar se actualiza

7. Todos los ejercicios completados
   → Confetti animation sutil
   → Pantalla Session Summary
```

-----

### 13.2 Flujo de Registro de Comida en Texto Libre

```
1. Usuario escribe: "Comí pollo con arroz y aguacate"
   → Debounce 800ms después de última tecla
   → Spinner inline: "CALI está interpretando..."

2. Claude API analiza el texto (< 2s)
   → Resultado aparece como cards expandibles
   → Cada alimento muestra: nombre, gramaje, macros

3. Usuario ajusta cantidades si quiere
   → Spinners numéricos inline por alimento
   → Totales se recalculan en tiempo real

4. Usuario confirma
   → Haptic: impact medium
   → Toast: "✓ Comida registrada — 580 kcal"
   → Dashboard se actualiza con nuevos totales

PATTERN: Optimistic UI
Los datos se muestran inmediatamente en el dashboard
mientras la escritura a la base de datos ocurre en
segundo plano. Si falla, toast de error + rollback.
```

-----

### 13.3 Patrón de Carga Progresiva

```
Estado de carga (skeletons):

┌───────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← shimmer        │
│                                                       │
│  ░░░░░░░░░░░░░░░░░░░░░                               │
│                                                       │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└───────────────────────────────────────────────────────┘

Implementación:
  - Shimmer de izquierda a derecha
  - Fondo: Surface 200 → Surface 300 → Surface 200
  - Duración: 1.5s loop
  - Se muestra mínimo 400ms para evitar flash
  - Las cards aparecen con fade-in suave (200ms)
```

-----

### 13.4 Gestos Disponibles

```
Swipe derecho     →  Volver (en cualquier pantalla)
Swipe izquierda   →  Siguiente (en onboarding)
Pull to refresh   →  Actualizar datos de Apple Health
Swipe en log      →  Borrar ítem (dirección izq.)
Long press card   →  Opciones adicionales (Action Sheet)
Pinch en gráfica  →  Zoom en eje X (historial)
Double tap número →  Abrir teclado numérico (inputs)
```

-----

## 14. ESTADOS DE UI

### 14.1 Estados de Pantalla Vacía (Empty States)

```
PRIMERA VEZ — SIN ENTRENAMIENTO
┌───────────────────────────────────────────────────────┐
│                                                       │
│          [Ilustración: figura en posición             │
│           de inicio, trazo fino Lime]                 │
│                                                       │
│         Tu primer entrenamiento está listo.           │
│         CALI generó tu plan personalizado.            │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │       Ver mi plan de hoy             [→]        │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘

SIN HISTORIAL DE COMIDAS
  "Aún no registraste nada hoy.
   Tu primer registro tarda menos de 30 segundos."
  [Botón: Registrar primera comida]

SIN MEDIDAS CORPORALES
  "Registra tus medidas para calcular
   tu composición corporal con precisión."
  [Botón: Registrar ahora]
```

-----

### 14.2 Estados de Error

```
ERROR DE CONEXIÓN (red)
┌───────────────────────────────────────────────────────┐
│  ⚠️  Sin conexión                                     │
│      Mostrando datos guardados localmente.            │
│      Los cambios se sincronizarán al reconectar.      │
└───────────────────────────────────────────────────────┘
  Posición: banner debajo del header
  Color: Warning ghost
  No interrumpe el flujo — la app funciona offline

ERROR DE IA (timeout CALI)
┌───────────────────────────────────────────────────────┐
│  CALI no pudo responder en este momento.              │
│  Verifica tu conexión o inténtalo de nuevo.           │
│  [Reintentar]                                         │
└───────────────────────────────────────────────────────┘

ERROR DE VALIDACIÓN (formulario)
  El campo en error recibe borde Error (#FF4D6A)
  Helper text aparece debajo: "Ingresa un valor entre
  1 y 999 kg" — nunca "Error" genérico
```

-----

### 14.3 Estados de Éxito y Progreso

```
NUEVO MÁXIMO PERSONAL
  Pantalla Session Summary muestra banner:
  ┌──────────────────────────────────────────────────┐
  │  🏆  Nuevo máximo: 8 dominadas  (era 7)         │
  │      +14% respecto a la semana pasada            │
  └──────────────────────────────────────────────────┘
  Haptic: success (notificación larga)
  Animación: el banner entra desde arriba con bounce

OBJETIVO DIARIO COMPLETADO (hidratación/macros)
  La barra de progreso hace fill completo con animación
  El número cambia a color Mint/Lime según módulo
  Toast: "✓ Meta de agua alcanzada hoy 💧"

PROGRESIÓN AUTOMÁTICA ACTIVADA
  Banner en Training Home al abrir la app:
  "CALI ha actualizado tu plan: dominadas → 4×4
   porque completaste todas las series 2 semanas."
```

-----

### 14.4 Estado: Semana de Descarga

```
BANNER DE DESCARGA (aparece en Training Home)
┌───────────────────────────────────────────────────────┐
│  ⚡ Semana de descarga — Semana 7                     │
│                                                       │
│  Volumen reducido 40% para optimizar recuperación.   │
│  La próxima semana el plan vuelve a intensidad full. │
│                                                       │
│  Saber más →                                         │
└───────────────────────────────────────────────────────┘
Color: Warning ghost (#FFBB331A), borde Warning
Las rutinas de esta semana muestran tag "Descarga"
```

-----

### 14.5 Estado: Estancamiento Detectado

```
ALERT DE ESTANCAMIENTO (CALI en Dashboard)
┌───────────────────────────────────────────────────────┐
│  🤖 CALI detectó una señal                            │
│                                                       │
│  Llevas 3 semanas sin mejorar en dominadas.          │
│  He ajustado el plan:                                 │
│  ✓ Volumen reducido 20%                               │
│  ✓ Semana de descarga programada                     │
│  ✓ Reevaluación en 7 días                            │
│                                                       │
│  Ver cambios en mi plan →                            │
└───────────────────────────────────────────────────────┘
Color: Info ghost, borde Info
Requiere una acción del usuario para dismissear
```

-----

## 15. ACCESIBILIDAD

### 15.1 Contraste y Tamaños Mínimos

```
RATIOS DE CONTRASTE (WCAG AA)
  Lime 500 sobre Background Base:    12.1:1  ✓
  Text Primary sobre Surface 100:     9.4:1  ✓
  Text Secondary sobre Surface 100:   4.8:1  ✓ (AA)
  Mint 500 sobre Background Base:    10.3:1  ✓
  Error sobre Surface 100:            7.2:1  ✓

TAMAÑOS MÍNIMOS DE TOQUE
  Todos los elementos interactivos: mínimo 44×44px
  Botones de quicklog: 64px mínimo altura
  Ítems de lista: 48px mínimo altura
  Chips de filtro: 36px altura, 60px ancho mínimo

TIPOGRAFÍA ACCESIBLE
  Body mínimo: 16px (no usar texto por debajo de 12px)
  Contraste de números en gráficas: siempre Text Primary
  Labels de ejes en gráficas: mínimo 11px JetBrains Mono
```

-----

### 15.2 Soporte de Modo Oscuro / Claro

```
La app es nativa dark-first. En iOS, respeta el
ajuste del sistema. Valores para modo claro (v2.0):

  Background Base  →  #F8F8FC
  Surface 100      →  #FFFFFF
  Surface 200      →  #F0F0F8
  Border Subtle    →  #E0E0EC
  Text Primary     →  #0A0A1A
  Text Secondary   →  #5A5A7A
  Lime 500         →  #7CB800  (ajustado para contraste)
```

-----

### 15.3 Reduced Motion

```
Si el usuario tiene "Reducir movimiento" activado en iOS:
  - Deshabilitar animaciones de confetti
  - Deshabilitar spring animations de botones
  - Deshabilitar shimmer de skeletons (usar fade)
  - Mantener animación del timer (es funcional)
  - La botella de agua usa fade en lugar de fill animado
  Implementación: useReducedMotion() hook de Expo
```

-----

### 15.4 VoiceOver / TalkBack

```
Todos los elementos interactivos tienen:
  accessibilityLabel: descriptivo y en español
  accessibilityHint: qué ocurre al activarlo
  accessibilityRole: button / text / image / header

Gráficas: tienen descripción textual alternativa
  "Gráfica de progreso de dominadas. Semana 1: 4 reps.
   Semana 13: 8 reps. Aumento de 100%."

Barras de progreso: anuncian el porcentaje completo
  "Calorías: 1240 de 2840, 44 por ciento completado"
```

-----

## APÉNDICE A — Resumen de Pantallas por Módulo

|Módulo       |Pantallas MVP|Pantallas Futuras|
|-------------|-------------|-----------------|
|Auth         |3            |—                |
|Onboarding   |6            |—                |
|Dashboard    |1 + 2 modales|—                |
|Entrenamiento|6            |2                |
|Nutrición    |5            |1 (foto)         |
|Hidratación  |2            |—                |
|Coach IA     |2            |1                |
|Perfil       |3            |1 (fotos)        |
|Configuración|6            |2                |
|**Total MVP**|**36**       |**+6**           |

-----

## APÉNDICE B — Decisiones de Diseño Clave

### Por qué Dark Theme como default

Los usuarios de calistenia entrenan frecuentemente en horarios de madrugada y noche (6-9 AM, 7-10 PM). Una UI dark reduce fatiga ocular durante sesiones activas. Adicionalmente, las barras de progreso en Lime y Mint sobre fondos oscuros tienen mayor impacto visual y percepción de logro — el número en Lime sobre negro genera mayor emoción que el mismo número en cualquier paleta clara.

### Por qué Space Grotesk para números

Los números son el dato principal de una app de fitness. Space Grotesk tiene proporciones amplias en números, dígito 1 con serif, y cero diferenciado con 0 vs O — crítico para legibilidad en datos como “10” repeticiones vs distancias y pesos. Su personalidad es técnica sin ser fría, lo que ancla la marca en el espacio “precision athletics”.

### Por qué JetBrains Mono para macros

Los macros (P/G/C) se muestran en columnas. Una fuente monospace garantiza que los números estén alineados verticalmente incluso cuando tienen diferentes longitudes (“68g” vs “154g”), haciendo la comparación visualmente inmediata. El origen de la fuente (programación) refuerza la identidad técnica de la app.

### Por qué Lime + Mint como dual accent

Lime (#C8FF47) comunica energía, rendimiento y alerta — apropiado para entrenamiento. Mint (#3DFFC8) comunica frescura, salud y recuperación — apropiado para hidratación y descanso. La dualidad permite diferenciar módulos sin usar colores semánticos confusos (rojo = error, verde = success). El usuario aprende rápidamente que Lime = rendimiento, Mint = recuperación.

### Por qué Tab Bar de 5 ítems

La navegación principal de CALI-NUTRI AI tiene 5 dominios de igual importancia: Dashboard, Entrenamiento, Nutrición, Hidratación y IA. Un tab bar de 5 es el límite ergonómico en iOS/Android. Poner el Coach IA como tab principal (no en bottom sheet ni menú lateral) comunica que CALI no es un extra — es el core del producto.

-----

*Documento generado por el equipo de diseño de CALI-NUTRI AI.*
*Versión 1.0 — Junio 2026.*
*Próxima revisión: Al completar Sprint 2 (Fase 1) con primeras validaciones de usabilidad.*