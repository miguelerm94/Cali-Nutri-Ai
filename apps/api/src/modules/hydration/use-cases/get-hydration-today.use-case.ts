import { Injectable } from '@nestjs/common';
import { WaterLogsRepository } from '../repositories/water-logs.repository';
import { GetHydrationTargetUseCase } from './get-hydration-target.use-case';
import { hydrationStatus, startOfUtcDay } from './hydration.util';

/** GET /hydration/today (API.md §7). */
@Injectable()
export class GetHydrationTodayUseCase {
  constructor(
    private readonly waterLogsRepository: WaterLogsRepository,
    private readonly getHydrationTargetUseCase: GetHydrationTargetUseCase,
  ) {}

  async execute(userId: string) {
    const from = startOfUtcDay(new Date());
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);

    const [logs, target] = await Promise.all([
      this.waterLogsRepository.findByUserAndRange(userId, from, to),
      this.getHydrationTargetUseCase.execute(userId, from, to),
    ]);

    const consumedMl = logs.reduce((sum, l) => sum + l.amountMl, 0);
    const remainingMl = Math.max(target.targetMl - consumedMl, 0);
    const percentCompleted = target.targetMl > 0 ? Math.round((consumedMl / target.targetMl) * 1000) / 10 : 0;

    return {
      date: from.toISOString().slice(0, 10),
      target_ml: target.targetMl,
      consumed_ml: consumedMl,
      remaining_ml: remainingMl,
      percent_completed: percentCompleted,
      status: hydrationStatus(percentCompleted),
      logs: logs.map((l) => ({ id: l.id, amount_ml: l.amountMl, logged_at: l.createdAt })),
      target_breakdown: {
        base_ml: target.baseMl,
        activity_adjustment_ml: target.activityAdjustmentMl,
        steps_adjustment_ml: target.stepsAdjustmentMl,
      },
    };
  }
}
