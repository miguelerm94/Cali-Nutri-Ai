import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Loguea cada request en JSON estructurado para CloudWatch (BackendArchitecture.md §9 y §18). */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - start;
        this.logger.log(
          JSON.stringify({
            level: 'info',
            request_id: request.requestId,
            method: request.method,
            path: request.originalUrl ?? request.url,
            user_id: request.user?.id ?? null,
            status: response.statusCode,
            duration_ms: durationMs,
            timestamp: new Date().toISOString(),
          }),
        );
      }),
    );
  }
}
