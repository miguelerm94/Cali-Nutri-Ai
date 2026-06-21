import { Injectable } from '@nestjs/common';
import {
  Exercise,
  ExerciseCategory,
  GoalType,
  PresentationLevel,
  TrainingStructure,
  WorkoutDayType,
} from '@prisma/client';

export interface GeneratedExercise {
  exerciseId: string;
  exerciseOrder: number;
  sets: number;
  repsTarget: number;
  restSeconds: number;
  targetRpe: number;
  notes?: string;
}

export interface GeneratedWorkoutDay {
  dayName: string;
  dayType: WorkoutDayType;
  dayOrder: number;
  exercises: GeneratedExercise[];
}

export interface RoutineGeneratorInput {
  trainingFrequency: number;
  goalType: GoalType;
  presentationLevel: PresentationLevel;
  globalScore: number;
  assessment: { pullupsMax: number; pushupsMax: number; squatsMax: number; plankSeconds: number };
  exercises: Exercise[]; // catálogo completo activo
}

export interface GeneratedRoutine {
  structure: TrainingStructure;
  weeklyFrequency: number;
  days: GeneratedWorkoutDay[];
}

const ISOMETRIC_EXERCISES = new Set(['Plancha', 'Plancha lateral', 'Hollow Body Hold']);

/**
 * Generador de rutina inicial — FD-03 (estructura/frecuencia) + FD-04 (series/reps/RPE)
 * + MVP.md §5.2 (catálogo de 18-20 ejercicios). Vive en TrainingModule porque
 * BackendArchitecture.md ubica `routine-generator.engine.ts` ahí, aunque el resto
 * de TrainingModule (sesiones, logs, progresión) llega en S3.
 */
@Injectable()
export class RoutineGeneratorEngine {
  generate(input: RoutineGeneratorInput): GeneratedRoutine {
    const structure = this.resolveStructure(input.trainingFrequency);
    const dayTypes = this.dayTypesFor(structure);
    const byCategory = this.groupByCategory(input.exercises);
    const targetRpe = this.targetRpeFor(input.goalType);

    const days: GeneratedWorkoutDay[] = dayTypes.map((dayType, index) =>
      this.buildDay(dayType, index, input, byCategory, targetRpe),
    );

    return { structure, weeklyFrequency: dayTypes.length, days };
  }

  /**
   * FD-03: estructura determinada por la frecuencia ELEGIDA por el usuario,
   * no por su nivel — "el programa generado usará la estructura de la
   * frecuencia elegida con volumen ajustado al nivel real" (regla de negocio).
   */
  private resolveStructure(trainingFrequency: number): TrainingStructure {
    if (trainingFrequency <= 3) return TrainingStructure.full_body;
    if (trainingFrequency === 4) return TrainingStructure.upper_lower;
    if (trainingFrequency === 5) return TrainingStructure.push_pull_legs;
    return TrainingStructure.ppl_double; // 6 o 7 días → se generan 6 (no hay estructura de 7)
  }

  private dayTypesFor(structure: TrainingStructure): WorkoutDayType[] {
    switch (structure) {
      case TrainingStructure.full_body:
        return [WorkoutDayType.full_body_a, WorkoutDayType.full_body_b, WorkoutDayType.full_body_a];
      case TrainingStructure.upper_lower:
        return [WorkoutDayType.upper, WorkoutDayType.lower, WorkoutDayType.upper, WorkoutDayType.lower];
      case TrainingStructure.push_pull_legs:
        // FD-03: "Push/Pull/Legs + 2 complementarios"
        return [
          WorkoutDayType.push,
          WorkoutDayType.pull,
          WorkoutDayType.legs,
          WorkoutDayType.complementary,
          WorkoutDayType.complementary,
        ];
      case TrainingStructure.ppl_double:
        return [
          WorkoutDayType.push,
          WorkoutDayType.pull,
          WorkoutDayType.legs,
          WorkoutDayType.push,
          WorkoutDayType.pull,
          WorkoutDayType.legs,
        ];
    }
  }

  private groupByCategory(exercises: Exercise[]): Map<ExerciseCategory, Exercise[]> {
    const map = new Map<ExerciseCategory, Exercise[]>();
    for (const ex of exercises) {
      const list = map.get(ex.category) ?? [];
      list.push(ex);
      map.set(ex.category, list);
    }
    return map;
  }

  private findByName(byCategory: Map<ExerciseCategory, Exercise[]>, category: ExerciseCategory, name: string): Exercise | undefined {
    return byCategory.get(category)?.find((e) => e.name === name);
  }

  /** FD-04: RPE objetivo por tipo de objetivo. */
  private targetRpeFor(goalType: GoalType): number {
    switch (goalType) {
      case GoalType.muscle_gain:
        return 8;
      case GoalType.fat_loss:
        return 7;
      case GoalType.recomposition:
        return 7.5;
      case GoalType.maintenance:
      default:
        return 7;
    }
  }

  /** FD-04: trabajo_objetivo = floor(max*0.70). Si <3, la variante regresiva ya cubre eso (selección de ejercicio). */
  private repsFromMax(max: number): number {
    return Math.max(Math.floor(max * 0.7), 3);
  }

  /** Default conservador por nivel para ejercicios accesorios sin "máximo" evaluado (extiende FD-04). */
  private defaultAccessoryReps(level: PresentationLevel): number {
    if (level === PresentationLevel.advanced) return 12;
    if (level === PresentationLevel.intermediate) return 10;
    return 8;
  }

  private defaultAccessoryHoldSeconds(level: PresentationLevel): number {
    if (level === PresentationLevel.advanced) return 45;
    if (level === PresentationLevel.intermediate) return 30;
    return 20;
  }

  private toGenerated(
    exercise: Exercise,
    order: number,
    repsTarget: number,
    restSeconds: number,
    targetRpe: number,
  ): GeneratedExercise {
    const isIsometric = ISOMETRIC_EXERCISES.has(exercise.name);
    return {
      exerciseId: exercise.id,
      exerciseOrder: order,
      sets: 4, // FD-04: series=4 por defecto
      repsTarget,
      restSeconds,
      targetRpe,
      notes: isIsometric ? `Mantener ${repsTarget} segundos` : undefined,
    };
  }

  /** Selecciona la variante de empuje horizontal según pushupsMax (cadena inclinadas→normales→declinadas→diamante). */
  private selectPush(byCategory: Map<ExerciseCategory, Exercise[]>, pushupsMax: number): { exercise: Exercise; reps: number } {
    const reps = this.repsFromMax(pushupsMax);
    const name = pushupsMax < 6 ? 'Flexiones inclinadas' : pushupsMax < 31 ? 'Flexiones normales' : pushupsMax < 51 ? 'Flexiones declinadas' : 'Flexiones diamante';
    const exercise = this.findByName(byCategory, ExerciseCategory.push, name) ?? byCategory.get(ExerciseCategory.push)![0];
    return { exercise, reps };
  }

  /** Selecciona la variante de tracción vertical según pullupsMax (cadena negativas→chinups→dominadas). */
  private selectPull(byCategory: Map<ExerciseCategory, Exercise[]>, pullupsMax: number): { exercise: Exercise; reps: number } {
    const reps = this.repsFromMax(pullupsMax);
    const name = pullupsMax <= 0 ? 'Dominadas negativas' : pullupsMax < 8 ? 'Chin Ups supinados' : 'Dominadas pronadas';
    const exercise = this.findByName(byCategory, ExerciseCategory.pull, name) ?? byCategory.get(ExerciseCategory.pull)![0];
    return { exercise, reps };
  }

  private selectSquat(byCategory: Map<ExerciseCategory, Exercise[]>, squatsMax: number, level: PresentationLevel): { exercise: Exercise; reps: number } {
    const reps = this.repsFromMax(squatsMax);
    const name = level === PresentationLevel.advanced ? 'Sentadilla búlgara' : level === PresentationLevel.intermediate ? 'Zancada' : 'Sentadilla';
    const exercise = this.findByName(byCategory, ExerciseCategory.squat, name) ?? byCategory.get(ExerciseCategory.squat)![0];
    return { exercise, reps };
  }

  private selectCore(byCategory: Map<ExerciseCategory, Exercise[]>, plankSeconds: number): { exercise: Exercise; reps: number } {
    const name = plankSeconds < 30 ? 'Plancha' : plankSeconds <= 60 ? 'Hollow Body Hold' : 'Elevaciones de piernas';
    const exercise = this.findByName(byCategory, ExerciseCategory.core, name) ?? byCategory.get(ExerciseCategory.core)![0];
    const reps = name === 'Elevaciones de piernas' ? this.repsFromMax(Math.max(plankSeconds / 3, 8)) : Math.max(plankSeconds, 20);
    return { exercise, reps };
  }

  private buildDay(
    dayType: WorkoutDayType,
    index: number,
    input: RoutineGeneratorInput,
    byCategory: Map<ExerciseCategory, Exercise[]>,
    targetRpe: number,
  ): GeneratedWorkoutDay {
    const { assessment, presentationLevel } = input;
    const exercises: GeneratedExercise[] = [];
    let order = 1;

    const pikePush = this.findByName(byCategory, ExerciseCategory.push, presentationLevel === 'advanced' ? 'Elevated Pike Push Ups' : 'Pike Push Ups');
    const remoMesa = this.findByName(byCategory, ExerciseCategory.pull, 'Remo en mesa (bodyweight row)');
    const hipThrust = this.findByName(byCategory, ExerciseCategory.hinge, 'Hip Thrust');
    const planchaLateral = this.findByName(byCategory, ExerciseCategory.core, 'Plancha lateral');
    const puenteGluteos = this.findByName(byCategory, ExerciseCategory.hinge, 'Puente de glúteos');
    const extEspalda = this.findByName(byCategory, ExerciseCategory.hinge, 'Extensión de espalda en suelo');

    const accReps = this.defaultAccessoryReps(presentationLevel);
    const holdSecs = this.defaultAccessoryHoldSeconds(presentationLevel);

    const pushSel = this.selectPush(byCategory, assessment.pushupsMax);
    const pullSel = this.selectPull(byCategory, assessment.pullupsMax);
    const squatSel = this.selectSquat(byCategory, assessment.squatsMax, presentationLevel);
    const coreSel = this.selectCore(byCategory, assessment.plankSeconds);

    const add = (ex: Exercise | undefined, reps: number, rest = 90) => {
      if (!ex) return;
      exercises.push(this.toGenerated(ex, order++, reps, rest, targetRpe));
    };

    switch (dayType) {
      case WorkoutDayType.full_body_a:
      case WorkoutDayType.full_body_b: {
        add(pushSel.exercise, pushSel.reps);
        add(pullSel.exercise, pullSel.reps);
        add(squatSel.exercise, squatSel.reps);
        add(coreSel.exercise, coreSel.reps, 60);
        break;
      }
      case WorkoutDayType.upper: {
        add(pushSel.exercise, pushSel.reps);
        add(pikePush, accReps);
        add(pullSel.exercise, pullSel.reps);
        add(remoMesa, accReps);
        break;
      }
      case WorkoutDayType.lower: {
        add(squatSel.exercise, squatSel.reps);
        add(hipThrust, accReps, 75);
        add(coreSel.exercise, coreSel.reps, 60);
        break;
      }
      case WorkoutDayType.push: {
        add(pushSel.exercise, pushSel.reps);
        add(pikePush, accReps);
        break;
      }
      case WorkoutDayType.pull: {
        add(pullSel.exercise, pullSel.reps);
        add(remoMesa, accReps);
        break;
      }
      case WorkoutDayType.legs: {
        add(squatSel.exercise, squatSel.reps);
        add(hipThrust, accReps, 75);
        break;
      }
      case WorkoutDayType.complementary: {
        add(coreSel.exercise, coreSel.reps, 60);
        add(planchaLateral, holdSecs, 60);
        add(puenteGluteos, accReps, 75);
        add(extEspalda, accReps, 75);
        break;
      }
    }

    return { dayName: this.dayName(dayType, index), dayType, dayOrder: index + 1, exercises };
  }

  private dayName(dayType: WorkoutDayType, index: number): string {
    const names: Record<WorkoutDayType, string> = {
      full_body_a: 'Full Body A',
      full_body_b: 'Full Body B',
      upper: 'Tren Superior',
      lower: 'Tren Inferior',
      push: 'Empuje',
      pull: 'Tracción',
      legs: 'Pierna',
      complementary: 'Complementario',
    };
    return `${names[dayType]} — Día ${index + 1}`;
  }
}
