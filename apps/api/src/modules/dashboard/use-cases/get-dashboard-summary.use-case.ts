import { Injectable, NotFoundException } from '@nestjs/common';
import { GetTodayUseCase } from '../../training/use-cases/get-today.use-case';
import { WorkoutSessionsRepository } from '../../training/repositories/workout-sessions.repository';
import { NutritionService } from '../../nutrition/nutrition.service';
import { HydrationService } from '../../hydration/hydration.service';
import { BodyWeightRepository } from '../../hydration/repositories/body-weight.repository';

const STREAK_LOOKBACK_DAYS = 60;

/**
 * GET /dashboard/summary (API.md §8) — agrega training/nutrition/hydration/body
 * en una sola llamada. `health_sync` (pasos, calorías activas) y `ai_coach`
 * (insight de CALI) se omiten — pertenecen a HealthSyncModule/AIModule,
 * no construidos hasta S5b/S6a. `/dashboard/weekly` y `/dashboard/goals`
 * (API.md) quedan fuera de esta primera entrega de S5a por foco de sprint.
 */
@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    private readonly getTodayUseCase: GetTodayUseCase,
    private readonly workoutSessionsRepository: WorkoutSessionsRepository,
    private readonly nutritionService: NutritionService,
    private readonly hydrationService: HydrationService,
    private readonly bodyWeightRepository: BodyWeightRepository,
  ) {}

  async execute(userId: string) {
    const [training, nutrition, hydration, body] = await Promise.all([
      this.buildTraining(userId),
      this.buildNutrition(userId),
      this.buildHydration(userId),
      this.buildBody(userId),
    ]);

    return {
      date: new Date().toISOString().slice(0, 10),
      training,
      nutrition,
      hydration,
      body,
    };
  }

  private async buildTraining(userId: string) {
    const today = await this.getTodayUseCase.execute(userId);
    const streakDays = await this.computeStreak(userId);
    return {
      has_workout_today: today.has_workout_today,
      workout_completed: today.completed_today,
      workout: today.workout_day,
      streak_days: streakDays,
    };
  }

  private async buildNutrition(userId: string) {
    const [diary, targets] = await Promise.all([
      this.nutritionService.getDiaryToday(userId),
      this.nutritionService.getTargets(userId).catch((err) => {
        if (err instanceof NotFoundException) return null;
        throw err;
      }),
    ]);
    return { summary: diary.summary, meals_logged: Object.values(diary.by_meal).filter((m) => m.calories_kcal > 0).length, targets };
  }

  private async buildHydration(userId: string) {
    const today = await this.hydrationService.getToday(userId).catch((err) => {
      if (err instanceof NotFoundException) return null;
      throw err;
    });
    if (!today) return null;
    return {
      consumed_ml: today.consumed_ml,
      target_ml: today.target_ml,
      remaining_ml: today.remaining_ml,
      percent: today.percent_completed,
      status: today.status,
    };
  }

  private async buildBody(userId: string) {
    const latest = await this.bodyWeightRepository.findLatestMeasurement(userId);
    if (!latest?.weightKg) return null;
    const daysSince = Math.floor((Date.now() - latest.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    return { last_weight_kg: Number(latest.weightKg), last_measured_at: latest.createdAt.toISOString().slice(0, 10), days_since_last_measurement: daysSince };
  }

  private async computeStreak(userId: string): Promise<number> {
    const to = new Date();
    const from = new Date(to.getTime() - STREAK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const sessions = await this.workoutSessionsRepository.findCompletedByUserAndRange(userId, from, to);

    const trainedDates = new Set(sessions.map((s) => s.startedAt.toISOString().slice(0, 10)));
    let streak = 0;
    const cursor = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
    while (trainedDates.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return streak;
  }
}
