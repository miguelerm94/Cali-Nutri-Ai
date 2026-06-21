import { z } from 'zod';

/** FD-08: campos v1.0 (steps, weight_kg, sleep_minutes). active_calories diferido a v1.1. */
export const syncHealthDataSchema = z.object({
  platform: z.enum(['healthkit', 'health_connect']),
  dataDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dataDate debe ser YYYY-MM-DD'),
  steps: z.number().int().nonnegative().optional(),
  weightKg: z.number().positive().optional(),
  sleepMinutes: z.number().int().nonnegative().optional(),
});

export type SyncHealthDataDto = z.infer<typeof syncHealthDataSchema>;
