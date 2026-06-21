import { Injectable } from '@nestjs/common';
import { GetHydrationTodayUseCase } from './use-cases/get-hydration-today.use-case';
import { LogWaterUseCase } from './use-cases/log-water.use-case';
import { DeleteWaterLogUseCase } from './use-cases/delete-water-log.use-case';
import { GetHydrationHistoryUseCase } from './use-cases/get-hydration-history.use-case';
import { LogWaterDto } from './dto/log-water.dto';
import { HydrationHistoryQueryDto } from './dto/hydration-history-query.dto';

@Injectable()
export class HydrationService {
  constructor(
    private readonly getHydrationTodayUseCase: GetHydrationTodayUseCase,
    private readonly logWaterUseCase: LogWaterUseCase,
    private readonly deleteWaterLogUseCase: DeleteWaterLogUseCase,
    private readonly getHydrationHistoryUseCase: GetHydrationHistoryUseCase,
  ) {}

  getToday(userId: string) {
    return this.getHydrationTodayUseCase.execute(userId);
  }

  logWater(userId: string, dto: LogWaterDto) {
    return this.logWaterUseCase.execute(userId, dto);
  }

  deleteWaterLog(userId: string, logId: string) {
    return this.deleteWaterLogUseCase.execute(userId, logId);
  }

  getHistory(userId: string, query: HydrationHistoryQueryDto) {
    return this.getHydrationHistoryUseCase.execute(userId, query);
  }
}
