import { z } from 'zod';

export const sessionsHistoryQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export type SessionsHistoryQueryDto = z.infer<typeof sessionsHistoryQuerySchema>;

export const exercisesQuerySchema = z.object({
  category: z.enum(['push', 'pull', 'squat', 'hinge', 'core', 'carry']).optional(),
  difficulty: z.coerce.number().int().min(1).max(10).optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ExercisesQueryDto = z.infer<typeof exercisesQuerySchema>;
