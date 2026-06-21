import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { WorkoutSessionsRepository } from '../repositories/workout-sessions.repository';
import { WorkoutExercisesRepository } from '../repositories/workout-exercises.repository';
import { TrainingProgramsRepository } from '../repositories/training-programs.repository';
import { ProgressionEngine } from '../engines/progression.engine';
import { StagnationDetectorEngine, SessionVolumeInput } from '../engines/stagnation-detector.engine';
import { CompleteSessionDto } from '../dto/complete-session.dto';

export interface CompleteSessionResult {
  session_summary: {
    id: string;
    duration_minutes: number;
    total_sets_completed: number;
    total_sets_planned: number;
    completion_rate: number;
    total_reps: number;
  };
  progression: { exercise_id: string; workout_exercise_id: string }[];
  stagnation_alert: boolean;
}

/**
 * PATCH /training/sessions/:session_id/complete — orquesta el cierre de la sesión,
 * la evaluación de progresión (FD-04) y la detección pasiva de estancamiento (FD-02).
 */
@Injectable()
export class CompleteSessionUseCase {
  constructor(
    private readonly sessionsRepository: WorkoutSessionsRepository,
    private readonly workoutExercisesRepository: WorkoutExercisesRepository,
    private readonly programsRepository: TrainingProgramsRepository,
    private readonly progressionEngine: ProgressionEngine,
    private readonly stagnationEngine: StagnationDetectorEngine,
  ) {}

  async execute(userId: string, sessionId: string, dto: CompleteSessionDto): Promise<CompleteSessionResult> {
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

    const finishedAt = new Date();
    const durationMinutes = Math.max(1, Math.round((finishedAt.getTime() - session.startedAt.getTime()) / 60000));

    await this.sessionsRepository.complete(sessionId, {
      finishedAt,
      durationMinutes,
      subjectiveFatigue: dto.subjective_fatigue,
      notes: dto.notes,
    });

    const prescriptions = session.workoutDay?.workoutExercises ?? [];
    const totalSetsPlanned = prescriptions.reduce((sum, we) => sum + we.sets, 0);
    const totalSetsCompleted = session.workoutLogs.length;
    const totalReps = session.workoutLogs.reduce((sum, log) => sum + log.repsCompleted, 0);

    const progressionTriggered = await this.evaluateProgression(session, prescriptions);

    const stagnation = session.programId ? await this.evaluateStagnation(session.programId) : false;

    return {
      session_summary: {
        id: sessionId,
        duration_minutes: durationMinutes,
        total_sets_completed: totalSetsCompleted,
        total_sets_planned: totalSetsPlanned,
        completion_rate: totalSetsPlanned > 0 ? Math.round((totalSetsCompleted / totalSetsPlanned) * 10000) / 10000 : 0,
        total_reps: totalReps,
      },
      progression: progressionTriggered,
      stagnation_alert: stagnation,
    };
  }

  private async evaluateProgression(
    session: NonNullable<Awaited<ReturnType<WorkoutSessionsRepository['findById']>>>,
    prescriptions: { id: string; exerciseId: string; sets: number; repsTarget: number }[],
  ) {
    if (!session.programId || !session.workoutDayId || prescriptions.length === 0) return [];

    const pastSessions = await this.sessionsRepository.findCompletedByProgram(session.programId);
    const previousSession = pastSessions.find((s) => s.id !== session.id && s.workoutDayId === session.workoutDayId);

    const currentLogs = session.workoutLogs.map((log) => ({
      exerciseId: log.exerciseId,
      setNumber: log.setNumber,
      repsCompleted: log.repsCompleted,
    }));
    const previousLogs = previousSession
      ? previousSession.workoutLogs.map((log) => ({ exerciseId: log.exerciseId, setNumber: log.setNumber, repsCompleted: log.repsCompleted }))
      : null;

    const results = this.progressionEngine.evaluate(
      prescriptions.map((p) => ({ workoutExerciseId: p.id, exerciseId: p.exerciseId, sets: p.sets, repsTarget: p.repsTarget })),
      currentLogs,
      previousLogs,
    );

    const triggered = results.filter((r) => r.triggered);
    await Promise.all(triggered.map((r) => this.workoutExercisesRepository.incrementRepsTarget(r.workoutExerciseId)));

    return triggered.map((r) => ({ exercise_id: r.exerciseId, workout_exercise_id: r.workoutExerciseId }));
  }

  private async evaluateStagnation(programId: string): Promise<boolean> {
    const sessions = await this.sessionsRepository.findCompletedByProgram(programId);

    const volumes: SessionVolumeInput[] = sessions.map((s) => ({
      startedAt: s.startedAt,
      totalRepsCompleted: s.workoutLogs.reduce((sum, log) => sum + log.repsCompleted, 0),
      totalRepsTarget: (s.workoutDay?.workoutExercises ?? []).reduce((sum, we) => sum + we.sets * we.repsTarget, 0),
    }));

    const result = this.stagnationEngine.detect(volumes);
    await this.programsRepository.setStagnationAlert(programId, result.alert, result.detectedAt);
    return result.alert;
  }
}
