import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { WorkoutSessionsRepository } from '../repositories/workout-sessions.repository';

/** DELETE /training/sessions/:session_id — cancela una sesión en progreso sin guardar. */
@Injectable()
export class CancelSessionUseCase {
  constructor(private readonly sessionsRepository: WorkoutSessionsRepository) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'La sesión no existe.' });
    }
    if (session.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No tienes acceso a esta sesión.' });
    }
    if (session.finishedAt) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No se puede cancelar una sesión ya finalizada.' });
    }

    await this.sessionsRepository.delete(sessionId);
  }
}
