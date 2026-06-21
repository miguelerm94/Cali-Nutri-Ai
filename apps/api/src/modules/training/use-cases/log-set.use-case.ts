import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { WorkoutSessionsRepository } from '../repositories/workout-sessions.repository';
import { WorkoutLogsRepository } from '../repositories/workout-logs.repository';
import { WorkoutExercisesRepository } from '../repositories/workout-exercises.repository';
import { LogSetDto } from '../dto/log-set.dto';

export interface LogSetResult {
  id: string;
  session_id: string;
  set_number: number;
  reps_completed: number;
  reps_target: number;
  rpe: number | null;
  target_rpe: number | null;
  completed_at: Date;
  session_progress: { sets_completed: number; sets_total: number; percent: number };
}

/** POST /training/sessions/:session_id/logs — API.md §5. */
@Injectable()
export class LogSetUseCase {
  constructor(
    private readonly sessionsRepository: WorkoutSessionsRepository,
    private readonly logsRepository: WorkoutLogsRepository,
    private readonly workoutExercisesRepository: WorkoutExercisesRepository,
  ) {}

  async execute(userId: string, sessionId: string, dto: LogSetDto): Promise<LogSetResult> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'La sesión no existe.' });
    }
    if (session.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No tienes acceso a esta sesión.' });
    }
    if (session.finishedAt) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'La sesión ya fue finalizada.' });
    }

    const workoutExercise = await this.workoutExercisesRepository.findById(dto.workout_exercise_id);
    if (!workoutExercise) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'El ejercicio prescrito no existe.' });
    }

    const log = await this.logsRepository.create({
      sessionId,
      exerciseId: workoutExercise.exerciseId,
      setNumber: dto.set_number,
      repsCompleted: dto.reps_completed,
      rpe: dto.rpe,
      notes: dto.notes,
    });

    const setsCompleted = await this.logsRepository.countBySession(sessionId);
    const setsTotal = session.workoutDay?.workoutExercises.reduce((sum, we) => sum + we.sets, 0) ?? 0;

    return {
      id: log.id,
      session_id: sessionId,
      set_number: log.setNumber,
      reps_completed: log.repsCompleted,
      reps_target: workoutExercise.repsTarget,
      rpe: log.rpe,
      target_rpe: workoutExercise.targetRpe ? Number(workoutExercise.targetRpe) : null,
      completed_at: log.createdAt,
      session_progress: {
        sets_completed: setsCompleted,
        sets_total: setsTotal,
        percent: setsTotal > 0 ? Math.round((setsCompleted / setsTotal) * 10000) / 100 : 0,
      },
    };
  }
}
