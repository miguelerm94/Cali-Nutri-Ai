import { z } from 'zod';

/**
 * v1.0 solo soporta `log_method: manual` (MVP.md §6.3, FD-10). `ai_text` (CALI tool
 * call `log_food`) y `barcode`/`photo` quedan fuera de alcance de NutritionModule:
 * el primero pertenece a AIModule (S5b), los otros están excluidos hasta v2.0 (FD-10).
 */
export const logFoodSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']),
  food_id: z.string().uuid(),
  quantity_g: z.number().positive().max(5000),
  consumed_at: z.string().datetime().optional(),
});

export type LogFoodDto = z.infer<typeof logFoodSchema>;
