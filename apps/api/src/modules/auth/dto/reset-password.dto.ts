import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    reset_token: z.string().min(1),
    new_password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirm_password'],
  });

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
