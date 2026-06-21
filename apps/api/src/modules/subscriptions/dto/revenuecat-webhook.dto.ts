import { z } from 'zod';

/** Forma mínima del payload de RevenueCat (https://www.revenuecat.com/docs/webhooks). */
export const revenuecatWebhookSchema = z.object({
  event: z.object({
    type: z.string(),
    app_user_id: z.string(),
    product_id: z.string().optional(),
    period_type: z.string().optional(),
    purchased_at_ms: z.number().optional(),
    expiration_at_ms: z.number().nullable().optional(),
  }),
});

export type RevenuecatWebhookDto = z.infer<typeof revenuecatWebhookSchema>;
