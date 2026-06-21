import { Injectable } from '@nestjs/common';
import { WaterLogsRepository } from '../repositories/water-logs.repository';
import { GetHydrationTargetUseCase } from './get-hydration-target.use-case';
import { HydrationHistoryQueryDto } from '../dto/hydration-history-query.dto';
import { startOfUtcDay } from './hydration.util';

const DEFAULT_WINDOW_DAYS = 30;

/** GET /hydration/history (API.md §7) — incluye racha de días con meta cumplida (FD-INFRA-01 S5a). */
@Injectable()
export class GetHydrationHistoryUseCase {
  constructor(
    private readonly waterLogsRepository: WaterLogsRepository,
    private readonly getHydrationTargetUseCase: GetHydrationTargetUseCase,
  ) {}

  async execute(userId: string, query: HydrationHistoryQueryDto) {
    const to = query.to ? startOfUtcDay(new Date(`${query.to}T00:00:00.000Z`)) : startOfUtcDay(new Date());
    const from = query.from
      ? startOfUtcDay(new Date(`${query.from}T00:00:00.000Z`))
      : new Date(to.getTime() - (DEFAULT_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000);

    const days: { date: string; from: Date; to: Date }[] = [];
    for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      days.push({ date: d.toISOString().slice(0, 10), from: d, to: new Date(d.getTime() + 24 * 60 * 60 * 1000) });
    }

    const history = await Promise.all(
      days.map(async (day) => {
        const [logs, target] = await Promise.all([
          this.waterLogsRepository.findByUserAndRange(userId, day.from, day.to),
          this.getHydrationTargetUseCase.execute(userId, day.from, day.to),
        ]);
        const consumedMl = logs.reduce((sum, l) => sum + l.amountMl, 0);
        const percent = target.targetMl > 0 ? Math.round((consumedMl / target.targetMl) * 1000) / 10 : 0;
        return { date: day.date, target_ml: target.targetMl, consumed_ml: consumedMl, percent, goal_met: consumedMl >= target.targetMl };
      }),
    );

    history.reverse(); // más reciente primero, como API.md

    const daysGoalMet = history.filter((h) => h.goal_met).length;
    const avgDailyMl = history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.consumed_ml, 0) / history.length) : 0;

    return {
      history: history.slice(0, query.limit),
      summary: {
        days_goal_met: daysGoalMet,
        days_total: history.length,
        goal_met_rate_percent: history.length > 0 ? Math.round((daysGoalMet / history.length) * 1000) / 10 : 0,
        avg_daily_ml: avgDailyMl,
        best_streak_days: this.bestStreak(history),
        current_streak_days: this.currentStreak(history),
      },
    };
  }

  private bestStreak(history: { goal_met: boolean }[]): number {
    let best = 0;
    let current = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      current = history[i].goal_met ? current + 1 : 0;
      best = Math.max(best, current);
    }
    return best;
  }

  private currentStreak(history: { goal_met: boolean }[]): number {
    let streak = 0;
    for (const day of history) {
      if (!day.goal_met) break;
      streak++;
    }
    return streak;
  }
}
