import { Module } from '@nestjs/common';
import { TrainingModule } from '../training/training.module';
import { HealthSyncModule } from '../health-sync/health-sync.module';
import { HydrationTargetEngine } from './engines/hydration-target.engine';
import { WaterLogsRepository } from './repositories/water-logs.repository';
import { BodyWeightRepository } from './repositories/body-weight.repository';
import { GetHydrationTargetUseCase } from './use-cases/get-hydration-target.use-case';
import { GetHydrationTodayUseCase } from './use-cases/get-hydration-today.use-case';
import { LogWaterUseCase } from './use-cases/log-water.use-case';
import { DeleteWaterLogUseCase } from './use-cases/delete-water-log.use-case';
import { GetHydrationHistoryUseCase } from './use-cases/get-hydration-history.use-case';
import { HydrationService } from './hydration.service';
import { HydrationController } from './hydration.controller';

/**
 * S5a — Hidratación (FD-INFRA-01 semana 9): cálculo de meta (FD-07, sin ajuste
 * por clima — diferido a v2.0/WeatherKit), registro rápido, historial con racha.
 *
 * Fuera de alcance (documentado, no es un olvido):
 *   - Ajuste por pasos: ya integrado vía HealthSyncModule (S6a) — `steps_today`
 *     viene de `health_data`, queda undefined (ajuste 0) hasta el primer sync.
 *   - PATCH /hydration/target (override manual de API.md): no hay campo en el
 *     schema para persistirlo (FD-DB-02 eliminó WATER_TARGETS) y FD-07 no lo
 *     exige como parte de la fórmula canónica. Diferido a v1.1.
 *   - Alertas/notificaciones de progreso (12:00/18:00/20:00 de FD-07):
 *     pertenecen a NotificationsModule (S6a), no construido aún.
 *   - BodyWeightRepository es lectura mínima temporal — el CRUD completo de
 *     BodyMeasurement pertenece a BodyModule (no construido aún).
 */
@Module({
  imports: [TrainingModule, HealthSyncModule],
  controllers: [HydrationController],
  providers: [
    HydrationTargetEngine,
    WaterLogsRepository,
    BodyWeightRepository,
    GetHydrationTargetUseCase,
    GetHydrationTodayUseCase,
    LogWaterUseCase,
    DeleteWaterLogUseCase,
    GetHydrationHistoryUseCase,
    HydrationService,
  ],
  exports: [HydrationService, GetHydrationTodayUseCase, BodyWeightRepository],
})
export class HydrationModule {}
