import { z } from 'zod';

/**
 * Onboarding completo en una sola llamada — API.md "POST /assessment/initial".
 * Extiende la InitialAssessmentRequestDto narrativa de BackendArchitecture.md §7
 * (que solo ilustraba pull_ups/push_ups/dips) con squats_max y plank_seconds,
 * requeridos por el global_score (FD-01, pesos 40/30/15/15).
 *
 * goal_type usa el enum REAL de schema_v2.md (GoalType): muscle_gain | fat_loss |
 * recomposition | maintenance — NO 'strength' (mencionado en la narrativa de
 * BackendArchitecture.md pero inexistente en el schema canónico).
 */
const movementTestsSchema = z.object({
  pull_ups_max: z.number().int().min(0).max(100),
  push_ups_max: z.number().int().min(0).max(300),
  squats_max: z.number().int().min(0).max(300),
  plank_seconds: z.number().int().min(0).max(1800),
  dips_max: z.number().int().min(0).max(200).optional().default(0),
});

export const initialAssessmentSchema = z.object({
  birth_date: z.string().date(),
  sex: z.enum(['male', 'female']),
  height_cm: z.number().int().min(100).max(250),
  weight_kg: z.number().min(30).max(300),
  target_weight_kg: z.number().min(30).max(300).optional(),
  training_frequency: z.number().int().min(1).max(7),
  unit_preference: z.enum(['metric', 'imperial']).default('metric'),
  movement_tests: movementTestsSchema,
  goal_type: z.enum(['muscle_gain', 'fat_loss', 'recomposition', 'maintenance']),
});

export type InitialAssessmentDto = z.infer<typeof initialAssessmentSchema>;
