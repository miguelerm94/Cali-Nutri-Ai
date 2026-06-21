import { Injectable } from '@nestjs/common';

export interface HydrationTargetBreakdown {
  baseMl: number;
  activityAdjustmentMl: number;
  stepsAdjustmentMl: number;
  targetMl: number;
}

/**
 * FD-07 — fórmula canónica v1.0 (sin ajuste por clima, diferido a v2.0/WeatherKit):
 *   base_ml = peso_kg × 40
 *   + 500 ml si hay sesión de entrenamiento hoy (750 ml si fue alta intensidad,
 *     subjective_fatigue >= 8 — único dato de intensidad disponible en S3)
 *   + 250 ml si pasos_hoy > 10000 (requiere HealthSync, no construido hasta S6a;
 *     `stepsToday` queda undefined y el ajuste es 0 hasta entonces)
 */
@Injectable()
export class HydrationTargetEngine {
  calculate(weightKg: number, hadSessionToday: boolean, highIntensity: boolean, stepsToday?: number): HydrationTargetBreakdown {
    const baseMl = Math.round(weightKg * 40);
    const activityAdjustmentMl = hadSessionToday ? (highIntensity ? 750 : 500) : 0;
    const stepsAdjustmentMl = stepsToday != null && stepsToday > 10000 ? 250 : 0;
    const targetMl = baseMl + activityAdjustmentMl + stepsAdjustmentMl;

    return { baseMl, activityAdjustmentMl, stepsAdjustmentMl, targetMl };
  }
}
