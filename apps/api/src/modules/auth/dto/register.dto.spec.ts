import { registerSchema } from './register.dto';

describe('registerSchema (API.md §2 — validaciones de registro)', () => {
  const validPayload = {
    email: 'carlos@email.com',
    password: 'Tr4in.Str0ng!',
    first_name: 'Carlos',
    last_name: 'Martínez',
    accept_terms: true,
    accept_privacy: true,
  };

  it('acepta un payload válido', () => {
    expect(registerSchema.safeParse(validPayload).success).toBe(true);
  });

  it('rechaza password sin mayúscula, número o símbolo', () => {
    expect(registerSchema.safeParse({ ...validPayload, password: 'sinmayuscula1!' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validPayload, password: 'SinNumero!' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validPayload, password: 'SinSimbolo1' }).success).toBe(false);
  });

  it('rechaza si accept_terms o accept_privacy no son exactamente true', () => {
    expect(registerSchema.safeParse({ ...validPayload, accept_terms: false }).success).toBe(false);
  });

  it('rechaza email con formato inválido', () => {
    expect(registerSchema.safeParse({ ...validPayload, email: 'no-es-email' }).success).toBe(false);
  });
});
