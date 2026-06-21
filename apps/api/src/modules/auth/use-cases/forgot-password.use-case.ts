import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';

/**
 * SIEMPRE responde éxito, exista o no el email (no revela existencia de cuentas).
 * Fuente: API.md "siempre 200 para no revelar si el email existe".
 */
@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async execute(email: string): Promise<void> {
    try {
      await this.supabaseService.sendPasswordResetEmail(email);
    } catch (err) {
      // No se propaga el error al cliente — solo se loguea para observabilidad.
      this.logger.warn(`forgot-password: fallo silencioso para ${email}: ${(err as Error).message}`);
    }
  }
}
