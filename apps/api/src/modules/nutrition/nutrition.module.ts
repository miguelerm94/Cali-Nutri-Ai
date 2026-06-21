import { Module } from '@nestjs/common';
import { TdeeCalculatorEngine } from './engines/tdee-calculator.engine';
import { MacroCalculatorEngine } from './engines/macro-calculator.engine';

/**
 * S4 — Nutrición (FD-INFRA-01 semanas 7-8): targets nutricionales (FD-05/FD-06),
 * diario de alimentos CRUD, búsqueda de alimentos (USDA + base local curada).
 * TdeeCalculatorEngine/MacroCalculatorEngine promovidos desde assessment/ (S2)
 * sin cambiar su interfaz pública — AssessmentModule los sigue usando vía este módulo.
 */
@Module({
  providers: [TdeeCalculatorEngine, MacroCalculatorEngine],
  exports: [TdeeCalculatorEngine, MacroCalculatorEngine],
})
export class NutritionModule {}
