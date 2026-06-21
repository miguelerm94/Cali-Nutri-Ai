import { z } from 'zod';

/** Fuente: BackendArchitecture.md §7 "Auth DTOs". */
export const registerSchema = z.object({
  email: z.string().email('Formato de email inválido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula.')
    .regex(/[0-9]/, 'Debe incluir al menos un número.')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un símbolo.'),
  first_name: z.string().min(2).max(100),
  last_name: z.string().max(100).optional(),
  accept_terms: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los términos.' }) }),
  accept_privacy: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la política de privacidad.' }) }),
});

export type RegisterDto = z.infer<typeof registerSchema>;
