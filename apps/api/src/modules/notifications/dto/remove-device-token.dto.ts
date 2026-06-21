import { z } from 'zod';

export const removeDeviceTokenSchema = z.object({
  deviceId: z.string().min(1),
});

export type RemoveDeviceTokenDto = z.infer<typeof removeDeviceTokenSchema>;
