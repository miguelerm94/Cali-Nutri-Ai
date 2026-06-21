import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ErrorCode } from '@cali-nutri/shared-types';

const DEFAULT_TIMEOUT_MS = 10_000; // 10s — BackendArchitecture.md §9
export const TIMEOUT_METADATA_KEY = 'timeout';

/** Timeout configurable por ruta. Default 10s; IA usa @SetMetadata('timeout', 30000). */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const customTimeout = this.reflector.getAllAndOverride<number>(TIMEOUT_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      timeout(customTimeout ?? DEFAULT_TIMEOUT_MS),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException({
                code: ErrorCode.REQUEST_TIMEOUT,
                message: 'La operación tardó demasiado. Intenta nuevamente.',
              }),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
