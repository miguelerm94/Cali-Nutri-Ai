import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { ErrorCode } from '@cali-nutri/shared-types';

interface SupabaseJwtPayload {
  sub: string; // = users.id en nuestra DB (ver FD-ARCH-01)
  email: string;
  exp: number;
  iat: number;
}

/**
 * Valida el JWT emitido por SUPABASE (FD-ARCH-01 — Capa 0, sin excepción).
 * NestJS NO firma tokens; solo verifica la firma RS256 contra el JWKS de Supabase.
 *
 * Flujo (BackendArchitecture.md §8):
 *   Header Authorization: Bearer <token>
 *   → valida firma con JWKS
 *   → PrismaService.users.findUnique({ id: payload.sub, deleted_at: null })
 *   → no encontrado → UnauthorizedException
 *   → retorna AuthUser → se adjunta a req.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: configService.get<string>('jwt.jwksUri') as string,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }),
      audience: configService.get<string>('jwt.audience'),
      issuer: configService.get<string>('jwt.issuer'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: SupabaseJwtPayload): Promise<AuthUser> {
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
