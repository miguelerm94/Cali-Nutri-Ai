import type { Tool } from '@anthropic-ai/sdk/resources/messages';

/**
 * Los 6 tools canónicos de FD-ARCH-05 v1.0. Esta lista es la única fuente de
 * verdad — API.md menciona en su ejemplo de quick-actions un tool
 * "log_workout_performance" que NO es canónico y no se implementa.
 */
export const AI_TOOLS: Tool[] = [
  {
    name: 'log_food',
    description:
      'Registra un alimento en el diario nutricional del usuario. Busca el alimento por nombre en la base de datos antes de registrarlo.',
    input_schema: {
      type: 'object',
      properties: {
        food_name: { type: 'string', description: 'Nombre del alimento, ej. "pechuga de pollo"' },
        quantity_g: { type: 'number', description: 'Cantidad en gramos' },
        meal_type: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'],
        },
      },
      required: ['food_name', 'quantity_g', 'meal_type'],
    },
  },
  {
    name: 'log_water',
    description: 'Registra una cantidad de agua consumida en hydration_logs.',
    input_schema: {
      type: 'object',
      properties: {
        amount_ml: { type: 'number', description: 'Cantidad en mililitros' },
      },
      required: ['amount_ml'],
    },
  },
  {
    name: 'log_workout_set',
    description: 'Registra una serie completada en la sesión de entrenamiento activa del usuario.',
    input_schema: {
      type: 'object',
      properties: {
        exercise_name: { type: 'string', description: 'Nombre del ejercicio, ej. "dominadas"' },
        set_number: { type: 'integer' },
        reps_completed: { type: 'integer' },
        rpe: { type: 'integer', description: 'Esfuerzo percibido 1-10', minimum: 1, maximum: 10 },
      },
      required: ['exercise_name', 'set_number', 'reps_completed'],
    },
  },
  {
    name: 'get_daily_summary',
    description: 'Consulta el resumen nutricional e hídrico del día actual del usuario.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'calculate_meal',
    description:
      'Calcula los macros totales de una combinación de alimentos sin registrarlos en el diario.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              food_name: { type: 'string' },
              quantity_g: { type: 'number' },
            },
            required: ['food_name', 'quantity_g'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'complete_workout_session',
    description: 'Marca la sesión de entrenamiento activa del usuario como completada.',
    input_schema: {
      type: 'object',
      properties: {
        subjective_fatigue: { type: 'integer', minimum: 1, maximum: 10 },
      },
    },
  },
];
