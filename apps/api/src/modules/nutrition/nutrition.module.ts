import { Module } from '@nestjs/common';
import { TdeeCalculatorEngine } from './engines/tdee-calculator.engine';
import { MacroCalculatorEngine } from './engines/macro-calculator.engine';
import { UsdaApiAdapter } from './adapters/usda-api.adapter';
import { FoodsRepository } from './repositories/foods.repository';
import { FoodDiaryRepository } from './repositories/food-diary.repository';
import { GoalTargetsRepository } from './repositories/goal-targets.repository';
import { GetNutritionTargetsUseCase } from './use-cases/get-nutrition-targets.use-case';
import { SearchFoodUseCase } from './use-cases/search-food.use-case';
import { LogFoodUseCase } from './use-cases/log-food.use-case';
import { GetFoodDiaryUseCase } from './use-cases/get-food-diary.use-case';
import { UpdateFoodEntryUseCase } from './use-cases/update-food-entry.use-case';
import { DeleteFoodEntryUseCase } from './use-cases/delete-food-entry.use-case';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';

/**
 * S4 — Nutrición (FD-INFRA-01 semanas 7-8): targets nutricionales (FD-05/FD-06),
 * diario de alimentos CRUD, búsqueda de alimentos (USDA + base local curada).
 *
 * TdeeCalculatorEngine/MacroCalculatorEngine promovidos desde assessment/ (S2)
 * sin cambiar su interfaz pública — AssessmentModule los sigue usando vía este módulo.
 *
 * Fuera de alcance de S4 (documentado, no es un olvido):
 *   - AutoAdjustEngine (FD-09): nadie lo consume aún — requiere AIModule/CALI (S5b)
 *     para presentar la sugerencia al usuario. Se construye junto con CALI.
 *   - Planificador de comidas, recetas, escaneo por foto, código de barras: excluidos
 *     de v1.0 por FD-10/MVP.md §6.5. `log_food` por texto libre (CALI) también es S5b.
 *   - goals.repository.ts (CRUD completo de Goal): pertenece a BodyModule
 *     (BackendArchitecture.md), no construido aún. Lectura mínima vía GoalTargetsRepository.
 */
@Module({
  controllers: [NutritionController],
  providers: [
    TdeeCalculatorEngine,
    MacroCalculatorEngine,
    UsdaApiAdapter,
    FoodsRepository,
    FoodDiaryRepository,
    GoalTargetsRepository,
    GetNutritionTargetsUseCase,
    SearchFoodUseCase,
    LogFoodUseCase,
    GetFoodDiaryUseCase,
    UpdateFoodEntryUseCase,
    DeleteFoodEntryUseCase,
    NutritionService,
  ],
  exports: [TdeeCalculatorEngine, MacroCalculatorEngine, NutritionService],
})
export class NutritionModule {}
