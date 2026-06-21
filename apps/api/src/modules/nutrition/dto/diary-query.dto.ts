import { z } from 'zod';

/** API.md §`/nutrition/diary`: ventana default de 7 días si no se especifica `from`. */
export const diaryQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type DiaryQueryDto = z.infer<typeof diaryQuerySchema>;
