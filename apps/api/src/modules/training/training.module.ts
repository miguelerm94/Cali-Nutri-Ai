import { Module } from '@nestjs/common';
import { RoutineGeneratorEngine } from './engines/routine-generator.engine';
import { ExercisesRepository } from './repositories/exercises.repository';
import { TrainingProgramsRepository } from './repositories/training-programs.repository';

/**
 * ALCANCE S2 (parcial): solo lo necesario para que AssessmentModule pueda
 * generar y persistir la rutina inicial (BackendArchitecture.md — mapa de
 * dependencias: "AssessmentModule importa TrainingModule").
 *
 * Lo que llega en S3 y se añade a este mismo módulo sin romper su API pública:
 * TrainingController, TrainingService, WorkoutSessionsRepository,
 * WorkoutLogsRepository, ProgressionEngine, StagnationDetectorEngine, DeloadEngine.
 */
@Module({
  providers: [RoutineGeneratorEngine, ExercisesRepository, TrainingProgramsRepository],
  exports: [RoutineGeneratorEngine, ExercisesRepository, TrainingProgramsRepository],
})
export class TrainingModule {}
