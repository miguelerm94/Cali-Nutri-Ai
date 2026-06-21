import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRepository } from '../repositories/auth.repository';
import { SupabaseService, InvalidCredentialsError } from '../../../infrastructure/supabase/supabase.service';
import { LoginDto } from '../dto/login.dto';
import { AppEvent } from '../../../infrastructure/events/events.enum';
import { AuthResponseDto, ErrorCode } from '@cali-nutri/shared-types';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly supabaseService: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    let session;
    try {
      // Supabase valida las credenciales (timing-safe internamente) y emite el JWT — FD-ARCH-01.
      session = await this.supabaseService.signInWithPassword(dto.email, dto.password);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        throw new UnauthorizedException({
          code: ErrorCode.INVALID_CREDENTIALS,
          message: 'Email o contraseña incorrectos.',
        });
      }
      throw err;
    }

    const user = await this.authRepository.findById(session.supabaseUserId);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException({
        code: ErrorCode.ACCOUNT_NOT_FOUND,
        message: 'Usuario no encontrado.',
      });
    }

    this.eventEmitter.emit(AppEvent.USER_LOGGED_IN, { userId: user.id, deviceInfo: dto.device_info });

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
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
        token_type: 'Bearer',
        expires_in: session.expiresIn,
      },
    };
  }
}
