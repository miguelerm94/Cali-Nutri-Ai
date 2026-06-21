import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({ email: z.string().email() });
  const pipe = new ZodValidationPipe(schema);

  it('retorna el valor parseado cuando es válido', () => {
    const result = pipe.transform({ email: 'carlos@email.com' });
    expect(result).toEqual({ email: 'carlos@email.com' });
  });

  it('lanza BadRequestException con detalle por campo cuando es inválido', () => {
    expect(() => pipe.transform({ email: 'no-es-un-email' })).toThrow(BadRequestException);

    try {
      pipe.transform({ email: 'no-es-un-email' });
    } catch (err) {
      const response = (err as BadRequestException).getResponse() as any;
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.details[0].field).toBe('email');
    }
  });
});
