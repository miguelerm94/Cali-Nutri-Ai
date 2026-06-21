import { z } from 'zod';

const deviceInfoSchema = z.object({
  device_id: z.string(),
  os: z.string(),
  app_version: z.string(),
});

export const oauthLoginSchema = z.object({
  id_token: z.string().min(1),
  provider: z.enum(['google', 'apple']),
  device_info: deviceInfoSchema,
});

export type OAuthLoginDto = z.infer<typeof oauthLoginSchema>;
