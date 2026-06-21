import { Injectable } from '@nestjs/common';
import { PresentationLevel } from '@prisma/client';

export interface MovementScores {
  pullupsScore: number;
  pushupsScore: number;
  squatsScore: number;
  coreScore: number;
  globalScore: number;
  presentationLevel: PresentationLevel;
}

/** Interpola linealmente `value` dentro de un tramo [repsFrom, repsTo] → [scoreFrom, scoreTo]. */
function interpolate(value: number, repsFrom: number, repsTo: number, scoreFrom: number, scoreTo: number): number {
  if (repsTo === repsFrom) return scoreTo;
  const ratio = Math.min(Math.max((value - repsFrom) / (repsTo - repsFrom), 0), 1);
  return scoreFrom + ratio * (scoreTo - scoreFrom);
}

/**
 * Motor de puntuación de la evaluación inicial (FD-01, FinalDecisions.md Sección 1).
 *
 * Dominadas y Flexiones usan las tablas canónicas explícitas de FD-01.
 * Sentadillas y Plancha (Core) NO tienen tabla de puntuación continua explícita
 * en FinalDecisions.md — se construyen interpolando dentro de las 3 bandas de
 * MVP.md §5.1 (Principiante/Intermedio/Avanzado), usando el mismo método de
 * interpolación que FD-01 aplica a Dominadas/Flexiones. Documentado para
 * revisión futura del equipo de ciencia del deporte.
 */
@Injectable()
export class AssessmentScoringEngine {
  /** Tabla canónica FD-01 — Dominadas. */
  scorePullups(reps: number): number {
    if (reps <= 0) return 0;
    if (reps <= 3) return interpolate(reps, 1, 3, 10, 25);
    if (reps <= 7) return interpolate(reps, 4, 7, 30, 50);
    if (reps <= 12) return interpolate(reps, 8, 12, 55, 70);
    if (reps <= 20) return interpolate(reps, 13, 20, 75, 90);
    return Math.min(95 + (reps - 20) * 0.5, 100);
  }

  /** Tabla canónica FD-01 — Flexiones. */
  scorePushups(reps: number): number {
    if (reps <= 5) return interpolate(reps, 0, 5, 0, 10);
    if (reps <= 15) return interpolate(reps, 6, 15, 15, 30);
    if (reps <= 30) return interpolate(reps, 16, 30, 35, 55);
    if (reps <= 50) return interpolate(reps, 31, 50, 60, 75);
    if (reps <= 75) return interpolate(reps, 51, 75, 80, 90);
    return Math.min(95 + (reps - 75) * 0.2, 100);
  }

  /**
   * Sentadillas — bandas de MVP.md §5.1 (0–19 Principiante, 20–40 Intermedio, 41+ Avanzado)
   * interpoladas a los umbrales de presentación de FinalDecisions (0–54/55–74/75–100).
   * Saturación en 70 reps = 100 pts.
   */
  scoreSquats(reps: number): number {
    if (reps <= 19) return interpolate(reps, 0, 19, 0, 54);
    if (reps <= 40) return interpolate(reps, 20, 40, 55, 74);
    return Math.min(interpolate(reps, 41, 70, 75, 100), 100);
  }

  /**
   * Core (Plancha en segundos) — bandas de MVP.md §5.1 (0–29s/30–60s/61s+)
   * interpoladas igual que Sentadillas. Saturación en 120s = 100 pts.
   */
  scoreCore(plankSeconds: number): number {
    if (plankSeconds <= 29) return interpolate(plankSeconds, 0, 29, 0, 54);
    if (plankSeconds <= 60) return interpolate(plankSeconds, 30, 60, 55, 74);
    return Math.min(interpolate(plankSeconds, 61, 120, 75, 100), 100);
  }

  /** global_score = dominadas*0.40 + flexiones*0.30 + sentadillas*0.15 + core*0.15 (FD-01). */
  computeAll(input: { pullupsMax: number; pushupsMax: number; squatsMax: number; plankSeconds: number }): MovementScores {
    const pullupsScore = this.scorePullups(input.pullupsMax);
    const pushupsScore = this.scorePushups(input.pushupsMax);
    const squatsScore = this.scoreSquats(input.squatsMax);
    const coreScore = this.scoreCore(input.plankSeconds);

    const globalScore = pullupsScore * 0.4 + pushupsScore * 0.3 + squatsScore * 0.15 + coreScore * 0.15;

    return {
      pullupsScore: round2(pullupsScore),
      pushupsScore: round2(pushupsScore),
      squatsScore: round2(squatsScore),
      coreScore: round2(coreScore),
      globalScore: round2(globalScore),
      presentationLevel: this.toPresentationLevel(globalScore),
    };
  }

  /** Umbrales canónicos: 0-54 Principiante, 55-74 Intermedio, 75-100 Avanzado. */
  toPresentationLevel(globalScore: number): PresentationLevel {
    if (globalScore >= 75) return PresentationLevel.advanced;
    if (globalScore >= 55) return PresentationLevel.intermediate;
    return PresentationLevel.beginner;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
