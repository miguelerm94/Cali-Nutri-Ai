import { z } from 'zod';

export const startSessionSchema = z.object({
  workout_day_id: z.string().uuid(),
});

export type StartSessionDto = z.infer<typeof startSessionSchema>;
