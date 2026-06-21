import { ConflictException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GoalType, Sex, UnitPreference } from '@prisma/client';
import { AssessmentScoringEngine } from '../engines/assessment-scoring.engine';
import { TdeeCalculatorEngine } from '../engines/tdee-calculator.engine';
import { MacroCalculatorEngine } from '../engines/macro-calculator.engine';
import { AssessmentRepository } from '../repositories/assessment.repository';
import { GoalRepository } from '../repositories/goal.repository';
import { RoutineGeneratorEngine } from '../../training/engines/routine-generator.engine';
import { ExercisesRepository } from '../../training/repositories/exercises.repository';
import { TrainingProgramsRepository } from '../../training/repositories/training-programs.repository';
import { InitialAssessmentDto } from '../dto/initial-assessment.dto';
import { ErrorCode } from '@cali-nutri/shared-types';

export interface CompleteAssessmentResult {
  presentation_level: string;
  global_score: number;
  scores: { pullups: number; pushups: number; squats: number; core: number };
  goal: { type: string; tdee: number; target_calories: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number };
  training_program: {
    id: string;
    name: string;
    structure: string;
    weekly_frequency: number;
    days: Array<{ day_name: string; day_type: string; exercises_count: number }>;
  };
}

/**
 * Orquesta el onboarding completo (BackendArchitecture.md §5 "Assessment — 2 casos
 * de uso"): scoring → biométricos → TDEE/macros → Goal → rutina inicial.
 * Todo en una sola transacción lógica de negocio, disparada por POST /assessment/initial.
 */
@Injectable()
export class CompleteInitialAssessmentUseCase {
  constructor(
    private readonly scoringEngine: AssessmentScoringEngine,
    private readonly tdeeEngine: TdeeCalculatorEngine,
    private readonly macroEngine: MacroCalculatorEngine,
    private readonly routineEngine: RoutineGeneratorEngine,
    private readonly assessmentRepository: AssessmentRepository,
    private readonly goalRepository: GoalRepository,
    private readonly exercisesRepository: ExercisesRepository,
    private readonly trainingProgramsRepository: TrainingProgramsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string, dto: InitialAssessmentDto): Promise<CompleteAssessmentResult> {
    const weightKg = dto.weight_kg;
    const ageYears = this.calculateAge(dto.birth_date);

    // 1. Scoring de la evaluación (FD-01)
    const scores = this.scoringEngine.computeAll({
      pullupsMax: dto.movement_tests.pull_ups_max,
      pushupsMax: dto.movement_tests.push_ups_max,
      squatsMax: dto.movement_tests.squats_max,
      plankSeconds: dto.movement_tests.plank_seconds,
    });

    await this.assessmentRepository.createActiveAssessment(
      userId,
      {
        pullupsMax: dto.movement_tests.pull_ups_max,
        pushupsMax: dto.movement_tests.push_ups_max,
        squatsMax: dto.movement_tests.squats_max,
        dipsMax: dto.movement_tests.dips_max ?? 0,
        plankSeconds: dto.movement_tests.plank_seconds,
      },
      scores,
    );

    // 2. Biométricos base + state machine → paso 7 (FD-ARCH-07)
    await this.assessmentRepository.updateUserOnboardingData(userId, {
      birthDate: new Date(dto.birth_date),
      sex: dto.sex as Sex,
      heightCm: dto.height_cm,
      targetWeightKg: dto.target_weight_kg,
      trainingFrequency: dto.training_frequency,
      unitPreference: dto.unit_preference as UnitPreference,
    });
    await this.assessmentRepository.createBodyMeasurement(userId, weightKg);

    // 3. TDEE + macros (FD-05, FD-06)
    const tdee = this.tdeeEngine.calculateTdee(dto.sex as Sex, weightKg, dto.height_cm, ageYears, dto.training_frequency);
    const macros = this.macroEngine.calculate(tdee, weightKg, dto.goal_type as GoalType);

    const goal = await this.goalRepository.createActiveGoal(userId, dto.goal_type as GoalType, dto.target_weight_kg, macros);

    // 4. Rutina inicial (FD-03, FD-04)
    const exercises = await this.exercisesRepository.findAllActive();
    if (exercises.length === 0) {
      throw new ConflictException({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'El catálogo de ejercicios no está disponible. Contacta a soporte.',
      });
    }

    const routine = this.routineEngine.generate({
      trainingFrequency: dto.training_frequency,
      goalType: dto.goal_type as GoalType,
      presentationLevel: scores.presentationLevel,
      globalScore: scores.globalScore,
      assessment: {
        pullupsMax: dto.movement_tests.pull_ups_max,
        pushupsMax: dto.movement_tests.push_ups_max,
        squatsMax: dto.movement_tests.squats_max,
        plankSeconds: dto.movement_tests.plank_seconds,
      },
      exercises,
    });

    const program = await this.trainingProgramsRepository.createWithDays({
      userId,
      goalId: goal.id,
      name: `Programa ${this.structureLabel(routine.structure)} — Semana 1`,
      weeklyFrequency: routine.weeklyFrequency,
      structure: routine.structure,
      generatedForLevel: scores.presentationLevel,
      startDate: new Date(),
      days: routine.days,
    });

    this.eventEmitter.emit('onboarding.completed', { userId, presentationLevel: scores.presentationLevel });

    return {
      presentation_level: scores.presentationLevel,
      global_score: scores.globalScore,
      scores: {
        pullups: scores.pullupsScore,
        pushups: scores.pushupsScore,
        squats: scores.squatsScore,
        core: scores.coreScore,
      },
      goal: {
        type: dto.goal_type,
        tdee: macros.tdee,
        target_calories: macros.targetCalories,
        target_protein_g: macros.targetProteinG,
        target_carbs_g: macros.targetCarbsG,
        target_fat_g: macros.targetFatG,
      },
      training_program: {
        id: program.id,
        name: program.name,
        structure: program.structure,
        weekly_frequency: program.weeklyFrequency,
        days: program.workoutDays.map((d) => ({
          day_name: d.dayName,
          day_type: d.dayType,
          exercises_count: d.workoutExercises.length,
        })),
      },
    };
  }

  private calculateAge(birthDateIso: string): number {
    const birth = new Date(birthDateIso);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const hasNotHadBirthdayThisYear =
      now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
    if (hasNotHadBirthdayThisYear) age--;
    return age;
  }

  private structureLabel(structure: string): string {
    const labels: Record<string, string> = {
      full_body: 'Full Body',
      upper_lower: 'Upper/Lower',
      push_pull_legs: 'Push/Pull/Legs',
      ppl_double: 'PPL Doble',
    };
    return labels[structure] ?? structure;
  }
}
