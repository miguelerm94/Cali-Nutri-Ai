import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ErrorCode } from '@cali-nutri/shared-types';

/**
 * Pipe de validación con Zod. Se usa por-ruta: @UsePipes(new ZodValidationPipe(registerSchema))
 * Fuente: BackendArchitecture.md — "ZodValidationPipe validación global de inputs".
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Los datos enviados no son válidos.',
        details,
      });
    }
    return result.data;
  }
}
