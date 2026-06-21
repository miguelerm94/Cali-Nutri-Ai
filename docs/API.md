# CALI-NUTRI AI — API Reference

**Versión:** 1.0  
**Base URL:** `https://api.calinutri.app/v1`  
**Protocolo:** HTTPS + WSS (WebSocket para IA en tiempo real)  
**Autenticación:** Bearer JWT (RS256)  
**Content-Type:** `application/json`  
**Clasificación:** Documento Técnico Interno  
**Última actualización:** Junio 2026

-----

## ÍNDICE

1. [Convenciones Globales](#1-convenciones-globales)
1. [Autenticación — `/auth`](#2-autenticación)
1. [Usuarios — `/users`](#3-usuarios)
1. [Evaluación Inicial — `/assessment`](#4-evaluación-inicial)
1. [Entrenamientos — `/training`](#5-entrenamientos)
1. [Nutrición — `/nutrition`](#6-nutrición)
1. [Hidratación — `/hydration`](#7-hidratación)
1. [Dashboard — `/dashboard`](#8-dashboard)
1. [Health Integration — `/health`](#9-health-integration)
1. [IA Conversacional — `/ai`](#10-ia-conversacional)
1. [Notificaciones — `/notifications`](#11-notificaciones)
1. [Analítica — `/analytics`](#12-analítica)
1. [Administración — `/admin`](#13-administración)
1. [Errores](#14-códigos-de-error)
1. [Rate Limiting](#15-rate-limiting)
1. [Webhooks](#16-webhooks)

-----

## 1. CONVENCIONES GLOBALES

### Estructura de Respuesta Estándar

Todas las respuestas siguen el mismo envelope:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789",
    "version": "1.0"
  }
}
```

Errores:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo email es requerido",
    "details": [
      { "field": "email", "message": "email must be a valid email" }
    ]
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

### Headers Requeridos

|Header           |Valor                  |Requerido                  |
|-----------------|-----------------------|---------------------------|
|`Authorization`  |`Bearer <access_token>`|Sí (excepto rutas públicas)|
|`Content-Type`   |`application/json`     |Sí                         |
|`X-App-Version`  |`1.0.0`                |Sí                         |
|`X-Platform`     |`ios` | `android`      |Sí                         |
|`X-Device-Id`    |UUID del dispositivo   |Sí                         |
|`Accept-Language`|`es` | `en`            |No (default: `es`)         |

### Paginación

Endpoints de listas usan cursor-based pagination:

```
GET /training/sessions?cursor=eyJpZCI6IjEyMyJ9&limit=20
```

Respuesta incluye:

```json
{
  "data": [...],
  "pagination": {
    "has_next": true,
    "has_prev": false,
    "next_cursor": "eyJpZCI6IjE0MyJ9",
    "prev_cursor": null,
    "total_count": 87,
    "limit": 20
  }
}
```

### Tipos de Datos Comunes

|Campo         |Formato                                           |
|--------------|--------------------------------------------------|
|IDs           |UUID v4 (`"3f2504e0-4f89-11d3-9a0c-0305e82c3301"`)|
|Fechas        |ISO 8601 UTC (`"2026-06-13T10:30:00Z"`)           |
|Fechas locales|`"2026-06-13"`                                    |
|Pesos         |DECIMAL en kg (`80.5`)                            |
|Volúmenes     |INTEGER en ml (`500`)                             |
|Calorías      |DECIMAL en kcal (`2450.5`)                        |
|RPE           |INTEGER 1–10                                      |
|Duración      |INTEGER en segundos                               |

-----

## 2. AUTENTICACIÓN

Base path: `/auth`

Las rutas de autenticación son públicas (no requieren `Authorization` header) excepto `/auth/logout` y `/auth/me`.

-----

### POST `/auth/register`

Registra un nuevo usuario. Crea cuenta y devuelve tokens JWT. El onboarding posterior se completa con `POST /assessment/initial`.

**Request:**

```json
{
  "email": "carlos@email.com",
  "password": "Tr4in.Str0ng!",
  "first_name": "Carlos",
  "last_name": "Martínez",
  "accept_terms": true,
  "accept_privacy": true
}
```

**Validaciones:**

- `email`: formato válido, único en el sistema
- `password`: mínimo 8 caracteres, al menos 1 mayúscula, 1 número, 1 símbolo
- `accept_terms` y `accept_privacy`: deben ser `true`

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      "email": "carlos@email.com",
      "first_name": "Carlos",
      "last_name": "Martínez",
      "onboarding_completed": false,
      "created_at": "2026-06-13T10:30:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
      "token_type": "Bearer",
      "expires_in": 900
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

**Errores posibles:**

|Código                |Descripción                           |
|----------------------|--------------------------------------|
|`EMAIL_ALREADY_EXISTS`|El email ya está registrado           |
|`WEAK_PASSWORD`       |La contraseña no cumple los requisitos|
|`TERMS_NOT_ACCEPTED`  |Términos y política no aceptados      |

-----

### POST `/auth/login`

Inicia sesión con email y contraseña.

**Request:**

```json
{
  "email": "carlos@email.com",
  "password": "Tr4in.Str0ng!",
  "device_info": {
    "device_id": "iphone-uuid-12345",
    "device_name": "iPhone 16 Pro de Carlos",
    "os": "iOS 18.2",
    "app_version": "1.0.0"
  }
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      "email": "carlos@email.com",
      "first_name": "Carlos",
      "last_name": "Martínez",
      "avatar_url": "https://cdn.calinutri.app/users/3f25.../avatar.jpg",
      "onboarding_completed": true,
      "subscription": {
        "plan": "free",
        "expires_at": null
      },
      "last_login_at": "2026-06-12T08:00:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
      "token_type": "Bearer",
      "expires_in": 900
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

**Errores posibles:**

|Código               |Descripción                                    |
|---------------------|-----------------------------------------------|
|`INVALID_CREDENTIALS`|Email o contraseña incorrectos                 |
|`ACCOUNT_DISABLED`   |Cuenta suspendida                              |
|`TOO_MANY_ATTEMPTS`  |Rate limit: más de 5 intentos fallidos en 15min|

-----

### POST `/auth/refresh`

Intercambia un Refresh Token por un nuevo par de tokens. El RT anterior queda inmediatamente invalidado (Refresh Token Rotation). Si se detecta reutilización de un RT ya rotado, se invalida toda la familia de sesiones.

**Request:**

```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "tokens": {
      "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "bmV3UmVmcmVzaFRva2Vu...",
      "token_type": "Bearer",
      "expires_in": 900
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

**Errores posibles:**

|Código                 |Descripción                              |
|-----------------------|-----------------------------------------|
|`INVALID_REFRESH_TOKEN`|RT inválido o expirado                   |
|`TOKEN_FAMILY_REVOKED` |Posible robo detectado, sesión invalidada|

-----

### POST `/auth/logout`

🔒 **Requiere autenticación**

Invalida el Access Token actual (lo agrega a la blacklist en Redis) y revoca el Refresh Token.

**Request:**

```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "message": "Sesión cerrada correctamente"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/auth/forgot-password`

Envía email de recuperación de contraseña.

**Request:**

```json
{
  "email": "carlos@email.com"
}
```

**Response `200 OK`:** (siempre 200 para no revelar si el email existe)

```json
{
  "success": true,
  "data": {
    "message": "Si el email existe, recibirás instrucciones en los próximos minutos"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/auth/reset-password`

Establece nueva contraseña usando el token del email.

**Request:**

```json
{
  "reset_token": "tok_abc123xyz",
  "new_password": "N3wStr0ng!Pass",
  "confirm_password": "N3wStr0ng!Pass"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "message": "Contraseña actualizada. Por favor, inicia sesión nuevamente."
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/auth/oauth/:provider`

Autenticación social. Providers soportados: `google`, `apple`.

**Request:**

```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "device_info": {
    "device_id": "iphone-uuid-12345",
    "os": "iOS 18.2",
    "app_version": "1.0.0"
  }
}
```

**Response `200 OK`:** (misma estructura que `/auth/login` + campo `is_new_user`)

```json
{
  "success": true,
  "data": {
    "is_new_user": false,
    "user": { },
    "tokens": { }
  },
  "meta": { }
}
```

-----

### GET `/auth/me`

🔒 **Requiere autenticación**

Devuelve el usuario autenticado actual. Útil para validar sesión activa.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    "email": "carlos@email.com",
    "first_name": "Carlos",
    "last_name": "Martínez",
    "onboarding_completed": true,
    "subscription": {
      "plan": "free",
      "expires_at": null
    },
    "ai_messages_remaining_today": 42,
    "created_at": "2026-01-15T08:00:00Z"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 3. USUARIOS

Base path: `/users`

🔒 **Todos los endpoints requieren autenticación**

Un usuario solo puede acceder y modificar sus propios datos (Row-Level Security a nivel de DB + Guard a nivel de NestJS).

-----

### GET `/users/me/profile`

Obtiene el perfil completo del usuario autenticado.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    "email": "carlos@email.com",
    "first_name": "Carlos",
    "last_name": "Martínez",
    "birth_date": "1995-03-22",
    "age": 31,
    "sex": "male",
    "avatar_url": "https://cdn.calinutri.app/users/3f25.../avatar.jpg",
    "physical_data": {
      "height_cm": 178,
      "current_weight_kg": 78.5,
      "target_weight_kg": 82.0,
      "body_fat_percent": 18.2,
      "lean_mass_kg": 64.2,
      "bmi": 24.8
    },
    "fitness": {
      "experience_level": "intermediate",
      "goal": "muscle_gain",
      "training_frequency_days": 4,
      "available_equipment": ["bodyweight", "pull_up_bar"]
    },
    "nutrition_targets": {
      "calories_kcal": 2850,
      "protein_g": 157,
      "fat_g": 78,
      "carbs_g": 356,
      "last_calculated_at": "2026-06-01T08:00:00Z"
    },
    "hydration_target_ml": 3140,
    "preferences": {
      "language": "es",
      "units": "metric",
      "notifications_enabled": true,
      "health_sync_enabled": true
    },
    "subscription": {
      "plan": "free",
      "expires_at": null
    },
    "onboarding_completed": true,
    "created_at": "2026-01-15T08:00:00Z",
    "updated_at": "2026-06-10T14:00:00Z"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PATCH `/users/me/profile`

Actualiza datos del perfil. Solo los campos enviados se modifican.

**Request:**

```json
{
  "first_name": "Carlos",
  "last_name": "Martínez Ruiz",
  "birth_date": "1995-03-22",
  "sex": "male",
  "height_cm": 178,
  "preferences": {
    "language": "es",
    "units": "metric",
    "notifications_enabled": true
  }
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "updated_fields": ["last_name", "preferences.notifications_enabled"],
    "profile": { }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PUT `/users/me/avatar`

Sube o actualiza la foto de perfil. Usa `multipart/form-data`.

**Request:**

```
Content-Type: multipart/form-data

file: [imagen JPG/PNG, máx 5MB]
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "avatar_url": "https://cdn.calinutri.app/users/3f25.../avatar.jpg"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/users/me/body-measurements`

Registra una nueva medición corporal. El sistema recalcula automáticamente IMC, masa magra y actualiza los objetivos nutricionales si el peso cambió.

**Request:**

```json
{
  "weight_kg": 79.2,
  "waist_cm": 84.0,
  "neck_cm": 38.5,
  "hip_cm": null,
  "body_fat_percent": null,
  "measured_at": "2026-06-13",
  "notes": "Medición matutina, en ayunas"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "measurement": {
      "id": "meas_01HWXYZ",
      "weight_kg": 79.2,
      "waist_cm": 84.0,
      "neck_cm": 38.5,
      "bmi": 25.0,
      "lean_mass_kg": 64.8,
      "body_fat_percent": 18.2,
      "measured_at": "2026-06-13",
      "created_at": "2026-06-13T08:00:00Z"
    },
    "changes": {
      "weight_delta_kg": 0.7,
      "weight_trend": "gaining",
      "weeks_tracked": 12
    },
    "nutrition_targets_updated": false,
    "ai_insight": "Llevas 12 semanas de seguimiento. Tu progreso es consistente con tu objetivo de ganancia muscular."
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/users/me/body-measurements`

Historial de mediciones corporales con paginación.

**Query params:**

|Param   |Tipo   |Default     |Descripción         |
|--------|-------|------------|--------------------|
|`from`  |date   |hace 90 días|Fecha inicio        |
|`to`    |date   |hoy         |Fecha fin           |
|`limit` |integer|30          |Máx por página      |
|`cursor`|string |—           |Cursor de paginación|

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "measurements": [
      {
        "id": "meas_01HWXYZ",
        "weight_kg": 79.2,
        "bmi": 25.0,
        "body_fat_percent": 18.2,
        "lean_mass_kg": 64.8,
        "measured_at": "2026-06-13"
      }
    ],
    "summary": {
      "start_weight_kg": 76.0,
      "current_weight_kg": 79.2,
      "total_change_kg": 3.2,
      "trend": "gaining",
      "avg_weekly_change_kg": 0.27
    }
  },
  "pagination": {
    "has_next": true,
    "next_cursor": "eyJpZCI6Im1lYXNfMDFIV1dYWiJ9",
    "total_count": 52
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PATCH `/users/me/change-password`

Cambia la contraseña del usuario autenticado.

**Request:**

```json
{
  "current_password": "Tr4in.Str0ng!",
  "new_password": "N3wStr0ng!Pass",
  "confirm_password": "N3wStr0ng!Pass"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "message": "Contraseña actualizada. Todas las demás sesiones han sido cerradas."
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### DELETE `/users/me`

Elimina la cuenta permanentemente (GDPR Right to be Forgotten). Requiere confirmación por contraseña. Proceso asíncrono: datos eliminados en 30 días.

**Request:**

```json
{
  "password": "Tr4in.Str0ng!",
  "reason": "Ya no uso la aplicación",
  "confirm_phrase": "ELIMINAR MI CUENTA"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "message": "Cuenta marcada para eliminación. Tienes 30 días para cancelar desde settings.calinutri.app.",
    "deletion_scheduled_at": "2026-07-13T10:30:00Z",
    "cancellation_token": "cancel_abc123xyz"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/users/me/export`

Exporta todos los datos del usuario en formato JSON (GDPR Data Portability). El archivo se genera de forma asíncrona y se envía por email.

**Response `202 Accepted`:**

```json
{
  "success": true,
  "data": {
    "message": "Tu exportación está siendo preparada. Recibirás un email en los próximos 10 minutos.",
    "export_id": "exp_01HWXYZ",
    "estimated_ready_at": "2026-06-13T10:40:00Z"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 4. EVALUACIÓN INICIAL

Base path: `/assessment`

🔒 **Requiere autenticación**

La evaluación inicial recopila los datos físicos y de capacidad del usuario para generar su primer programa de entrenamiento y objetivos nutricionales. Debe completarse antes de acceder a los módulos de entrenamiento y nutrición.

-----

### POST `/assessment/initial`

Registra la evaluación inicial completa (onboarding). Ejecuta el Motor de Entrenamiento y el Motor Nutricional para generar el perfil personalizado.

**Request:**

```json
{
  "physical": {
    "height_cm": 178,
    "weight_kg": 78.5,
    "target_weight_kg": 82.0,
    "birth_date": "1995-03-22",
    "sex": "male"
  },
  "fitness": {
    "goal": "muscle_gain",
    "training_frequency_days": 4,
    "experience_level": "intermediate"
  },
  "maximal_reps": {
    "push": {
      "incline_pushups": null,
      "pushups": 25,
      "diamond_pushups": 12,
      "pike_pushups": 8,
      "decline_pushups": 10,
      "pseudo_pushups": 6
    },
    "pull": {
      "pull_ups": 5,
      "chin_ups": 7,
      "negative_pull_ups": 3
    },
    "legs": {
      "squats": 40,
      "pause_squats": 20,
      "bulgarian_split_squats": 10,
      "lunges": 15,
      "jump_squats": 12,
      "step_ups": 20
    },
    "core": {
      "plank_seconds": 60,
      "hollow_hold_seconds": 30,
      "leg_raises": 10,
      "knee_raises": 15,
      "reverse_crunch": 20
    }
  },
  "lifestyle": {
    "average_daily_steps": 8000,
    "average_sleep_hours": 7.5,
    "activity_level": "moderate"
  }
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "onboarding_completed": true,
    "user_level": {
      "pull_ups": 2,
      "pushups": 2,
      "overall": "intermediate"
    },
    "nutrition_targets": {
      "calories_kcal": 2850,
      "protein_g": 157,
      "fat_g": 78,
      "carbs_g": 356,
      "tdee_kcal": 2650,
      "tmb_kcal": 1790,
      "surplus_kcal": 200,
      "calculation_method": "mifflin_st_jeor",
      "activity_factor": 1.55,
      "protein_per_kg": 2.0,
      "fat_per_kg": 1.0
    },
    "hydration_target_ml": 3140,
    "training_program": {
      "id": "prog_01HWXYZ",
      "name": "Upper / Lower — Hipertrofia",
      "goal": "muscle_gain",
      "weekly_frequency": 4,
      "split_type": "upper_lower",
      "start_date": "2026-06-14",
      "estimated_duration_weeks": 12
    },
    "first_workout": {
      "scheduled_for": "2026-06-14",
      "day_name": "Upper A",
      "exercises_count": 6
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/assessment/retest`

Reevalúa los máximos del usuario. Se usa cuando hay estancamiento detectado o cuando el usuario solicita ajuste manual. Puede disparar una actualización del programa.

**Request:**

```json
{
  "reason": "plateau_detected",
  "maximal_reps": {
    "pull": {
      "pull_ups": 8,
      "chin_ups": 10
    },
    "push": {
      "pushups": 32
    }
  }
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "improvements": {
      "pull_ups": { "previous": 5, "current": 8, "delta": 3, "percent": 60 },
      "pushups": { "previous": 25, "current": 32, "delta": 7, "percent": 28 }
    },
    "level_changes": {
      "pull_ups": { "previous": 2, "current": 3 }
    },
    "program_updated": true,
    "message": "¡Impresionante progreso! Tu nivel en dominadas subió de 2 a 3. Tu programa se ha actualizado para reflejar tu nueva capacidad."
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 5. ENTRENAMIENTOS

Base path: `/training`

🔒 **Requiere autenticación**

-----

### GET `/training/programs/active`

Obtiene el programa de entrenamiento activo del usuario con todos sus días y ejercicios.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "program": {
      "id": "prog_01HWXYZ",
      "name": "Upper / Lower — Hipertrofia",
      "goal": "muscle_gain",
      "weekly_frequency": 4,
      "split_type": "upper_lower",
      "start_date": "2026-06-14",
      "current_week": 3,
      "total_weeks": 12,
      "status": "active",
      "is_deload_week": false,
      "next_deload_week": 6,
      "progression_status": "on_track",
      "workout_days": [
        {
          "id": "day_01A",
          "day_name": "Upper A",
          "workout_type": "upper",
          "scheduled_weekdays": ["monday", "thursday"],
          "exercises": [
            {
              "id": "we_001",
              "order": 1,
              "exercise": {
                "id": "ex_pull_ups",
                "name": "Dominadas",
                "category": "pull",
                "difficulty": 3,
                "equipment": ["pull_up_bar"],
                "muscle_groups": ["latissimus_dorsi", "biceps", "rear_deltoids"],
                "video_url": "https://cdn.calinutri.app/exercises/pull_ups.mp4",
                "thumbnail_url": "https://cdn.calinutri.app/exercises/pull_ups.jpg",
                "cues": [
                  "Agarra la barra con pronación, ancho de hombros",
                  "Escápulas abajo y atrás antes de tirar",
                  "Lleva el pecho a la barra, no la barbilla"
                ]
              },
              "prescription": {
                "sets": 4,
                "reps": 3,
                "rest_seconds": 120,
                "target_rpe": 7,
                "intensity_percentage": 0.60,
                "notes": "Basado en máximo actual de 5 repeticiones"
              }
            },
            {
              "id": "we_002",
              "order": 2,
              "exercise": {
                "id": "ex_pushups",
                "name": "Flexiones",
                "category": "push",
                "difficulty": 2
              },
              "prescription": {
                "sets": 4,
                "reps": 15,
                "rest_seconds": 90,
                "target_rpe": 7
              }
            }
          ]
        },
        {
          "id": "day_02B",
          "day_name": "Lower A",
          "workout_type": "lower",
          "scheduled_weekdays": ["tuesday", "friday"],
          "exercises": [ ]
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/training/today`

Obtiene el entrenamiento programado para hoy. Si ya existe una sesión activa, la devuelve. Si no hay entrenamiento hoy, lo indica.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "has_workout_today": true,
    "workout_day": {
      "id": "day_01A",
      "day_name": "Upper A",
      "workout_type": "upper"
    },
    "active_session": null,
    "completed_today": false,
    "estimated_duration_minutes": 45,
    "exercises": [ ],
    "motivation": {
      "message": "Semana 3, Día 2. Llevas 9 entrenamientos completados. ¡Vas muy bien! 💪",
      "streak_days": 6
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/training/sessions`

Inicia una nueva sesión de entrenamiento.

**Request:**

```json
{
  "workout_day_id": "day_01A",
  "started_at": "2026-06-13T10:00:00Z",
  "recovery_data": {
    "sleep_hours": 7.5,
    "fatigue_level": 3,
    "muscle_soreness": "mild",
    "notes": "Me siento bien hoy"
  }
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "sess_01HWXYZ",
      "workout_day_id": "day_01A",
      "day_name": "Upper A",
      "status": "in_progress",
      "started_at": "2026-06-13T10:00:00Z",
      "recovery_data": {
        "sleep_hours": 7.5,
        "fatigue_level": 3,
        "muscle_soreness": "mild"
      },
      "volume_adjustment": null,
      "exercises_to_complete": 6,
      "exercises_completed": 0
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:00:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

**Nota:** Si `sleep_hours < 6` durante 3 días consecutivos, el backend automáticamente ajusta `volume_adjustment: -10%` y lo incluye en la respuesta.

-----

### POST `/training/sessions/:session_id/logs`

Registra el resultado de una serie dentro de una sesión activa.

**Request:**

```json
{
  "workout_exercise_id": "we_001",
  "set_number": 1,
  "reps_completed": 3,
  "rpe": 7,
  "to_failure": false,
  "rest_seconds_taken": 125,
  "notes": null
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "log": {
      "id": "log_01HWXYZ",
      "session_id": "sess_01HWXYZ",
      "exercise_name": "Dominadas",
      "set_number": 1,
      "reps_completed": 3,
      "reps_target": 3,
      "rpe": 7,
      "target_rpe": 7,
      "completed_at": "2026-06-13T10:05:00Z"
    },
    "set_feedback": {
      "status": "on_target",
      "message": "Serie perfecta. RPE en zona objetivo."
    },
    "next_rest_suggestion_seconds": 120,
    "session_progress": {
      "sets_completed": 1,
      "sets_total": 16,
      "percent": 6.25
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:05:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PATCH `/training/sessions/:session_id/complete`

Finaliza una sesión de entrenamiento. El Motor de Entrenamiento evalúa el rendimiento y determina si corresponde progresión o ajuste.

**Request:**

```json
{
  "completed_at": "2026-06-13T10:55:00Z",
  "overall_feeling": 8,
  "notes": "Me costaron las últimas series de dominadas"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "session_summary": {
      "id": "sess_01HWXYZ",
      "duration_seconds": 3300,
      "total_sets_completed": 16,
      "total_sets_planned": 16,
      "completion_rate": 1.0,
      "total_reps": 104,
      "avg_rpe": 7.3,
      "calories_burned_estimate": 280
    },
    "performance_analysis": {
      "all_sets_completed": true,
      "consecutive_complete_weeks": 1,
      "progression_trigger": false,
      "message": "Excelente sesión. Completa esta semana y la próxima, y aumentaremos una repetición por serie.",
      "plateau_detected": false
    },
    "records": [
      {
        "exercise": "Dominadas",
        "type": "rpe_consistency",
        "message": "4 series en RPE objetivo — técnica sólida."
      }
    ],
    "daily_summary_updated": true
  },
  "meta": {
    "timestamp": "2026-06-13T10:55:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### DELETE `/training/sessions/:session_id`

Cancela una sesión en progreso (sin guardar).

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "message": "Sesión cancelada"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/training/sessions`

Historial de sesiones completadas con paginación.

**Query params:**

|Param   |Tipo   |Default     |Descripción                    |
|--------|-------|------------|-------------------------------|
|`from`  |date   |hace 30 días|Fecha inicio                   |
|`to`    |date   |hoy         |Fecha fin                      |
|`status`|string |`completed` |`completed`, `cancelled`, `all`|
|`limit` |integer|20          |Máx por página                 |
|`cursor`|string |—           |Cursor                         |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "sess_01HWXYZ",
        "day_name": "Upper A",
        "workout_type": "upper",
        "started_at": "2026-06-13T10:00:00Z",
        "completed_at": "2026-06-13T10:55:00Z",
        "duration_seconds": 3300,
        "completion_rate": 1.0,
        "total_reps": 104,
        "avg_rpe": 7.3,
        "status": "completed"
      }
    ],
    "stats": {
      "total_sessions": 28,
      "avg_completion_rate": 0.94,
      "total_training_minutes": 1260,
      "current_streak_days": 6,
      "longest_streak_days": 14
    }
  },
  "pagination": {
    "has_next": false,
    "total_count": 28
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/training/sessions/:session_id`

Detalle completo de una sesión, incluyendo todos los logs registrados.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "sess_01HWXYZ",
      "day_name": "Upper A",
      "started_at": "2026-06-13T10:00:00Z",
      "completed_at": "2026-06-13T10:55:00Z",
      "duration_seconds": 3300,
      "recovery_data": {
        "sleep_hours": 7.5,
        "fatigue_level": 3
      },
      "logs": [
        {
          "id": "log_001",
          "exercise_name": "Dominadas",
          "exercise_id": "ex_pull_ups",
          "set_number": 1,
          "reps_completed": 3,
          "rpe": 7,
          "completed_at": "2026-06-13T10:05:00Z"
        },
        {
          "id": "log_002",
          "exercise_name": "Dominadas",
          "exercise_id": "ex_pull_ups",
          "set_number": 2,
          "reps_completed": 3,
          "rpe": 8,
          "completed_at": "2026-06-13T10:08:00Z"
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/training/exercises`

Catálogo maestro de ejercicios con filtros.

**Query params:**

|Param       |Tipo   |Descripción                   |
|------------|-------|------------------------------|
|`category`  |string |`push`, `pull`, `legs`, `core`|
|`difficulty`|integer|1–5                           |
|`search`    |string |Búsqueda por nombre           |
|`limit`     |integer|Default 50                    |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "exercises": [
      {
        "id": "ex_pull_ups",
        "name": "Dominadas",
        "name_en": "Pull-ups",
        "category": "pull",
        "difficulty": 3,
        "equipment": ["pull_up_bar"],
        "muscle_groups": ["latissimus_dorsi", "biceps", "rear_deltoids"],
        "is_compound": true,
        "description": "Ejercicio fundamental de tracción que desarrolla principalmente el dorsal ancho.",
        "video_url": "https://cdn.calinutri.app/exercises/pull_ups.mp4",
        "thumbnail_url": "https://cdn.calinutri.app/exercises/pull_ups.jpg",
        "cues": [
          "Agarra la barra con pronación, ancho de hombros",
          "Escápulas abajo y atrás antes de tirar",
          "Lleva el pecho a la barra"
        ],
        "progressions": ["ex_negative_pull_ups", "ex_band_assisted_pull_ups"],
        "regressions": ["ex_inverted_rows"]
      }
    ]
  },
  "pagination": {
    "total_count": 22,
    "has_next": false
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/training/progress`

Indicadores de progreso por ejercicio y tendencias de rendimiento.

**Query params:**

|Param        |Tipo  |Default   |Descripción                      |
|-------------|------|----------|---------------------------------|
|`exercise_id`|string|—         |Filtrar por ejercicio            |
|`metric`     |string|`max_reps`|`max_reps`, `volume`, `rpe_trend`|
|`period`     |string|`12w`     |`4w`, `8w`, `12w`, `6m`, `1y`    |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "period": "12w",
    "progress_by_exercise": [
      {
        "exercise_id": "ex_pull_ups",
        "exercise_name": "Dominadas",
        "category": "pull",
        "data_points": [
          { "week": "2026-W01", "max_reps": 5, "total_volume_reps": 48, "avg_rpe": 8.1 },
          { "week": "2026-W02", "max_reps": 5, "total_volume_reps": 48, "avg_rpe": 7.8 },
          { "week": "2026-W03", "max_reps": 6, "total_volume_reps": 52, "avg_rpe": 7.5 }
        ],
        "summary": {
          "starting_max": 5,
          "current_max": 8,
          "improvement_percent": 60,
          "trend": "improving"
        }
      },
      {
        "exercise_id": "ex_pushups",
        "exercise_name": "Flexiones",
        "category": "push",
        "data_points": [ ],
        "summary": {
          "starting_max": 25,
          "current_max": 32,
          "improvement_percent": 28,
          "trend": "improving"
        }
      }
    ],
    "overall": {
      "training_consistency_percent": 92,
      "avg_session_completion_rate": 0.94,
      "weeks_trained": 11,
      "plateau_risks": []
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/training/programs/active/adjustments`

Obtiene los ajustes pendientes o recientes al programa (progresiones, descargas, cambios de volumen).

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "pending_adjustments": [],
    "recent_adjustments": [
      {
        "id": "adj_001",
        "type": "progression",
        "exercise_name": "Dominadas",
        "description": "Completaste 2 semanas consecutivas. Reps incrementadas de 3 a 4 por serie.",
        "applied_at": "2026-06-01T00:00:00Z",
        "old_prescription": { "sets": 4, "reps": 3 },
        "new_prescription": { "sets": 4, "reps": 4 }
      }
    ],
    "upcoming": {
      "deload_week": {
        "scheduled_week": "2026-07-14",
        "weeks_away": 4,
        "reduction": { "volume_percent": -40, "intensity_percent": -20 }
      }
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 6. NUTRICIÓN

Base path: `/nutrition`

🔒 **Requiere autenticación**

-----

### GET `/nutrition/targets`

Obtiene los objetivos nutricionales actuales del usuario con justificación científica.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "targets": {
      "calories_kcal": 2850,
      "protein_g": 157,
      "fat_g": 78,
      "carbs_g": 356,
      "fiber_g_min": 25
    },
    "breakdown": {
      "tmb_kcal": 1790,
      "tdee_kcal": 2650,
      "adjustment_kcal": 200,
      "adjustment_type": "surplus",
      "activity_factor": 1.55,
      "activity_label": "Moderado",
      "protein_per_kg": 2.0,
      "fat_per_kg": 1.0,
      "calculation_method": "mifflin_st_jeor",
      "based_on_weight_kg": 78.5
    },
    "macros_percent": {
      "protein": 22.0,
      "fat": 24.6,
      "carbs": 49.9,
      "alcohol": 0
    },
    "last_auto_adjusted_at": null,
    "next_auto_review_date": "2026-06-27",
    "scientific_notes": [
      "Proteína: 2.0 g/kg — rango óptimo para hipertrofia según meta-análisis Morton et al. (2018)",
      "Grasas: 1.0 g/kg — suficiente para función hormonal óptima",
      "Superávit moderado de 200 kcal — minimiza acumulación de grasa en fase de volumen"
    ]
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/nutrition/diary/today`

Obtiene el diario de alimentos del día actual con resumen de macros.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "date": "2026-06-13",
    "entries": [
      {
        "id": "entry_001",
        "meal_type": "breakfast",
        "meal_label": "Desayuno",
        "logged_at": "2026-06-13T07:30:00Z",
        "food": {
          "id": "food_eggs",
          "name": "Huevos enteros",
          "brand": null,
          "per_100g": {
            "calories_kcal": 155,
            "protein_g": 13.0,
            "fat_g": 11.0,
            "carbs_g": 1.1
          }
        },
        "quantity_g": 200,
        "nutrition": {
          "calories_kcal": 310,
          "protein_g": 26.0,
          "fat_g": 22.0,
          "carbs_g": 2.2
        },
        "log_method": "manual",
        "ai_confidence": null
      },
      {
        "id": "entry_002",
        "meal_type": "breakfast",
        "meal_label": "Desayuno",
        "logged_at": "2026-06-13T07:31:00Z",
        "food": {
          "id": "food_oats",
          "name": "Avena en hojuelas",
          "brand": null
        },
        "quantity_g": 80,
        "nutrition": {
          "calories_kcal": 296,
          "protein_g": 10.4,
          "fat_g": 5.2,
          "carbs_g": 54.4
        },
        "log_method": "manual",
        "ai_confidence": null
      }
    ],
    "summary": {
      "calories": { "consumed": 606, "target": 2850, "remaining": 2244, "percent": 21.3 },
      "protein": { "consumed": 36.4, "target": 157, "remaining": 120.6, "percent": 23.2 },
      "fat": { "consumed": 27.2, "target": 78, "remaining": 50.8, "percent": 34.9 },
      "carbs": { "consumed": 56.6, "target": 356, "remaining": 299.4, "percent": 15.9 },
      "fiber": { "consumed": 4.2, "target_min": 25, "remaining": 20.8 }
    },
    "by_meal": {
      "breakfast": { "calories_kcal": 606, "protein_g": 36.4 },
      "lunch": { "calories_kcal": 0, "protein_g": 0 },
      "dinner": { "calories_kcal": 0, "protein_g": 0 },
      "snacks": { "calories_kcal": 0, "protein_g": 0 }
    },
    "adherence": {
      "today_percent": 21.3,
      "last_7_days_avg_percent": 87.2,
      "status": "on_track"
    },
    "ai_recommendations": [
      "Te faltan 120 g de proteína. Considera pollo, atún o proteína en polvo para el almuerzo.",
      "Estás en buen camino para las calorías."
    ]
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/nutrition/diary`

Historial del diario nutricional con filtros de fecha.

**Query params:**

|Param      |Tipo   |Default    |Descripción                            |
|-----------|-------|-----------|---------------------------------------|
|`from`     |date   |hace 7 días|Fecha inicio                           |
|`to`       |date   |hoy        |Fecha fin                              |
|`meal_type`|string |—          |`breakfast`, `lunch`, `dinner`, `snack`|
|`limit`    |integer|30         |Entradas por página                    |

**Response `200 OK`:** Array de entradas con misma estructura que `/diary/today`, agrupadas por fecha.

-----

### POST `/nutrition/diary`

Registra un alimento en el diario. Soporta tres métodos: `manual`, `barcode`, `ai_text`.

**Request (método manual):**

```json
{
  "meal_type": "lunch",
  "log_method": "manual",
  "food_id": "food_chicken_breast",
  "quantity_g": 200,
  "logged_at": "2026-06-13T13:00:00Z"
}
```

**Request (método lenguaje natural — IA interpreta):**

```json
{
  "meal_type": "lunch",
  "log_method": "ai_text",
  "natural_text": "Comí 200 gramos de pollo a la plancha con 150 gramos de arroz y medio aguacate",
  "logged_at": "2026-06-13T13:00:00Z"
}
```

**Request (código de barras):**

```json
{
  "meal_type": "snack",
  "log_method": "barcode",
  "barcode": "7501234567890",
  "quantity_g": 40,
  "logged_at": "2026-06-13T16:00:00Z"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "entries_created": [
      {
        "id": "entry_010",
        "food": {
          "id": "food_chicken_breast",
          "name": "Pechuga de pollo, a la plancha",
          "source": "USDA"
        },
        "quantity_g": 200,
        "nutrition": {
          "calories_kcal": 330,
          "protein_g": 62.0,
          "fat_g": 7.2,
          "carbs_g": 0
        },
        "log_method": "ai_text",
        "ai_confidence": 0.95,
        "meal_type": "lunch"
      },
      {
        "id": "entry_011",
        "food": {
          "id": "food_rice_cooked",
          "name": "Arroz blanco, cocido"
        },
        "quantity_g": 150,
        "nutrition": {
          "calories_kcal": 195,
          "protein_g": 3.6,
          "fat_g": 0.3,
          "carbs_g": 43.1
        },
        "log_method": "ai_text",
        "ai_confidence": 0.92,
        "meal_type": "lunch"
      }
    ],
    "daily_totals_updated": {
      "calories_kcal": 1131,
      "protein_g": 102.0,
      "remaining_protein_g": 55.0
    },
    "notification": "¡Ya llevas el 65% de tu proteína diaria! Vas muy bien. 💪"
  },
  "meta": {
    "timestamp": "2026-06-13T13:00:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/nutrition/diary/photo`

Registra un alimento mediante análisis de fotografía con IA (Computer Vision). Usa `multipart/form-data`.

**Request:**

```
Content-Type: multipart/form-data

photo: [imagen JPG/PNG, máx 10MB]
meal_type: "lunch"
logged_at: "2026-06-13T13:00:00Z"
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "ai_analysis": {
      "identified_foods": [
        {
          "name": "Pechuga de pollo a la plancha",
          "estimated_quantity_g": 180,
          "confidence": 0.88
        },
        {
          "name": "Arroz blanco cocido",
          "estimated_quantity_g": 150,
          "confidence": 0.85
        },
        {
          "name": "Ensalada de lechuga",
          "estimated_quantity_g": 60,
          "confidence": 0.72
        }
      ],
      "overall_confidence": 0.82,
      "analysis_model": "claude-3-5-sonnet",
      "requires_confirmation": true
    },
    "draft_entries": [
      {
        "food_name": "Pechuga de pollo a la plancha",
        "quantity_g": 180,
        "nutrition": {
          "calories_kcal": 297,
          "protein_g": 55.8,
          "fat_g": 6.5,
          "carbs_g": 0
        },
        "confidence": 0.88
      }
    ],
    "confirmation_required": true,
    "message": "Identifiqué 3 alimentos. Por favor confirma o ajusta las cantidades antes de guardar."
  },
  "meta": {
    "timestamp": "2026-06-13T13:00:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PATCH `/nutrition/diary/:entry_id`

Edita una entrada del diario (cantidad o tipo de comida).

**Request:**

```json
{
  "quantity_g": 250,
  "meal_type": "lunch"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "entry_010",
      "quantity_g": 250,
      "nutrition": {
        "calories_kcal": 412.5,
        "protein_g": 77.5
      }
    },
    "daily_totals_updated": {
      "calories_kcal": 1213.5,
      "protein_g": 117.5
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### DELETE `/nutrition/diary/:entry_id`

Elimina una entrada del diario.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "message": "Entrada eliminada",
    "daily_totals_updated": {
      "calories_kcal": 1000,
      "protein_g": 55.0
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/nutrition/foods/search`

Busca alimentos en la base de datos (USDA + Open Food Facts + tabla personalizada).

**Query params:**

|Param     |Tipo   |Descripción                                              |
|----------|-------|---------------------------------------------------------|
|`q`       |string |**Requerido.** Término de búsqueda                       |
|`source`  |string |`usda`, `openfoodfacts`, `custom`, `all` (default: `all`)|
|`limit`   |integer|Default 20, máx 50                                       |
|`language`|string |`es`, `en` (default: `es`)                               |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "foods": [
      {
        "id": "food_chicken_breast",
        "name": "Pechuga de pollo, cruda",
        "name_es": "Pechuga de pollo, cruda",
        "brand": null,
        "source": "USDA",
        "barcode": null,
        "per_100g": {
          "calories_kcal": 165,
          "protein_g": 31.0,
          "fat_g": 3.6,
          "carbs_g": 0,
          "fiber_g": 0,
          "sugar_g": 0,
          "sodium_mg": 74
        },
        "common_serving_sizes": [
          { "label": "1 pechuga mediana", "quantity_g": 174 },
          { "label": "100g", "quantity_g": 100 }
        ]
      }
    ],
    "total_results": 12,
    "query": "pechuga pollo"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/nutrition/foods/barcode/:barcode`

Busca un alimento por código de barras.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "found": true,
    "food": {
      "id": "food_bar_001",
      "name": "Avena Quaker Original",
      "brand": "Quaker",
      "barcode": "7501234567890",
      "source": "openfoodfacts",
      "per_100g": {
        "calories_kcal": 371,
        "protein_g": 13.0,
        "fat_g": 7.0,
        "carbs_g": 60.0,
        "fiber_g": 10.0
      },
      "common_serving_sizes": [
        { "label": "1/2 taza (40g)", "quantity_g": 40 }
      ]
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/nutrition/meal-plan/today`

Obtiene el plan de comidas sugerido para hoy, adaptado a las calorías restantes y alimentos preferidos.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "date": "2026-06-13",
    "remaining_targets": {
      "calories_kcal": 2244,
      "protein_g": 120.6,
      "fat_g": 50.8,
      "carbs_g": 299.4
    },
    "meals": [
      {
        "meal_type": "lunch",
        "meal_label": "Almuerzo",
        "suggested_time": "13:00",
        "items": [
          { "food": "Pechuga de pollo a la plancha", "quantity_g": 200, "protein_g": 62, "calories_kcal": 330 },
          { "food": "Arroz blanco cocido", "quantity_g": 200, "protein_g": 4.8, "calories_kcal": 260 },
          { "food": "Aguacate", "quantity_g": 100, "protein_g": 2, "calories_kcal": 160 }
        ],
        "total": { "calories_kcal": 750, "protein_g": 68.8 }
      },
      {
        "meal_type": "snack",
        "meal_label": "Merienda",
        "suggested_time": "16:30",
        "items": [
          { "food": "Proteína en polvo (suero)", "quantity_g": 30, "protein_g": 24, "calories_kcal": 120 },
          { "food": "Banana mediana", "quantity_g": 120, "protein_g": 1.5, "calories_kcal": 107 }
        ],
        "total": { "calories_kcal": 227, "protein_g": 25.5 }
      },
      {
        "meal_type": "dinner",
        "meal_label": "Cena",
        "suggested_time": "20:00",
        "items": [
          { "food": "Huevos enteros", "quantity_g": 200, "protein_g": 26, "calories_kcal": 310 },
          { "food": "Avena cocida", "quantity_g": 150, "protein_g": 7.5, "calories_kcal": 180 }
        ],
        "total": { "calories_kcal": 490, "protein_g": 33.5 }
      }
    ],
    "projected_daily_total": {
      "calories_kcal": 2073,
      "protein_g": 162.8,
      "status": "meets_protein_target"
    },
    "generated_by": "ai",
    "based_on": ["remaining_macros", "common_foods_in_diary", "meal_timing_preferences"]
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/nutrition/adherence`

Estadísticas de adherencia nutricional histórica.

**Query params:** `period` (`7d`, `14d`, `30d`, `90d`)

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "from": "2026-05-14",
    "to": "2026-06-13",
    "adherence": {
      "days_logged": 26,
      "days_total": 30,
      "logging_rate_percent": 86.7,
      "avg_calories_percent": 92.3,
      "avg_protein_percent": 88.1,
      "calorie_trend": "stable"
    },
    "auto_adjustment": {
      "eligible": false,
      "reason": "not_enough_data",
      "next_review": "2026-06-27",
      "message": "Seguiremos monitoreando. Si en 14 días no hay cambio de peso con adherencia >80%, ajustaremos las calorías."
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 7. HIDRATACIÓN

Base path: `/hydration`

🔒 **Requiere autenticación**

-----

### GET `/hydration/today`

Estado de hidratación del día actual.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "date": "2026-06-13",
    "target_ml": 3140,
    "consumed_ml": 1200,
    "remaining_ml": 1940,
    "percent_completed": 38.2,
    "status": "behind_schedule",
    "logs": [
      {
        "id": "wlog_001",
        "amount_ml": 500,
        "logged_at": "2026-06-13T08:00:00Z",
        "source": "manual"
      },
      {
        "id": "wlog_002",
        "amount_ml": 400,
        "logged_at": "2026-06-13T09:30:00Z",
        "source": "manual"
      },
      {
        "id": "wlog_003",
        "amount_ml": 300,
        "logged_at": "2026-06-13T10:00:00Z",
        "source": "manual"
      }
    ],
    "target_breakdown": {
      "base_ml": 2748,
      "activity_adjustment_ml": 392,
      "steps_adjustment_ml": 0,
      "weather_adjustment_ml": 0,
      "based_on_weight_kg": 78.5
    },
    "alerts": [
      {
        "type": "behind_schedule",
        "message": "Son las 10:30. Llevas solo el 38%. Intenta tomar 500ml ahora.",
        "severity": "warning"
      }
    ],
    "pace_needed": {
      "ml_per_hour": 286,
      "hours_remaining": 14.5
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/hydration/logs`

Registra consumo de agua.

**Request:**

```json
{
  "amount_ml": 500,
  "logged_at": "2026-06-13T10:30:00Z",
  "source": "manual",
  "container_label": "Botella grande"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "log": {
      "id": "wlog_004",
      "amount_ml": 500,
      "logged_at": "2026-06-13T10:30:00Z",
      "source": "manual"
    },
    "daily_total_ml": 1700,
    "target_ml": 3140,
    "percent_completed": 54.1,
    "remaining_ml": 1440,
    "status": "on_track",
    "encouragement": "¡Bien! Ya llevas más de la mitad. Continúa así. 💧"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### DELETE `/hydration/logs/:log_id`

Elimina un registro de agua.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "daily_total_ml": 1200,
    "percent_completed": 38.2
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/hydration/history`

Historial de hidratación por día.

**Query params:** `from`, `to`, `limit`

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "date": "2026-06-12",
        "target_ml": 3140,
        "consumed_ml": 3200,
        "percent": 101.9,
        "goal_met": true
      },
      {
        "date": "2026-06-11",
        "target_ml": 3140,
        "consumed_ml": 2800,
        "percent": 89.2,
        "goal_met": false
      }
    ],
    "summary": {
      "days_goal_met": 18,
      "days_total": 30,
      "goal_met_rate_percent": 60.0,
      "avg_daily_ml": 2950,
      "best_streak_days": 5,
      "current_streak_days": 2
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PATCH `/hydration/target`

Ajusta manualmente el objetivo de hidratación.

**Request:**

```json
{
  "target_ml": 3500,
  "override_reason": "Clima muy caluroso"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "previous_target_ml": 3140,
    "new_target_ml": 3500,
    "override_active": true,
    "message": "Objetivo actualizado a 3.5L para hoy."
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 8. DASHBOARD

Base path: `/dashboard`

🔒 **Requiere autenticación**

El Dashboard es el endpoint más crítico para la experiencia del usuario. Devuelve todos los datos necesarios para la pantalla principal en una sola llamada, minimizando round trips.

-----

### GET `/dashboard/summary`

Resumen completo del día actual. Diseñado para ser el primer llamado al abrir la app.

**Query params:**

|Param     |Tipo  |Descripción                       |
|----------|------|----------------------------------|
|`date`    |date  |Default: hoy                      |
|`timezone`|string|Default: UTC. Ej: `America/Bogota`|

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "date": "2026-06-13",
    "user": {
      "first_name": "Carlos",
      "avatar_url": "https://cdn.calinutri.app/users/3f25.../avatar.jpg",
      "greeting": "Buenos días, Carlos 🌅"
    },
    "training": {
      "has_workout_today": true,
      "workout_completed": false,
      "workout": {
        "id": "day_01A",
        "name": "Upper A",
        "exercises_count": 6,
        "estimated_minutes": 45
      },
      "streak_days": 6,
      "weekly_sessions_completed": 2,
      "weekly_sessions_target": 4
    },
    "nutrition": {
      "calories": {
        "consumed": 606,
        "target": 2850,
        "remaining": 2244,
        "percent": 21.3
      },
      "protein": {
        "consumed_g": 36.4,
        "target_g": 157,
        "remaining_g": 120.6,
        "percent": 23.2
      },
      "fat": {
        "consumed_g": 27.2,
        "target_g": 78,
        "percent": 34.9
      },
      "carbs": {
        "consumed_g": 56.6,
        "target_g": 356,
        "percent": 15.9
      },
      "meals_logged": 1,
      "last_meal_at": "2026-06-13T07:31:00Z"
    },
    "hydration": {
      "consumed_ml": 1200,
      "target_ml": 3140,
      "remaining_ml": 1940,
      "percent": 38.2,
      "status": "behind_schedule"
    },
    "body": {
      "last_weight_kg": 78.5,
      "last_measured_at": "2026-06-10",
      "days_since_last_measurement": 3,
      "prompt_measurement": true
    },
    "health_sync": {
      "steps_today": 4230,
      "steps_goal": 10000,
      "active_calories": 320,
      "last_synced_at": "2026-06-13T10:28:00Z"
    },
    "ai_coach": {
      "unread_messages": 0,
      "daily_insight": "Hoy toca Upper A. Llevas 6 días seguidos entrenando — excelente racha. Asegúrate de llegar al 65% del agua antes del almuerzo. 💧"
    },
    "notifications_unread": 2,
    "overall_status": "good"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/dashboard/weekly`

Resumen semanal de rendimiento para las gráficas del dashboard.

**Query params:** `week` (formato `2026-W24`, default: semana actual)

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "week": "2026-W24",
    "from": "2026-06-09",
    "to": "2026-06-15",
    "training": {
      "sessions_completed": 2,
      "sessions_target": 4,
      "total_reps": 208,
      "total_minutes": 110,
      "completion_rate": 0.50,
      "by_day": [
        { "date": "2026-06-09", "trained": true, "workout": "Upper A", "duration_min": 52 },
        { "date": "2026-06-10", "trained": true, "workout": "Lower A", "duration_min": 58 },
        { "date": "2026-06-11", "trained": false, "workout": null, "duration_min": 0 },
        { "date": "2026-06-12", "trained": false, "workout": null, "duration_min": 0 },
        { "date": "2026-06-13", "trained": false, "workout": "Upper B", "duration_min": 0 }
      ]
    },
    "nutrition": {
      "avg_calories_kcal": 2620,
      "target_calories_kcal": 2850,
      "avg_protein_g": 141.2,
      "target_protein_g": 157,
      "adherence_percent": 87.2,
      "days_logged": 5,
      "by_day": [
        { "date": "2026-06-09", "calories": 2850, "protein_g": 158, "logged": true },
        { "date": "2026-06-10", "calories": 2780, "protein_g": 152, "logged": true }
      ]
    },
    "hydration": {
      "avg_ml": 2910,
      "target_ml": 3140,
      "goal_met_days": 3,
      "by_day": [
        { "date": "2026-06-09", "consumed_ml": 3200, "goal_met": true },
        { "date": "2026-06-10", "consumed_ml": 2900, "goal_met": false }
      ]
    },
    "steps": {
      "avg_daily": 8240,
      "goal": 10000,
      "goal_met_days": 2,
      "total_week": 41200
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/dashboard/goals`

Estado actual de los objetivos definidos por el usuario.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "active_goals": [
      {
        "id": "goal_001",
        "type": "weight",
        "label": "Llegar a 82 kg",
        "start_value": 76.0,
        "current_value": 78.5,
        "target_value": 82.0,
        "progress_percent": 45.5,
        "start_date": "2026-01-15",
        "target_date": "2026-12-31",
        "status": "on_track",
        "estimated_completion": "2026-09-20"
      },
      {
        "id": "goal_002",
        "type": "pull_ups",
        "label": "Llegar a 15 dominadas",
        "start_value": 5,
        "current_value": 8,
        "target_value": 15,
        "progress_percent": 30.0,
        "start_date": "2026-01-15",
        "target_date": "2026-12-31",
        "status": "on_track"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 9. HEALTH INTEGRATION

Base path: `/health`

🔒 **Requiere autenticación**

Gestiona la sincronización bidireccional con Apple Health (HealthKit) y Google Health Connect.

-----

### POST `/health/sync`

Recibe datos sincronizados desde Apple Health o Google Health Connect. El cliente envía los datos periódicamente (cada 15 min en foreground, en background cada vez que iOS/Android lo permitan).

**Request:**

```json
{
  "platform": "healthkit",
  "sync_date": "2026-06-13",
  "data": {
    "steps": {
      "count": 4230,
      "source": "iPhone",
      "start_time": "2026-06-13T00:00:00Z",
      "end_time": "2026-06-13T10:28:00Z"
    },
    "active_calories": {
      "kcal": 320,
      "source": "Apple Watch"
    },
    "resting_heart_rate": {
      "bpm": 58,
      "measured_at": "2026-06-13T07:00:00Z"
    },
    "sleep": {
      "in_bed_at": "2026-06-12T23:30:00Z",
      "asleep_at": "2026-06-12T23:50:00Z",
      "wake_at": "2026-06-13T07:15:00Z",
      "duration_hours": 7.42,
      "deep_sleep_minutes": 82,
      "rem_sleep_minutes": 95,
      "quality_score": 78
    },
    "weight": {
      "kg": 78.5,
      "measured_at": "2026-06-13T07:05:00Z",
      "source": "Apple Health"
    },
    "workouts": []
  }
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "synced": {
      "steps": true,
      "active_calories": true,
      "sleep": true,
      "weight": true,
      "heart_rate": true
    },
    "actions_taken": [
      {
        "type": "weight_measurement_created",
        "detail": "Peso de 78.5 kg registrado desde Apple Health"
      },
      {
        "type": "sleep_recovery_updated",
        "detail": "Sueño de 7.4h registrado. Sin ajuste de volumen de entrenamiento necesario."
      },
      {
        "type": "hydration_adjustment",
        "detail": "Objetivo de hidratación ajustado +392 ml por pasos y entrenamiento."
      }
    ],
    "next_sync_recommended_at": "2026-06-13T11:00:00Z"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/health/data`

Obtiene el historial de datos de salud sincronizados.

**Query params:** `from`, `to`, `types` (array: `steps,sleep,heart_rate,weight,calories`)

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "from": "2026-06-07",
    "to": "2026-06-13",
    "health_data": [
      {
        "date": "2026-06-13",
        "steps": 4230,
        "active_calories": 320,
        "resting_heart_rate_bpm": 58,
        "weight_kg": 78.5,
        "sleep": {
          "duration_hours": 7.42,
          "quality_score": 78
        },
        "source_platform": "healthkit",
        "synced_at": "2026-06-13T10:28:00Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/health/permissions`

Obtiene el estado de los permisos de salud configurados por el usuario.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "platform": "healthkit",
    "permissions": {
      "steps": { "read": true, "write": false },
      "weight": { "read": true, "write": true },
      "sleep": { "read": true, "write": false },
      "active_calories": { "read": true, "write": false },
      "heart_rate": { "read": true, "write": false },
      "workouts": { "read": false, "write": true }
    },
    "sync_enabled": true,
    "last_sync_at": "2026-06-13T10:28:00Z",
    "sync_frequency": "every_15_minutes"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PATCH `/health/permissions`

Actualiza la configuración de sincronización de salud.

**Request:**

```json
{
  "sync_enabled": true,
  "permissions": {
    "workouts": { "write": true }
  },
  "sync_frequency": "every_15_minutes"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "permissions_updated": ["workouts.write"],
    "message": "Configuración de salud actualizada. Los entrenamientos completados se exportarán automáticamente a Apple Health."
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/health/export`

Exporta datos de CALI-NUTRI AI hacia Apple Health / Google Health Connect (entrenamientos, peso).

**Request:**

```json
{
  "platform": "healthkit",
  "data_types": ["workouts", "weight"],
  "from_date": "2026-06-01"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "exported": {
      "workouts_count": 8,
      "weight_readings_count": 10
    },
    "message": "8 entrenamientos y 10 lecturas de peso exportados a Apple Health exitosamente."
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 10. IA CONVERSACIONAL

Base path: `/ai`

🔒 **Requiere autenticación**

El módulo de IA gestiona las conversaciones con CALI, el asistente de IA de CALI-NUTRI AI (powered by Claude). Las respuestas se envían via WebSocket para tiempo real; los endpoints REST permiten gestión de conversaciones e historial.

**WebSocket URL:** `wss://api.calinutri.app/v1/ai/ws?token=<access_token>`

-----

### GET `/ai/conversations`

Lista las conversaciones del usuario.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_01HWXYZ",
        "title": "Rutina y nutrición — 13 Jun",
        "preview": "¡Excelente! 8 dominadas es tu nuevo máximo...",
        "messages_count": 24,
        "last_message_at": "2026-06-13T09:45:00Z",
        "created_at": "2026-06-13T08:00:00Z"
      }
    ]
  },
  "pagination": {
    "total_count": 15,
    "has_next": false
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/ai/conversations`

Crea una nueva conversación con CALI.

**Request:**

```json
{
  "initial_context": "training"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conv_01HWXYZ",
      "title": "Nueva conversación",
      "created_at": "2026-06-13T10:30:00Z"
    },
    "welcome_message": {
      "id": "msg_001",
      "role": "assistant",
      "content": "¡Hola, Carlos! 👋 Soy CALI. Hoy tienes Upper A programado — 6 ejercicios, aproximadamente 45 minutos. ¿Ya entrenaste o necesitas orientación para la sesión de hoy?",
      "created_at": "2026-06-13T10:30:01Z"
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/ai/conversations/:conversation_id/messages`

Envía un mensaje a CALI. **La respuesta es asíncrona via WebSocket.** Este endpoint confirma recepción y devuelve `202 Accepted`. La respuesta real llega por WebSocket con `type: "ai_response"`.

**Request:**

```json
{
  "content": "Hice 8 dominadas hoy. ¿Cómo me fue?",
  "attachments": []
}
```

**Response `202 Accepted`:**

```json
{
  "success": true,
  "data": {
    "message_id": "msg_user_002",
    "conversation_id": "conv_01HWXYZ",
    "status": "processing",
    "message": "Tu mensaje está siendo procesado. La respuesta llegará en segundos."
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

**WebSocket payload de respuesta (llega ~1.5s después):**

```json
{
  "type": "ai_response",
  "conversation_id": "conv_01HWXYZ",
  "message": {
    "id": "msg_cali_003",
    "role": "assistant",
    "content": "¡Impresionante, Carlos! 🎯 8 dominadas es tu **nuevo máximo personal** — subiste desde 5. \n\nEso representa un incremento del **60%** desde que empezamos. \n\nYa registré el rendimiento. Si mantienes este nivel las próximas 2 semanas, pasaremos de **4×3 a 4×4** automáticamente. \n\n¿Cómo sentiste el RPE en las últimas series?",
    "created_at": "2026-06-13T10:30:02Z"
  },
  "tool_calls_executed": [
    {
      "tool": "log_workout_performance",
      "params": { "exercise": "pull_ups", "reps": 8, "rpe": 8 },
      "result": "success",
      "side_effects": ["personal_record_updated", "progression_check_triggered"]
    }
  ],
  "data_updated": {
    "workout_log": true,
    "personal_records": true,
    "daily_summary": true
  }
}
```

-----

### GET `/ai/conversations/:conversation_id/messages`

Historial de mensajes de una conversación con paginación.

**Query params:** `limit` (default 20), `cursor`

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_01HWXYZ",
    "messages": [
      {
        "id": "msg_001",
        "role": "assistant",
        "content": "¡Hola, Carlos! 👋 Soy CALI...",
        "tool_calls": [],
        "created_at": "2026-06-13T10:30:01Z"
      },
      {
        "id": "msg_user_002",
        "role": "user",
        "content": "Hice 8 dominadas hoy. ¿Cómo me fue?",
        "created_at": "2026-06-13T10:30:02Z"
      },
      {
        "id": "msg_cali_003",
        "role": "assistant",
        "content": "¡Impresionante, Carlos! 🎯 8 dominadas es tu nuevo máximo personal...",
        "tool_calls": ["log_workout_performance"],
        "created_at": "2026-06-13T10:30:03Z"
      }
    ]
  },
  "pagination": {
    "has_next": false,
    "total_count": 3
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### DELETE `/ai/conversations/:conversation_id`

Elimina una conversación y todos sus mensajes.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "message": "Conversación eliminada"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/ai/usage`

Uso de mensajes de IA del usuario (para mostrar límites en plan gratuito).

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "plan": "free",
    "daily_limit": 50,
    "messages_used_today": 8,
    "messages_remaining_today": 42,
    "resets_at": "2026-06-14T00:00:00Z",
    "upgrade_cta": null
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/ai/quick-actions`

Acciones rápidas predefinidas sin conversación. Para botones de UI como “¿Qué como ahora?” o “Ajusta mi rutina de hoy”.

**Request:**

```json
{
  "action": "suggest_next_meal",
  "context": {
    "remaining_protein_g": 120,
    "remaining_calories": 2244,
    "time_of_day": "13:00",
    "available_foods": ["chicken", "eggs", "rice", "banana"]
  }
}
```

**Acciones disponibles:**

- `suggest_next_meal` — Sugiere qué comer basado en macros restantes
- `workout_motivation` — Mensaje motivacional previo al entrenamiento
- `daily_tip` — Tip personalizado del día
- `adjust_today_workout` — Ajuste de entrenamiento por recuperación
- `hydration_reminder` — Recordatorio de agua con contexto

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "action": "suggest_next_meal",
    "response": "Con 120g de proteína pendientes y las 13:00, te sugiero: **200g pechuga de pollo + 200g arroz cocido + 1 aguacate**. Eso te da ~68g de proteína y ~750 kcal. Perfecto para el almuerzo post-entrenamiento. 🍗",
    "suggested_foods": [
      { "name": "Pechuga de pollo", "quantity_g": 200, "protein_g": 62 },
      { "name": "Arroz cocido", "quantity_g": 200, "protein_g": 4.8 }
    ],
    "quick_log_available": true
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 11. NOTIFICACIONES

Base path: `/notifications`

🔒 **Requiere autenticación**

-----

### GET `/notifications`

Lista las notificaciones del usuario con estado de lectura.

**Query params:** `status` (`unread`, `read`, `all`), `limit`, `cursor`

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_001",
        "type": "hydration_reminder",
        "title": "¡Tiempo de hidratarse! 💧",
        "body": "Son las 12:00 y llevas solo el 25% de tu agua. Toma 500ml ahora.",
        "data": {
          "current_ml": 785,
          "target_ml": 3140,
          "percent": 25.0,
          "deep_link": "calinutri://hydration"
        },
        "read": false,
        "sent_at": "2026-06-13T12:00:00Z",
        "read_at": null
      },
      {
        "id": "notif_002",
        "type": "workout_reminder",
        "title": "🏋️ Tu entrenamiento de hoy te espera",
        "body": "Upper A — 45 min — ¡Tienes 6 racha! No la rompas.",
        "data": {
          "workout_day_id": "day_01A",
          "streak_days": 6,
          "deep_link": "calinutri://training/today"
        },
        "read": true,
        "sent_at": "2026-06-13T08:00:00Z",
        "read_at": "2026-06-13T08:05:00Z"
      }
    ],
    "unread_count": 1
  },
  "pagination": {
    "has_next": false,
    "total_count": 12
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PATCH `/notifications/:notification_id/read`

Marca una notificación como leída.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "notification_id": "notif_001",
    "read": true,
    "read_at": "2026-06-13T10:30:00Z"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PATCH `/notifications/read-all`

Marca todas las notificaciones como leídas.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "marked_read_count": 5
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/notifications/device-token`

Registra o actualiza el token de push notifications del dispositivo (APNs en iOS, FCM en Android).

**Request:**

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "device_id": "iphone-uuid-12345",
  "app_version": "1.0.0"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "token_registered": true,
    "platform": "ios",
    "device_id": "iphone-uuid-12345"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### DELETE `/notifications/device-token`

Elimina el token de push del dispositivo al cerrar sesión.

**Request:**

```json
{
  "device_id": "iphone-uuid-12345"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "token_removed": true
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/notifications/preferences`

Obtiene las preferencias de notificaciones del usuario.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "preferences": {
      "hydration_reminders": {
        "enabled": true,
        "times": ["12:00", "18:00", "20:00"],
        "threshold_percent": [30, 60, 80]
      },
      "workout_reminders": {
        "enabled": true,
        "time": "08:00",
        "days": ["monday", "tuesday", "thursday", "friday"]
      },
      "nutrition_reminders": {
        "enabled": true,
        "meal_times": ["07:30", "13:00", "20:00"]
      },
      "progress_insights": {
        "enabled": true,
        "frequency": "weekly",
        "day_of_week": "sunday"
      },
      "ai_proactive_tips": {
        "enabled": true,
        "max_per_day": 2
      },
      "quiet_hours": {
        "enabled": true,
        "from": "22:00",
        "to": "07:00"
      }
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### PATCH `/notifications/preferences`

Actualiza las preferencias de notificaciones.

**Request:**

```json
{
  "hydration_reminders": {
    "enabled": true,
    "times": ["11:00", "15:00", "19:00"]
  },
  "quiet_hours": {
    "enabled": true,
    "from": "23:00",
    "to": "07:30"
  }
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "updated_preferences": ["hydration_reminders.times", "quiet_hours"],
    "next_hydration_reminder": "2026-06-13T11:00:00Z"
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 12. ANALÍTICA

Base path: `/analytics`

🔒 **Requiere autenticación**

-----

### GET `/analytics/progress-report`

Reporte de progreso completo para un período. Usado para el resumen semanal/mensual.

**Query params:** `period` (`weekly`, `monthly`), `from`, `to`

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "report_type": "weekly",
    "period": { "from": "2026-06-07", "to": "2026-06-13" },
    "training": {
      "sessions_completed": 3,
      "sessions_target": 4,
      "consistency_percent": 75,
      "total_volume_reps": 312,
      "top_performances": [
        { "exercise": "Dominadas", "best_reps": 8, "improvement": "+3 desde inicio" }
      ],
      "weekly_trend": "improving"
    },
    "nutrition": {
      "avg_daily_calories": 2720,
      "target_calories": 2850,
      "avg_protein_g": 145,
      "target_protein_g": 157,
      "adherence_percent": 87.2,
      "best_day": "2026-06-09",
      "needs_improvement": "proteína en cenas"
    },
    "hydration": {
      "goal_met_days": 4,
      "avg_daily_ml": 2980,
      "target_ml": 3140
    },
    "body": {
      "weight_start_period": 78.2,
      "weight_end_period": 78.5,
      "change_kg": 0.3,
      "trend": "gaining_controlled"
    },
    "ai_summary": "Buena semana, Carlos. Tu entrenamiento fue consistente y tu proteína diaria mejoró frente a la semana anterior. La hidratación sigue siendo el área con mayor oportunidad — intenta llevar tu botella desde por la mañana.",
    "achievements_unlocked": [
      { "name": "Racha de 6 días", "icon": "🔥", "unlocked_at": "2026-06-13" }
    ]
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### GET `/analytics/trends`

Tendencias de métricas clave en el tiempo.

**Query params:**

|Param        |Tipo  |Descripción                                                                 |
|-------------|------|----------------------------------------------------------------------------|
|`metrics`    |array |`weight`, `pull_ups`, `pushups`, `calories`, `protein`, `hydration`, `steps`|
|`period`     |string|`4w`, `8w`, `12w`, `6m`, `1y`                                               |
|`granularity`|string|`daily`, `weekly`                                                           |

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "period": "12w",
    "granularity": "weekly",
    "trends": {
      "weight": {
        "data": [
          { "week": "2026-W14", "value": 76.0 },
          { "week": "2026-W15", "value": 76.3 },
          { "week": "2026-W24", "value": 78.5 }
        ],
        "change": { "absolute": 2.5, "percent": 3.3, "trend": "gaining" }
      },
      "pull_ups": {
        "data": [
          { "week": "2026-W14", "value": 5 },
          { "week": "2026-W16", "value": 6 },
          { "week": "2026-W24", "value": 8 }
        ],
        "change": { "absolute": 3, "percent": 60, "trend": "improving" }
      },
      "protein": {
        "data": [
          { "week": "2026-W14", "value": 120 },
          { "week": "2026-W24", "value": 145 }
        ],
        "change": { "absolute": 25, "percent": 20.8, "trend": "improving" }
      }
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 13. ADMINISTRACIÓN

Base path: `/admin`

🔒 **Requiere autenticación + Rol `admin`**

Endpoints internos para gestión del sistema. No expuestos en la app mobile.

-----

### GET `/admin/metrics`

Métricas globales del sistema.

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 4280,
      "active_today": 892,
      "active_last_7_days": 3120,
      "new_last_30_days": 680,
      "premium": 312
    },
    "engagement": {
      "avg_sessions_per_user_week": 3.2,
      "avg_nutrition_logs_per_day": 2.8,
      "avg_hydration_logs_per_day": 3.1,
      "ai_messages_today": 12480
    },
    "system": {
      "api_p50_ms": 85,
      "api_p99_ms": 380,
      "ai_p50_ms": 1450,
      "ai_p99_ms": 4800,
      "error_rate_percent": 0.12
    }
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

### POST `/admin/notifications/broadcast`

Envía una notificación push a un segmento de usuarios.

**Request:**

```json
{
  "title": "Nueva funcionalidad disponible 🎉",
  "body": "Ahora puedes analizar tus comidas con una foto. ¡Pruébalo!",
  "segment": "all_active_users",
  "deep_link": "calinutri://nutrition/diary",
  "scheduled_at": null
}
```

**Response `202 Accepted`:**

```json
{
  "success": true,
  "data": {
    "broadcast_id": "bc_01HWXYZ",
    "estimated_recipients": 3120,
    "status": "queued",
    "scheduled_at": null
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 14. CÓDIGOS DE ERROR

### HTTP Status Codes

|Status                     |Uso                                  |
|---------------------------|-------------------------------------|
|`200 OK`                   |Operación exitosa                    |
|`201 Created`              |Recurso creado                       |
|`202 Accepted`             |Operación asíncrona aceptada         |
|`400 Bad Request`          |Request inválido o validación fallida|
|`401 Unauthorized`         |Token ausente, inválido o expirado   |
|`403 Forbidden`            |Autenticado pero sin permisos        |
|`404 Not Found`            |Recurso no encontrado                |
|`409 Conflict`             |Conflicto (ej: email duplicado)      |
|`422 Unprocessable Entity` |Lógica de negocio fallida            |
|`429 Too Many Requests`    |Rate limit excedido                  |
|`500 Internal Server Error`|Error del servidor                   |
|`503 Service Unavailable`  |Servicio temporalmente no disponible |

### Códigos de Error de Aplicación

|Código                  |Status HTTP|Descripción                               |
|------------------------|-----------|------------------------------------------|
|`VALIDATION_ERROR`      |400        |Campos inválidos o faltantes              |
|`INVALID_CREDENTIALS`   |401        |Email o contraseña incorrectos            |
|`TOKEN_EXPIRED`         |401        |Access Token expirado                     |
|`TOKEN_INVALID`         |401        |Token malformado                          |
|`INVALID_REFRESH_TOKEN` |401        |Refresh Token inválido o expirado         |
|`TOKEN_FAMILY_REVOKED`  |401        |Sesión invalidada por seguridad           |
|`FORBIDDEN`             |403        |Sin permisos para este recurso            |
|`NOT_FOUND`             |404        |Recurso no encontrado                     |
|`EMAIL_ALREADY_EXISTS`  |409        |Email ya registrado                       |
|`WEAK_PASSWORD`         |400        |Contraseña no cumple requisitos           |
|`ONBOARDING_REQUIRED`   |422        |Onboarding no completado                  |
|`ACTIVE_SESSION_EXISTS` |409        |Ya existe una sesión activa               |
|`PLAN_LIMIT_REACHED`    |422        |Límite del plan gratuito alcanzado        |
|`AI_RATE_LIMIT`         |429        |Límite de mensajes de IA del día          |
|`HEALTH_SYNC_ERROR`     |422        |Error al sincronizar con Health           |
|`FOOD_NOT_FOUND`        |404        |Alimento no encontrado en DB              |
|`BARCODE_NOT_FOUND`     |404        |Código de barras no en base de datos      |
|`AI_SERVICE_UNAVAILABLE`|503        |Servicio de IA temporalmente no disponible|
|`RATE_LIMIT_EXCEEDED`   |429        |Demasiadas requests por IP/usuario        |
|`INTERNAL_ERROR`        |500        |Error interno del servidor                |

### Ejemplo de Error con Múltiples Validaciones

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La solicitud contiene errores de validación",
    "details": [
      {
        "field": "weight_kg",
        "message": "weight_kg must be a positive number",
        "received": -5
      },
      {
        "field": "goal",
        "message": "goal must be one of: muscle_gain, fat_loss, recomposition, maintenance",
        "received": "bulking"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 15. RATE LIMITING

### Límites por Endpoint

|Grupo          |Ventana |Límite                                       |Aplica a                                             |
|---------------|--------|---------------------------------------------|-----------------------------------------------------|
|Auth general   |15 min  |20 req/IP                                    |`/auth/*`                                            |
|Login          |15 min  |5 intentos/IP                                |`POST /auth/login`                                   |
|Register       |1 hora  |3 registros/IP                               |`POST /auth/register`                                |
|API general    |1 min   |100 req/usuario                              |Todos los endpoints autenticados                     |
|AI mensajes    |24 horas|50 mensajes (plan free) / ilimitado (premium)|`POST /ai/conversations/*/messages`                  |
|Health sync    |1 min   |10 req/usuario                               |`POST /health/sync`                                  |
|Upload de fotos|1 hora  |20 uploads/usuario                           |`PUT /users/me/avatar`, `POST /nutrition/diary/photo`|

### Headers de Rate Limit

Todas las respuestas incluyen:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1749813060
X-RateLimit-Window: 60
```

### Response cuando se excede el límite — `429 Too Many Requests`

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Has excedido el límite de requests. Intenta nuevamente en 45 segundos.",
    "retry_after_seconds": 45
  },
  "meta": {
    "timestamp": "2026-06-13T10:30:00Z",
    "request_id": "req_01HWXYZ123456789"
  }
}
```

-----

## 16. WEBHOOKS

CALI-NUTRI AI emite webhooks internos para comunicación entre módulos y eventos de sistema. En V2, estarán disponibles para integraciones de terceros (wearables, apps de partners).

### Eventos Disponibles

|Evento                             |Descripción                       |Trigger                              |
|-----------------------------------|----------------------------------|-------------------------------------|
|`user.created`                     |Usuario registrado                |POST /auth/register                  |
|`onboarding.completed`             |Onboarding finalizado             |POST /assessment/initial             |
|`workout.session.completed`        |Sesión completada                 |PATCH /training/sessions/:id/complete|
|`workout.progression.triggered`    |Progresión automática aplicada    |Training Engine (background)         |
|`workout.deload.started`           |Semana de descarga iniciada       |Training Engine (background)         |
|`workout.plateau.detected`         |Estancamiento detectado           |Training Engine (background)         |
|`nutrition.auto_adjustment.applied`|Calorías ajustadas automáticamente|Nutrition Engine (background)        |
|`hydration.goal.completed`         |Objetivo de agua cumplido         |POST /hydration/logs                 |
|`body.measurement.created`         |Nueva medición corporal           |POST /users/me/body-measurements     |
|`achievement.unlocked`             |Logro desbloqueado                |Varios módulos                       |
|`health.sync.completed`            |Sincronización de salud exitosa   |POST /health/sync                    |
|`ai.conversation.tool_call`        |IA ejecutó una acción             |POST /ai/conversations/:id/messages  |

### Estructura del Payload

```json
{
  "event": "workout.progression.triggered",
  "version": "1.0",
  "occurred_at": "2026-06-13T10:55:00Z",
  "data": {
    "user_id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    "exercise_id": "ex_pull_ups",
    "exercise_name": "Dominadas",
    "change": {
      "from": { "sets": 4, "reps": 3 },
      "to": { "sets": 4, "reps": 4 }
    },
    "reason": "2_consecutive_weeks_completed"
  },
  "signature": "sha256=abc123...",
  "delivery_id": "del_01HWXYZ"
}
```

-----

## APÉNDICE A — Resumen de Endpoints

### Auth

|Método|Endpoint               |Descripción                |Auth|
|------|-----------------------|---------------------------|----|
|POST  |`/auth/register`       |Registro de usuario        |No  |
|POST  |`/auth/login`          |Inicio de sesión           |No  |
|POST  |`/auth/refresh`        |Renovar tokens             |No  |
|POST  |`/auth/logout`         |Cerrar sesión              |Sí  |
|POST  |`/auth/forgot-password`|Solicitar recuperación     |No  |
|POST  |`/auth/reset-password` |Establecer nueva contraseña|No  |
|POST  |`/auth/oauth/:provider`|Login social               |No  |
|GET   |`/auth/me`             |Usuario actual             |Sí  |

### Usuarios

|Método|Endpoint                     |Descripción            |
|------|-----------------------------|-----------------------|
|GET   |`/users/me/profile`          |Perfil completo        |
|PATCH |`/users/me/profile`          |Actualizar perfil      |
|PUT   |`/users/me/avatar`           |Foto de perfil         |
|POST  |`/users/me/body-measurements`|Nueva medición         |
|GET   |`/users/me/body-measurements`|Historial de mediciones|
|PATCH |`/users/me/change-password`  |Cambiar contraseña     |
|DELETE|`/users/me`                  |Eliminar cuenta        |
|GET   |`/users/me/export`           |Exportar datos (GDPR)  |

### Evaluación

|Método|Endpoint             |Descripción        |
|------|---------------------|-------------------|
|POST  |`/assessment/initial`|Onboarding completo|
|POST  |`/assessment/retest` |Reevaluar máximos  |

### Entrenamientos

|Método|Endpoint                               |Descripción             |
|------|---------------------------------------|------------------------|
|GET   |`/training/programs/active`            |Programa activo completo|
|GET   |`/training/today`                      |Entrenamiento de hoy    |
|POST  |`/training/sessions`                   |Iniciar sesión          |
|POST  |`/training/sessions/:id/logs`          |Registrar serie         |
|PATCH |`/training/sessions/:id/complete`      |Finalizar sesión        |
|DELETE|`/training/sessions/:id`               |Cancelar sesión         |
|GET   |`/training/sessions`                   |Historial de sesiones   |
|GET   |`/training/sessions/:id`               |Detalle de sesión       |
|GET   |`/training/exercises`                  |Catálogo de ejercicios  |
|GET   |`/training/progress`                   |Gráficas de progreso    |
|GET   |`/training/programs/active/adjustments`|Ajustes del programa    |

### Nutrición

|Método|Endpoint                           |Descripción            |
|------|-----------------------------------|-----------------------|
|GET   |`/nutrition/targets`               |Objetivos nutricionales|
|GET   |`/nutrition/diary/today`           |Diario de hoy          |
|GET   |`/nutrition/diary`                 |Historial del diario   |
|POST  |`/nutrition/diary`                 |Registrar alimento     |
|POST  |`/nutrition/diary/photo`           |Registrar por foto     |
|PATCH |`/nutrition/diary/:id`             |Editar entrada         |
|DELETE|`/nutrition/diary/:id`             |Eliminar entrada       |
|GET   |`/nutrition/foods/search`          |Buscar alimentos       |
|GET   |`/nutrition/foods/barcode/:barcode`|Buscar por código      |
|GET   |`/nutrition/meal-plan/today`       |Plan de comidas        |
|GET   |`/nutrition/adherence`             |Adherencia nutricional |

### Hidratación

|Método|Endpoint             |Descripción      |
|------|---------------------|-----------------|
|GET   |`/hydration/today`   |Estado de hoy    |
|POST  |`/hydration/logs`    |Registrar agua   |
|DELETE|`/hydration/logs/:id`|Eliminar registro|
|GET   |`/hydration/history` |Historial        |
|PATCH |`/hydration/target`  |Ajustar objetivo |

### Dashboard

|Método|Endpoint            |Descripción        |
|------|--------------------|-------------------|
|GET   |`/dashboard/summary`|Resumen del día    |
|GET   |`/dashboard/weekly` |Resumen semanal    |
|GET   |`/dashboard/goals`  |Estado de objetivos|

### Health Integration

|Método|Endpoint             |Descripción                |
|------|---------------------|---------------------------|
|POST  |`/health/sync`       |Sincronizar datos de salud |
|GET   |`/health/data`       |Historial de datos de salud|
|GET   |`/health/permissions`|Estado de permisos         |
|PATCH |`/health/permissions`|Actualizar permisos        |
|POST  |`/health/export`     |Exportar a Health          |

### IA

|Método|Endpoint                        |Descripción                             |
|------|--------------------------------|----------------------------------------|
|GET   |`/ai/conversations`             |Lista de conversaciones                 |
|POST  |`/ai/conversations`             |Nueva conversación                      |
|POST  |`/ai/conversations/:id/messages`|Enviar mensaje                          |
|GET   |`/ai/conversations/:id/messages`|Historial mensajes                      |
|DELETE|`/ai/conversations/:id`         |Eliminar conversación                   |
|GET   |`/ai/usage`                     |Uso de mensajes de IA                   |
|POST  |`/ai/quick-actions`             |Acciones rápidas                        |
|WSS   |`/ai/ws`                        |WebSocket para respuestas en tiempo real|

### Notificaciones

|Método|Endpoint                     |Descripción            |
|------|-----------------------------|-----------------------|
|GET   |`/notifications`             |Lista de notificaciones|
|PATCH |`/notifications/:id/read`    |Marcar como leída      |
|PATCH |`/notifications/read-all`    |Marcar todas leídas    |
|POST  |`/notifications/device-token`|Registrar token push   |
|DELETE|`/notifications/device-token`|Eliminar token push    |
|GET   |`/notifications/preferences` |Preferencias           |
|PATCH |`/notifications/preferences` |Actualizar preferencias|

### Analítica

|Método|Endpoint                    |Descripción           |
|------|----------------------------|----------------------|
|GET   |`/analytics/progress-report`|Reporte de progreso   |
|GET   |`/analytics/trends`         |Tendencias de métricas|

-----

## APÉNDICE B — Modelo de Datos de Referencia

### Tipos Enumerados

```typescript
// Objetivos de entrenamiento
type Goal = 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance' | 'performance';

// Nivel de experiencia
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

// Tipos de comida
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Métodos de registro de alimentos
type LogMethod = 'manual' | 'barcode' | 'ai_text' | 'ai_photo' | 'health_sync';

// Categorías de ejercicio
type ExerciseCategory = 'push' | 'pull' | 'legs' | 'core';

// Estado de la sesión
type SessionStatus = 'in_progress' | 'completed' | 'cancelled';

// Estado del programa
type ProgramStatus = 'active' | 'completed' | 'paused' | 'cancelled';

// Estado de progresión
type ProgressionStatus = 'on_track' | 'progressing' | 'plateau' | 'regressing';

// Tipos de split
type SplitType = 'full_body' | 'upper_lower' | 'push_pull_legs' | 'push_pull_legs_x2';

// Plataformas de salud
type HealthPlatform = 'healthkit' | 'health_connect';

// Niveles de suscripción
type SubscriptionPlan = 'free' | 'premium';

// Tipos de notificación
type NotificationType = 
  | 'hydration_reminder'
  | 'workout_reminder'
  | 'nutrition_reminder'
  | 'progression_update'
  | 'plateau_alert'
  | 'deload_reminder'
  | 'achievement'
  | 'weekly_summary'
  | 'ai_tip';
```

-----

## APÉNDICE C — Seguridad

### JWT Payload

```json
{
  "sub": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  "email": "carlos@email.com",
  "role": "user",
  "plan": "free",
  "iat": 1749813060,
  "exp": 1749813960,
  "iss": "cali-nutri-api",
  "aud": "cali-nutri-app",
  "jti": "tok_01HWXYZ123456789"
}
```

### Políticas de Seguridad por Endpoint

|Política           |Implementación                                                               |
|-------------------|-----------------------------------------------------------------------------|
|Rate limiting      |Redis con ventana deslizante por IP y user_id                                |
|Input validation   |Zod schemas en todos los endpoints                                           |
|SQL injection      |Prisma ORM con queries parametrizadas                                        |
|XSS                |Sanitización de text inputs en el backend                                    |
|CORS               |Whitelist de orígenes (app y futuro dashboard)                               |
|Cifrado en tránsito|TLS 1.3 enforced                                                             |
|Cifrado en reposo  |AES-256 en RDS + campos sensibles con AES-256-GCM                            |
|Auditoría          |Log de todas las operaciones en datos sensibles                              |
|GDPR               |Exportación y eliminación de datos en `/users/me/export` y `DELETE /users/me`|

-----

*Documento generado por el equipo técnico de CALI-NUTRI AI. Versión 1.0 — Junio 2026.*  
*Para proponer cambios, abrir un RFC en el repositorio interno antes de modificar este documento.*