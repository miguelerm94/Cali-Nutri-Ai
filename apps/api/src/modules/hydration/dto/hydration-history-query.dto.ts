import { z } from 'zod';

export const hydrationHistoryQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(90).default(30),
});

export type HydrationHistoryQueryDto = z.infer<typeof hydrationHistoryQuerySchema>;
