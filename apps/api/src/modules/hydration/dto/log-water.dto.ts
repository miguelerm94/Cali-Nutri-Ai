import { z } from 'zod';

/** FD-07: opciones de UI rápida 250|500|750|1000 ml + personalizado (cualquier entero positivo). */
export const logWaterSchema = z.object({
  amount_ml: z.number().int().positive().max(5000),
  logged_at: z.string().datetime().optional(),
});

export type LogWaterDto = z.infer<typeof logWaterSchema>;
