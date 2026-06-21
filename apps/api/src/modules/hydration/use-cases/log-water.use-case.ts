import { Injectable } from '@nestjs/common';
import { WaterLogsRepository } from '../repositories/water-logs.repository';
import { GetHydrationTargetUseCase } from './get-hydration-target.use-case';
import { LogWaterDto } from '../dto/log-water.dto';
import { hydrationStatus, startOfUtcDay } from './hydration.util';

/** POST /hydration/logs (API.md §7). */
@Injectable()
export class LogWaterUseCase {
  constructor(
    private readonly waterLogsRepository: WaterLogsRepository,
    private readonly getHydrationTargetUseCase: GetHydrationTargetUseCase,
  ) {}

  async execute(userId: string, dto: LogWaterDto) {
    const loggedAt = dto.logged_at ? new Date(dto.logged_at) : new Date();
    const log = await this.waterLogsRepository.create(userId, dto.amount_ml, loggedAt);

    const from = startOfUtcDay(loggedAt);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    const [logsToday, target] = await Promise.all([
      this.waterLogsRepository.findByUserAndRange(userId, from, to),
      this.getHydrationTargetUseCase.execute(userId, from, to),
    ]);

    const dailyTotalMl = logsToday.reduce((sum, l) => sum + l.amountMl, 0);
    const remainingMl = Math.max(target.targetMl - dailyTotalMl, 0);
    const percentCompleted = target.targetMl > 0 ? Math.round((dailyTotalMl / target.targetMl) * 1000) / 10 : 0;

    return {
      log: { id: log.id, amount_ml: log.amountMl, logged_at: log.createdAt },
      daily_total_ml: dailyTotalMl,
      target_ml: target.targetMl,
      percent_completed: percentCompleted,
      remaining_ml: remainingMl,
      status: hydrationStatus(percentCompleted),
    };
  }
}
