import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_PREMIUM_KEY } from '../decorators/premium.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';
import { ErrorCode } from '@cali-nutri/shared-types';

/** Verifica req.user.tier === 'premium' en endpoints marcados con @RequiresPremium(). */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresPremium = this.reflector.getAllAndOverride<boolean>(REQUIRES_PREMIUM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiresPremium) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (user?.tier !== 'premium') {
      throw new ForbiddenException({
        code: ErrorCode.PREMIUM_REQUIRED,
        message: 'Esta funcionalidad requiere una suscripción Premium.',
        upgrade_url: 'cali://upgrade',
      });
    }
    return true;
  }
}
