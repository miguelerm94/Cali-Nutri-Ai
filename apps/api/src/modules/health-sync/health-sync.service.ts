import { Injectable } from '@nestjs/common';
import { EnqueueHealthSyncUseCase } from './use-cases/enqueue-health-sync.use-case';
import { GetTodayStepsUseCase } from './use-cases/get-today-steps.use-case';
import { SyncHealthDataDto } from './dto/sync-health-data.dto';

@Injectable()
export class HealthSyncService {
  constructor(
    private readonly enqueueHealthSyncUseCase: EnqueueHealthSyncUseCase,
    private readonly getTodayStepsUseCase: GetTodayStepsUseCase,
  ) {}

  sync(userId: string, dto: SyncHealthDataDto) {
    return this.enqueueHealthSyncUseCase.execute(userId, dto);
  }

  async getTodaySteps(userId: string) {
    const today = new Date(new Date().toISOString().slice(0, 10));
    const steps = await this.getTodayStepsUseCase.execute(userId, today);
    return { steps: steps ?? 0 };
  }
}
