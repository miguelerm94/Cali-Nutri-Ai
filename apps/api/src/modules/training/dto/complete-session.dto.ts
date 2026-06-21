import { z } from 'zod';

export const completeSessionSchema = z.object({
  /// FD-02: señal conversacional para CALI — sin efecto automático en v1.0.
  subjective_fatigue: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
});

export type CompleteSessionDto = z.infer<typeof completeSessionSchema>;
