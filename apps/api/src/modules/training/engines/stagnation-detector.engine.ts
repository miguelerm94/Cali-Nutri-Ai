import { Injectable } from '@nestjs/common';

export interface SessionVolumeInput {
  startedAt: Date;
  /** Suma de reps_completed de todos los logs de la sesión. */
  totalRepsCompleted: number;
  /** Suma de (sets * repsTarget) de la prescripción del día — "objetivo" de la sesión. */
  totalRepsTarget: number;
}

export interface StagnationResult {
  alert: boolean;
  detectedAt: Date | null;
  reason: 'no_improvement_3_weeks' | 'performance_drop_2_weeks' | null;
}

interface WeeklyVolume {
  weekKey: string;
  weekStart: Date;
  sessionsCount: number;
  totalRepsCompleted: number;
  totalRepsTarget: number;
}

/**
 * FD-02: Detección pasiva de estancamiento — sin acción automática en v1.0.
 *
 * Definición oficial:
 *   - Sin mejora (sin incremento de reps o series) durante 3 semanas consecutivas
 *     de entrenamiento activo (mínimo 2 sesiones/semana), O
 *   - Reducción de rendimiento (reps < objetivo) durante 2 semanas consecutivas.
 *
 * Opera sobre el historial de sesiones COMPLETADAS de un programa (más recientes
 * primero). El volumen semanal (suma de reps completadas) es el indicador de
 * "mejora"; el objetivo prescrito (sets * repsTarget) es la referencia para
 * "reducción de rendimiento".
 */
@Injectable()
export class StagnationDetectorEngine {
  detect(sessions: SessionVolumeInput[]): StagnationResult {
    const weeks = this.groupByIsoWeek(sessions);
    const activeWeeks = weeks.filter((w) => w.sessionsCount >= 2).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());

    const dropWeeks = activeWeeks.slice(0, 2);
    if (dropWeeks.length === 2 && dropWeeks.every((w) => w.totalRepsCompleted < w.totalRepsTarget)) {
      return { alert: true, detectedAt: new Date(), reason: 'performance_drop_2_weeks' };
    }

    const plateauWeeks = activeWeeks.slice(0, 3);
    if (plateauWeeks.length === 3 && this.isNonIncreasing(plateauWeeks)) {
      return { alert: true, detectedAt: new Date(), reason: 'no_improvement_3_weeks' };
    }

    return { alert: false, detectedAt: null, reason: null };
  }

  /** Más reciente → más antigua: cada semana no debe superar el volumen de la semana inmediatamente anterior. */
  private isNonIncreasing(weeksDesc: WeeklyVolume[]): boolean {
    for (let i = 0; i < weeksDesc.length - 1; i++) {
      const recent = weeksDesc[i];
      const older = weeksDesc[i + 1];
      if (recent.totalRepsCompleted > older.totalRepsCompleted) return false;
    }
    return true;
  }

  private groupByIsoWeek(sessions: SessionVolumeInput[]): WeeklyVolume[] {
    const map = new Map<string, WeeklyVolume>();
    for (const session of sessions) {
      const weekStart = this.isoWeekStart(session.startedAt);
      const weekKey = weekStart.toISOString();
      const existing = map.get(weekKey);
      if (existing) {
        existing.sessionsCount += 1;
        existing.totalRepsCompleted += session.totalRepsCompleted;
        existing.totalRepsTarget += session.totalRepsTarget;
      } else {
        map.set(weekKey, {
          weekKey,
          weekStart,
          sessionsCount: 1,
          totalRepsCompleted: session.totalRepsCompleted,
          totalRepsTarget: session.totalRepsTarget,
        });
      }
    }
    return Array.from(map.values());
  }

  /** Lunes 00:00:00 UTC de la semana ISO de la fecha dada. */
  private isoWeekStart(date: Date): Date {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayOfWeek = d.getUTCDay() || 7; // domingo=0 → 7
    d.setUTCDate(d.getUTCDate() - (dayOfWeek - 1));
    return d;
  }
}
