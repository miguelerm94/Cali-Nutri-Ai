import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { TrainingProgramsRepository } from '../repositories/training-programs.repository';

export interface StagnationStatusResult {
  stagnation_alert: boolean;
  stagnation_detected_at: Date | null;
  message: string | null;
}

/**
 * GET /training/stagnation-status — FD-02: "Endpoint GET /training/stagnation-status
 * retorna estado calculado en runtime. No requiere tabla nueva." El flag se actualiza
 * en cada PATCH /training/sessions/:id/complete; este endpoint solo lo expone.
 */
@Injectable()
export class GetStagnationStatusUseCase {
  constructor(private readonly programsRepository: TrainingProgramsRepository) {}

  async execute(userId: string): Promise<StagnationStatusResult> {
    const program = await this.programsRepository.findActiveByUser(userId);
    if (!program) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'No hay un programa de entrenamiento activo.' });
    }

    return {
      stagnation_alert: program.stagnationAlert,
      stagnation_detected_at: program.stagnationDetectedAt,
      message: program.stagnationAlert
        ? 'Tu progreso se ha estabilizado. Considera hablar con CALI para ajustar tu programa.'
        : null,
    };
  }
}
