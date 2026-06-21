import { Injectable } from '@nestjs/common';
import { TrainingProgramsRepository } from '../repositories/training-programs.repository';
import { WorkoutSessionsRepository } from '../repositories/workout-sessions.repository';

export interface TodayResult {
  has_workout_today: boolean;
  workout_day: { id: string; day_name: string; day_type: string; day_order: number } | null;
  active_session_id: string | null;
  completed_today: boolean;
}

/**
 * GET /training/today — API.md §5. El schema no modela días por semana del
 * calendario (`workout_days` solo tiene `day_order`), así que el "día de hoy"
 * se determina rotando la secuencia de días del programa según las sesiones
 * completadas: día = sesiones_completadas % total_días.
 */
@Injectable()
export class GetTodayUseCase {
  constructor(
    private readonly programsRepository: TrainingProgramsRepository,
    private readonly sessionsRepository: WorkoutSessionsRepository,
  ) {}

  async execute(userId: string): Promise<TodayResult> {
    const program = await this.programsRepository.findActiveByUser(userId);
    if (!program || program.workoutDays.length === 0) {
      return { has_workout_today: false, workout_day: null, active_session_id: null, completed_today: false };
    }

    const activeSession = await this.sessionsRepository.findActiveByUser(userId);
    if (activeSession) {
      const activeDay = program.workoutDays.find((d) => d.id === activeSession.workoutDayId);
      return {
        has_workout_today: true,
        workout_day: activeDay ? this.toDayPayload(activeDay) : null,
        active_session_id: activeSession.id,
        completed_today: false,
      };
    }

    const completedCount = await this.sessionsRepository.countCompletedByProgram(program.id);
    const sortedDays = [...program.workoutDays].sort((a, b) => a.dayOrder - b.dayOrder);
    const nextDay = sortedDays[completedCount % sortedDays.length];

    const lastCompleted = (await this.sessionsRepository.findCompletedByProgram(program.id, 1))[0];
    const completedToday = lastCompleted ? this.isSameDay(lastCompleted.startedAt, new Date()) : false;

    return {
      has_workout_today: true,
      workout_day: this.toDayPayload(nextDay),
      active_session_id: null,
      completed_today: completedToday,
    };
  }

  private toDayPayload(day: { id: string; dayName: string; dayType: string; dayOrder: number }) {
    return { id: day.id, day_name: day.dayName, day_type: day.dayType, day_order: day.dayOrder };
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
  }
}
