import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { TrainingProgramsRepository } from '../repositories/training-programs.repository';

/** GET /training/programs/active — API.md §5. */
@Injectable()
export class GetActiveProgramUseCase {
  constructor(private readonly programsRepository: TrainingProgramsRepository) {}

  async execute(userId: string) {
    const program = await this.programsRepository.findActiveByUser(userId);
    if (!program) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'No hay un programa de entrenamiento activo.' });
    }

    return {
      id: program.id,
      name: program.name,
      structure: program.structure,
      weekly_frequency: program.weeklyFrequency,
      start_date: program.startDate,
      status: program.status,
      stagnation_alert: program.stagnationAlert,
      stagnation_detected_at: program.stagnationDetectedAt,
      workout_days: program.workoutDays
        .sort((a, b) => a.dayOrder - b.dayOrder)
        .map((day) => ({
          id: day.id,
          day_name: day.dayName,
          day_type: day.dayType,
          day_order: day.dayOrder,
          exercises: day.workoutExercises
            .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
            .map((we) => ({
              id: we.id,
              order: we.exerciseOrder,
              exercise: {
                id: we.exercise.id,
                name: we.exercise.name,
                name_es: we.exercise.nameEs,
                category: we.exercise.category,
                difficulty: we.exercise.difficulty,
              },
              prescription: {
                sets: we.sets,
                reps: we.repsTarget,
                rest_seconds: we.restSeconds,
                target_rpe: we.targetRpe ? Number(we.targetRpe) : null,
                notes: we.notes,
              },
            })),
        })),
    };
  }
}
