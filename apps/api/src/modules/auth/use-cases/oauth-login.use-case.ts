import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRepository } from '../repositories/auth.repository';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';
import { OAuthLoginDto } from '../dto/oauth-login.dto';
import { AppEvent } from '../../../infrastructure/events/events.enum';
import { AuthResponseDto } from '@cali-nutri/shared-types';

/**
 * Flujo (BackendArchitecture.md §11):
 *   1. SupabaseService.signInWithIdToken verifica el id_token con el proveedor
 *   2. Usuario nuevo → crea fila local en `users` con perfil OAuth
 *   3. Usuario existente → fetch directo por id (= supabaseUserId)
 *   4. Retorna { user, tokens, is_new_user }
 */
@Injectable()
export class OAuthLoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly supabaseService: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: OAuthLoginDto): Promise<AuthResponseDto> {
    const session = await this.supabaseService.signInWithIdToken(dto.provider, dto.id_token);

    let user = await this.authRepository.findById(session.supabaseUserId);

    if (!user) {
      const [firstName, ...rest] = (session.profile.fullName ?? 'Usuario CALI-NUTRI').split(' ');
      user = await this.authRepository.createLocalUser({
        id: session.supabaseUserId,
        email: session.email,
        passwordHash: null, // Usuarios OAuth no tienen password local
        firstName,
        lastName: rest.join(' ') || undefined,
        googleId: dto.provider === 'google' ? session.profile.providerSub : undefined,
      });
      this.eventEmitter.emit(AppEvent.USER_REGISTERED, { userId: user.id, via: dto.provider });
    } else {
      this.eventEmitter.emit(AppEvent.USER_LOGGED_IN, { userId: user.id, via: dto.provider });
    }

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
      is_new_user: session.isNewUser,
    };
  }
}
