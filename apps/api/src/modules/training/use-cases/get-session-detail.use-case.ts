import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { WorkoutSessionsRepository } from '../repositories/workout-sessions.repository';

/** GET /training/sessions/:session_id — detalle con logs (API.md §5). */
@Injectable()
export class GetSessionDetailUseCase {
  constructor(private readonly sessionsRepository: WorkoutSessionsRepository) {}

  async execute(userId: string, sessionId: string) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'La sesión no existe.' });
    }
    if (session.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No tienes acceso a esta sesión.' });
    }

    return {
      id: session.id,
      day_name: session.workoutDay?.dayName ?? null,
      started_at: session.startedAt,
      finished_at: session.finishedAt,
      duration_minutes: session.durationMinutes,
      subjective_fatigue: session.subjectiveFatigue,
      notes: session.notes,
      logs: session.workoutLogs.map((log) => ({
        id: log.id,
        exercise_id: log.exerciseId,
        exercise_name: log.exercise.name,
        set_number: log.setNumber,
        reps_completed: log.repsCompleted,
        rpe: log.rpe,
        completed_at: log.createdAt,
      })),
    };
  }
}
