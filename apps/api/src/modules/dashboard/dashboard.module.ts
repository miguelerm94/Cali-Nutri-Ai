import { Module } from '@nestjs/common';
import { TrainingModule } from '../training/training.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { HydrationModule } from '../hydration/hydration.module';
import { GetDashboardSummaryUseCase } from './use-cases/get-dashboard-summary.use-case';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

/**
 * S5a — Dashboard (FD-INFRA-01 semana 9): `GET /dashboard/summary` agrega
 * Training + Nutrition + Hydration en una sola llamada (BackendArchitecture.md:
 * "importa TrainingModule, NutritionModule, HydrationModule, HealthSyncModule").
 * HealthSyncModule no existe aún (S6a) — el bloque `health_sync` de API.md
 * se omite hasta entonces. `/dashboard/weekly` y `/dashboard/goals` quedan
 * para una iteración posterior de S5a si el tiempo del sprint lo permite.
 */
@Module({
  imports: [TrainingModule, NutritionModule, HydrationModule],
  controllers: [DashboardController],
  providers: [GetDashboardSummaryUseCase, DashboardService],
})
export class DashboardModule {}
