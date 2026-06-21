import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Envuelve TODAS las respuestas exitosas en el contrato canónico:
 * { success: true, data, meta: { timestamp, request_id, version } }
 * Fuente: BackendArchitecture.md §9. Las excepciones NO pasan por aquí
 * (las maneja HttpExceptionFilter).
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // Permite a un controller devolver { data, pagination } y separarlos del envelope
        const { pagination, ...rest } = data ?? {};
        const payload = rest?.__raw !== undefined ? rest.__raw : (data ?? {});

        return {
          success: true,
          data: payload,
          ...(pagination ? { pagination } : {}),
          meta: {
            timestamp: new Date().toISOString(),
            request_id: request.requestId ?? 'unknown',
            version: process.env.API_VERSION ?? '1',
          },
        };
      }),
    );
  }
}
