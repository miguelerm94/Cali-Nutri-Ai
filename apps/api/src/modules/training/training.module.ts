import { Module } from '@nestjs/common';
import { RoutineGeneratorEngine } from './engines/routine-generator.engine';
import { ProgressionEngine } from './engines/progression.engine';
import { StagnationDetectorEngine } from './engines/stagnation-detector.engine';
import { ExercisesRepository } from './repositories/exercises.repository';
import { TrainingProgramsRepository } from './repositories/training-programs.repository';
import { WorkoutSessionsRepository } from './repositories/workout-sessions.repository';
import { WorkoutLogsRepository } from './repositories/workout-logs.repository';
import { WorkoutExercisesRepository } from './repositories/workout-exercises.repository';
import { StartSessionUseCase } from './use-cases/start-session.use-case';
import { LogSetUseCase } from './use-cases/log-set.use-case';
import { CompleteSessionUseCase } from './use-cases/complete-session.use-case';
import { CancelSessionUseCase } from './use-cases/cancel-session.use-case';
import { GetActiveProgramUseCase } from './use-cases/get-active-program.use-case';
import { GetTodayUseCase } from './use-cases/get-today.use-case';
import { GetSessionHistoryUseCase } from './use-cases/get-session-history.use-case';
import { GetSessionDetailUseCase } from './use-cases/get-session-detail.use-case';
import { GetExercisesUseCase } from './use-cases/get-exercises.use-case';
import { GetStagnationStatusUseCase } from './use-cases/get-stagnation-status.use-case';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';

/**
 * ALCANCE S3 completo (FD-INFRA-01): sesiones, registro de series con RPE,
 * progresión automática (FD-04), historial, detección pasiva de estancamiento (FD-02).
 * DeloadEngine no se implementa — FD-02 difiere la acción automática a v1.1.
 */
@Module({
  controllers: [TrainingController],
  providers: [
    RoutineGeneratorEngine,
    ProgressionEngine,
    StagnationDetectorEngine,
    ExercisesRepository,
    TrainingProgramsRepository,
    WorkoutSessionsRepository,
    WorkoutLogsRepository,
    WorkoutExercisesRepository,
    StartSessionUseCase,
    LogSetUseCase,
    CompleteSessionUseCase,
    CancelSessionUseCase,
    GetActiveProgramUseCase,
    GetTodayUseCase,
    GetSessionHistoryUseCase,
    GetSessionDetailUseCase,
    GetExercisesUseCase,
    GetStagnationStatusUseCase,
    TrainingService,
  ],
  exports: [RoutineGeneratorEngine, ExercisesRepository, TrainingProgramsRepository, WorkoutSessionsRepository, GetTodayUseCase],
})
export class TrainingModule {}
