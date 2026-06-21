import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter } from '@nestjs/common';
import { ZodError } from 'zod';
import { HttpExceptionFilter } from './http-exception.filter';
import { ErrorCode } from '@cali-nutri/shared-types';

/** Mapea errores de validación Zod a 400 con detalle por campo. */
@Catch(ZodError)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly delegate = new HttpExceptionFilter();

  catch(exception: ZodError, host: ArgumentsHost): void {
    const details = exception.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    const httpException = new BadRequestException({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Los datos enviados no son válidos.',
      details,
    });

    this.delegate.catch(httpException, host);
  }
}
