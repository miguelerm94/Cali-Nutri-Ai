import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { ErrorCode } from '@cali-nutri/shared-types';

interface DevJwtPayload {
  sub: string; // = users.id
  email: string;
  exp: number;
  iat: number;
}

/**
 * SEAM DE AUTENTICACIÓN LOCAL — SOLO DESARROLLO (ver config/dev-auth.config.ts).
 *
 * Valida los JWT HS256 emitidos por DevAuthService. Registrada bajo el nombre
 * 'dev-jwt'. El JwtAuthGuard la incluye en su lista de estrategias ÚNICAMENTE
 * cuando DEV_AUTH_ENABLED=true; en producción no se registra y este código es
 * inerte. La validación de identidad es idéntica a la estrategia real:
 * `sub` debe corresponder a un users.id existente y no eliminado.
 */
@Injectable()
export class DevJwtStrategy extends PassportStrategy(Strategy, 'dev-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('devAuth.secret') as string,
      issuer: configService.get<string>('devAuth.issuer'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: DevJwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException({
        code: ErrorCode.ACCOUNT_NOT_FOUND,
        message: 'Usuario no encontrado o cuenta eliminada.',
      });
    }

    return {
      id: user.id,
      email: user.email,
      tier: user.tier,
      onboarding_complete: user.onboardingComplete,
    };
  }
}
