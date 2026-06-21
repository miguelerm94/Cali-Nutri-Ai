import { z } from 'zod';

export const logSetSchema = z.object({
  workout_exercise_id: z.string().uuid(),
  set_number: z.number().int().min(1),
  reps_completed: z.number().int().min(0),
  /// CHECK rpe BETWEEN 1 AND 10 (03_check_constraints.sql)
  rpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
});

export type LogSetDto = z.infer<typeof logSetSchema>;
