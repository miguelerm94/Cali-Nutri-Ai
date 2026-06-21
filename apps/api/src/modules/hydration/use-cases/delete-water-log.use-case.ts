import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { WaterLogsRepository } from '../repositories/water-logs.repository';
import { GetHydrationTargetUseCase } from './get-hydration-target.use-case';
import { startOfUtcDay } from './hydration.util';

/** DELETE /hydration/logs/:log_id (API.md §7). */
@Injectable()
export class DeleteWaterLogUseCase {
  constructor(
    private readonly waterLogsRepository: WaterLogsRepository,
    private readonly getHydrationTargetUseCase: GetHydrationTargetUseCase,
  ) {}

  async execute(userId: string, logId: string) {
    const log = await this.waterLogsRepository.findById(logId);
    if (!log) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'Registro de agua no encontrado.' });
    }
    if (log.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No puedes eliminar este registro.' });
    }

    await this.waterLogsRepository.delete(logId);

    const from = startOfUtcDay(log.createdAt);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    const [logsToday, target] = await Promise.all([
      this.waterLogsRepository.findByUserAndRange(userId, from, to),
      this.getHydrationTargetUseCase.execute(userId, from, to),
    ]);

    const dailyTotalMl = logsToday.reduce((sum, l) => sum + l.amountMl, 0);
    const percentCompleted = target.targetMl > 0 ? Math.round((dailyTotalMl / target.targetMl) * 1000) / 10 : 0;

    return { daily_total_ml: dailyTotalMl, percent_completed: percentCompleted };
  }
}
