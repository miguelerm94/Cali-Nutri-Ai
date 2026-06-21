import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService, InvalidCredentialsError } from '../../../infrastructure/supabase/supabase.service';
import { ErrorCode } from '@cali-nutri/shared-types';

@Injectable()
export class ResetPasswordUseCase {
  constructor(private readonly supabaseService: SupabaseService) {}

  async execute(resetToken: string, newPassword: string): Promise<void> {
    try {
      await this.supabaseService.confirmPasswordReset(resetToken, newPassword);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        throw new UnauthorizedException({
          code: ErrorCode.INVALID_TOKEN,
          message: 'El token de recuperación es inválido o expiró. Solicita uno nuevo.',
        });
      }
      throw err;
    }
  }
}
