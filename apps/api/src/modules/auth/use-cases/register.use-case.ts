import { ConflictException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../repositories/auth.repository';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';
import { RegisterDto } from '../dto/register.dto';
import { AppEvent } from '../../../infrastructure/events/events.enum';
import { AuthResponseDto, ErrorCode } from '@cali-nutri/shared-types';

const BCRYPT_COST = 12;

/**
 * Flujo (BackendArchitecture.md §11, adaptado a FD-ARCH-01):
 *   1. Valida email único en NUESTRA tabla
 *   2. Hash password bcrypt(cost=12) — almacenado localmente para una futura
 *      migración fuera de Supabase, NO se usa para validar login (eso es de Supabase)
 *   3. Crea usuario en Supabase Auth (admin.createUser)
 *   4. Crea fila local en `users` con id = supabaseUserId (FD-ARCH-01)
 *   5. Inicia sesión inmediatamente para obtener el JWT (admin.createUser no retorna sesión)
 *   6. Emite AppEvent.USER_REGISTERED
 */
@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly supabaseService: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_ALREADY_EXISTS,
        message: 'El email ya está registrado.',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const supabaseUser = await this.supabaseService.createAuthUser(dto.email, dto.password, {
      first_name: dto.first_name,
    });

    const user = await this.authRepository.createLocalUser({
      id: supabaseUser.id,
      email: dto.email,
      passwordHash,
      firstName: dto.first_name,
      lastName: dto.last_name,
    });

    const session = await this.supabaseService.signInWithPassword(dto.email, dto.password);

    this.eventEmitter.emit(AppEvent.USER_REGISTERED, { userId: user.id });

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
