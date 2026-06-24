import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ErrorCode } from '@cali-nutri/shared-types';

/**
 * Estrategias de validación. En producción solo 'jwt' (Supabase RS256/JWKS —
 * FD-ARCH-01). Con DEV_AUTH_ENABLED=true se antepone 'dev-jwt' (HS256 local)
 * para probar la app sin un proyecto Supabase; passport prueba cada estrategia
 * en orden y basta con que una autentique. Se evalúa al cargar el módulo, con
 * el entorno ya disponible.
 */
const STRATEGIES =
  process.env.DEV_AUTH_ENABLED === 'true' ? ['dev-jwt', 'jwt'] : ['jwt'];

/**
 * Guard GLOBAL aplicado en AppModule (BackendArchitecture.md §8).
 * Verifica JWT RS256 propio (NO el de Supabase — ver FD-ARCH-01 y jwt.strategy.ts).
 * Rutas marcadas con @Public() lo omiten.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(STRATEGIES) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: unknown): TUser {
    if (err || !user) {
      const code = err instanceof Error && err.name === 'TokenExpiredError'
        ? ErrorCode.TOKEN_EXPIRED
        : ErrorCode.INVALID_TOKEN;
      throw new UnauthorizedException({
        code,
        message: 'Token inválido o expirado. Usa /auth/refresh para renovarlo.',
      });
    }
    return user as TUser;
  }
}
