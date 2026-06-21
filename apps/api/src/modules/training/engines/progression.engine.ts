import { Injectable } from '@nestjs/common';

export interface LoggedSet {
  exerciseId: string;
  setNumber: number;
  repsCompleted: number;
}

export interface PrescribedExercise {
  workoutExerciseId: string;
  exerciseId: string;
  sets: number;
  repsTarget: number;
}

export interface PastSessionPerformance {
  workoutDayId: string | null;
  logs: LoggedSet[];
}

export interface ProgressionResult {
  workoutExerciseId: string;
  exerciseId: string;
  triggered: boolean;
}

/**
 * FD-04: "Si el usuario completa el 100% de las series programadas en 2 semanas
 * consecutivas → incrementar en 1 rep por serie". Opera por ejercicio prescrito
 * (WorkoutExercise) dentro del mismo día de la rutina.
 *
 * "2 semanas consecutivas" se interpreta como las 2 ejecuciones más recientes de
 * ese ejercicio dentro del mismo programa (incluyendo la sesión que se acaba de
 * completar), ya que la frecuencia semanal del programa ya fija el día por semana.
 */
@Injectable()
export class ProgressionEngine {
  /**
   * @param currentSessionLogs sets de la sesión que se acaba de completar
   * @param previousSessionLogs sets de la ejecución previa más reciente del mismo día (puede no existir)
   */
  evaluate(
    prescriptions: PrescribedExercise[],
    currentSessionLogs: LoggedSet[],
    previousSessionLogs: LoggedSet[] | null,
  ): ProgressionResult[] {
    return prescriptions.map((prescription) => {
      const currentComplete = this.isExerciseComplete(prescription, currentSessionLogs);
      const previousComplete = previousSessionLogs
        ? this.isExerciseComplete(prescription, previousSessionLogs)
        : false;

      return {
        workoutExerciseId: prescription.workoutExerciseId,
        exerciseId: prescription.exerciseId,
        triggered: currentComplete && previousComplete,
      };
    });
  }

  /** 100% de las series programadas = todas las series registradas alcanzan o superan repsTarget. */
  private isExerciseComplete(prescription: PrescribedExercise, logs: LoggedSet[]): boolean {
    const setsForExercise = logs.filter((log) => log.exerciseId === prescription.exerciseId);
    if (setsForExercise.length < prescription.sets) return false;
    return setsForExercise.every((log) => log.repsCompleted >= prescription.repsTarget);
  }
}
