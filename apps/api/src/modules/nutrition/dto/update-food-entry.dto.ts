import { z } from 'zod';

export const updateFoodEntrySchema = z.object({
  quantity_g: z.number().positive().max(5000).optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']).optional(),
});

export type UpdateFoodEntryDto = z.infer<typeof updateFoodEntrySchema>;
