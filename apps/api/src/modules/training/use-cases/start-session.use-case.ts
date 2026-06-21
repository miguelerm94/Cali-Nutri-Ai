import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { WorkoutSessionsRepository } from '../repositories/workout-sessions.repository';
import { TrainingProgramsRepository } from '../repositories/training-programs.repository';

export interface StartSessionResult {
  id: string;
  workout_day_id: string | null;
  day_name: string | null;
  status: 'in_progress';
  started_at: Date;
  exercises_to_complete: number;
}

/** POST /training/sessions — API.md §5. Una sola sesión activa por usuario a la vez. */
@Injectable()
export class StartSessionUseCase {
  constructor(
    private readonly sessionsRepository: WorkoutSessionsRepository,
    private readonly programsRepository: TrainingProgramsRepository,
  ) {}

  async execute(userId: string, workoutDayId: string): Promise<StartSessionResult> {
    const activeSession = await this.sessionsRepository.findActiveByUser(userId);
    if (activeSession) {
      throw new ConflictException({
        code: ErrorCode.ACTIVE_SESSION_EXISTS,
        message: 'Ya existe una sesión de entrenamiento en progreso.',
      });
    }

    const program = await this.programsRepository.findActiveByUser(userId);
    if (!program) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'No hay un programa de entrenamiento activo.',
      });
    }

    const day = program.workoutDays.find((d) => d.id === workoutDayId);
    if (!day) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'El día de entrenamiento no existe en el programa activo.',
      });
    }

    const session = await this.sessionsRepository.create({
      userId,
      programId: program.id,
      workoutDayId: day.id,
      startedAt: new Date(),
    });

    return {
      id: session.id,
      workout_day_id: day.id,
      day_name: day.dayName,
      status: 'in_progress',
      started_at: session.startedAt,
      exercises_to_complete: day.workoutExercises.length,
    };
  }
}
