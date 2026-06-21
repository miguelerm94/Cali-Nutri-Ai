import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HttpExceptionFilter } from './http-exception.filter';
import { ErrorCode } from '@cali-nutri/shared-types';

/** Mapea errores conocidos de Prisma a excepciones HTTP con código canónico. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly delegate = new HttpExceptionFilter();

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    let httpException;

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        httpException = new ConflictException({
          code: ErrorCode.EMAIL_ALREADY_EXISTS,
          message: 'El recurso ya existe (violación de restricción única).',
        });
        break;
      case 'P2025': // Record not found
        httpException = new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'El recurso solicitado no existe.',
        });
        break;
      default:
        httpException = new ConflictException({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Error al procesar la operación en base de datos.',
        });
    }

    this.delegate.catch(httpException, host);
  }
}
