import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as crypto from 'crypto';

/**
 * Registra accesos a datos sensibles (HIPAA-adjacent): body_measurements, ai_messages,
 * actualización de users, eliminación de cuenta. Fuente: BackendArchitecture.md §9.
 * S1: deja la infraestructura de logging; la tabla audit_log dedicada se evalúa en S6b
 * junto con el resto de QA de seguridad — por ahora persiste en el log estructurado.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AUDIT');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            user_id: request.user?.id ?? null,
            action: request.method,
            resource_type: context.getClass().name,
            resource_id: request.params?.id ?? null,
            ip_address_hash: crypto
              .createHash('sha256')
              .update(request.ip ?? '')
              .digest('hex'),
            user_agent: request.headers['user-agent'] ?? null,
            timestamp: new Date().toISOString(),
          }),
        );
      }),
    );
  }
}
