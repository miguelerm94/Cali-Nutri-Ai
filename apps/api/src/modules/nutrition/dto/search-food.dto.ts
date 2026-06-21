import { z } from 'zod';

export const searchFoodQuerySchema = z.object({
  q: z.string().min(1, 'q es requerido'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchFoodQueryDto = z.infer<typeof searchFoodQuerySchema>;
