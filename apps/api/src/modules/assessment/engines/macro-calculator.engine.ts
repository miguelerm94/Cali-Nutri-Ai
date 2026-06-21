import { Injectable } from '@nestjs/common';
import { GoalType } from '@prisma/client';

export interface MacroTargets {
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
}

/**
 * Motor de distribución de macros — FD-06 (FinalDecisions.md Sección 2).
 * Misma nota de ubicación temporal que TdeeCalculatorEngine (se promueve a
 * NutritionModule en S4).
 */
@Injectable()
export class MacroCalculatorEngine {
  /** Ajuste calórico canónico sobre TDEE por tipo de objetivo (valores default de FD-06). */
  private caloricAdjustment(goalType: GoalType): number {
    switch (goalType) {
      case GoalType.muscle_gain:
        return 300; // rango +200 a +400
      case GoalType.fat_loss:
        return -400; // rango -300 a -600
      case GoalType.recomposition:
        return -150; // rango -100 a -250
      case GoalType.maintenance:
      default:
        return 0;
    }
  }

  calculate(tdee: number, weightKg: number, goalType: GoalType): MacroTargets {
    const targetCalories = Math.max(tdee + this.caloricAdjustment(goalType), 1200); // piso de seguridad

    // FD-06: prioridad de cálculo — 1) proteína, 2) grasas, 3) carbohidratos (residual).
    const targetProteinG = round1(weightKg * 2.0); // default 2.0 g/kg (rango 1.8–2.4)
    const targetFatG = round1(weightKg * 0.9); // default 0.9 g/kg (rango 0.8–1.0, mínimo 0.6)

    const proteinKcal = targetProteinG * 4;
    const fatKcal = targetFatG * 9;
    const remainingKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
    const targetCarbsG = round1(remainingKcal / 4);

    return { tdee, targetCalories: Math.round(targetCalories), targetProteinG, targetFatG, targetCarbsG };
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
