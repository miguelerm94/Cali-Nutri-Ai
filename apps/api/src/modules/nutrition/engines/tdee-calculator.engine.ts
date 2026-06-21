import { Injectable } from '@nestjs/common';
import { Sex } from '@prisma/client';

/**
 * Motor TMB/TDEE — FD-05 (FinalDecisions.md Sección 2, fórmula única autorizada).
 * Promovido desde assessment/engines/ en S4 (NutritionModule), sin cambiar su
 * interfaz pública — AssessmentModule lo sigue usando vía import de NutritionModule.
 */
@Injectable()
export class TdeeCalculatorEngine {
  /** Mifflin-St Jeor — única fórmula autorizada (FD-05). */
  calculateTmb(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    return sex === Sex.male ? base + 5 : base - 161;
  }

  /**
   * Factor de actividad — tabla canónica FD-05. El usuario NUNCA selecciona el
   * factor manualmente; se deriva de `training_frequency` (días/semana, 0–7).
   * El valor 7 no está tabulado explícitamente en FD-05 (la tabla llega hasta
   * "5–6 → 1.725" y "doble sesión diaria → 1.9") — se asigna 1.9 por ser el
   * extremo superior del rango semanal, consistente con "muy activo".
   */
  activityFactor(trainingFrequency: number): number {
    if (trainingFrequency <= 0) return 1.2;
    if (trainingFrequency <= 2) return 1.375;
    if (trainingFrequency <= 4) return 1.55;
    if (trainingFrequency <= 6) return 1.725;
    return 1.9; // 7 días/semana
  }

  calculateTdee(sex: Sex, weightKg: number, heightCm: number, ageYears: number, trainingFrequency: number): number {
    const tmb = this.calculateTmb(sex, weightKg, heightCm, ageYears);
    return Math.round(tmb * this.activityFactor(trainingFrequency));
  }
}
