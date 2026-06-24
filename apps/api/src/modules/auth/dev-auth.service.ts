import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './repositories/auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AppEvent } from '../../infrastructure/events/events.enum';
import { AuthResponseDto, ErrorCode } from '@cali-nutri/shared-types';

const BCRYPT_COST = 12;

/**
 * SEAM DE AUTENTICACIÓN LOCAL — SOLO DESARROLLO (ver config/dev-auth.config.ts).
 *
 * Encapsula TODA la lógica de auth que evita Supabase, para mantener los
 * use-cases de producción limpios: estos solo delegan aquí cuando `enabled`.
 * En producción `enabled` es false y este servicio nunca se ejecuta.
 *
 * Emite JWT HS256 firmados con un secreto local (no RS256/JWKS de Supabase).
 * El token lo valida DevJwtStrategy bajo la misma `sub = users.id`.
 */
@Injectable()
export class DevAuthService {
  private readonly logger = new Logger(DevAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    if (this.enabled) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new Error(
          'DEV_AUTH_ENABLED no puede activarse en producción (viola FD-ARCH-01).',
        );
      }
      this.logger.warn(
        '⚠️  Auth local de desarrollo ACTIVADA (DEV_AUTH_ENABLED=true). ' +
          'Supabase está deshabilitado. NO usar en producción.',
      );
    }
  }

  get enabled(): boolean {
    return this.configService.get<boolean>('devAuth.enabled') === true;
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_ALREADY_EXISTS,
        message: 'El email ya está registrado.',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const user = await this.authRepository.createLocalUser({
      id: crypto.randomUUID(),
      email: dto.email,
      passwordHash,
      firstName: dto.first_name,
      lastName: dto.last_name,
    });

    this.eventEmitter.emit(AppEvent.USER_REGISTERED, { userId: user.id });

    return this.buildResponse(user, true);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user || user.deletedAt || !user.passwordHash) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Email o contraseña incorrectos.',
      });
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Email o contraseña incorrectos.',
      });
    }

    this.eventEmitter.emit(AppEvent.USER_LOGGED_IN, {
      userId: user.id,
      deviceInfo: dto.device_info,
    });

    return this.buildResponse(user, false);
  }

  private buildResponse(
    user: { id: string; email: string; firstName: string; lastName: string | null; onboardingComplete: boolean; createdAt: Date },
    isNewUser: boolean,
  ): AuthResponseDto {
    const expiresIn = this.configService.get<number>('devAuth.expiresInSeconds') as number;
    const accessToken = this.signToken(user.id, user.email, expiresIn);
    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        onboarding_completed: user.onboardingComplete,
        created_at: user.createdAt.toISOString(),
      },
      tokens: {
        access_token: accessToken,
        // El refresh local es el mismo token (no rotamos en dev); el cliente
        // simplemente re-loguea cuando expira.
        refresh_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
      },
      is_new_user: isNewUser,
    };
  }

  /** Firma un JWT HS256 con `crypto` nativo (sin dependencias nuevas). */
  private signToken(sub: string, email: string, expiresIn: number): string {
    const secret = this.configService.get<string>('devAuth.secret') as string;
    const issuer = this.configService.get<string>('devAuth.issuer') as string;
    const now = Math.floor(Date.now() / 1000);

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub, email, iss: issuer, iat: now, exp: now + expiresIn };

    const encode = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');
    const signingInput = `${encode(header)}.${encode(payload)}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signingInput)
      .digest('base64url');

    return `${signingInput}.${signature}`;
  }
}
