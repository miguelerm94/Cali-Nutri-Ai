import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../interfaces/auth-user.interface';
import { ErrorCode } from '@cali-nutri/shared-types';

/**
 * Aplica a Training, Nutrition, Hydration, AI (BackendArchitecture.md §8).
 * Verifica que el usuario completó el onboarding antes de usar esos módulos.
 */
@Injectable()
export class OnboardingGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user?.onboarding_complete) {
      throw new ForbiddenException({
        code: ErrorCode.ONBOARDING_REQUIRED,
        message: 'Debes completar el onboarding antes de continuar.',
      });
    }
    return true;
  }
}
