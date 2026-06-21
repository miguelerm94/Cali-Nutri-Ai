import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService, InvalidCredentialsError } from '../../../infrastructure/supabase/supabase.service';
import { ErrorCode, TokensDto } from '@cali-nutri/shared-types';

/** Refresh Token Rotation 100% delegado a Supabase (FD-ARCH-01). */
@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly supabaseService: SupabaseService) {}

  async execute(refreshToken: string): Promise<TokensDto> {
    try {
      const session = await this.supabaseService.refreshSession(refreshToken);
      return {
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
        token_type: 'Bearer',
        expires_in: session.expiresIn,
      };
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        throw new UnauthorizedException({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'El refresh token es inválido o expiró. Inicia sesión nuevamente.',
        });
      }
      throw err;
    }
  }
}
