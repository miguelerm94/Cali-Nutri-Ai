import { z } from 'zod';

const deviceInfoSchema = z.object({
  device_id: z.string(),
  os: z.string(),
  app_version: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  device_info: deviceInfoSchema.optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
