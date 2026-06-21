import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { HydrationTargetEngine, HydrationTargetBreakdown } from '../engines/hydration-target.engine';
import { BodyWeightRepository } from '../repositories/body-weight.repository';
import { WorkoutSessionsRepository } from '../../training/repositories/workout-sessions.repository';
import { GetTodayStepsUseCase } from '../../health-sync/use-cases/get-today-steps.use-case';
import { RedisService } from '../../../infrastructure/redis/redis.service';

const TARGET_CACHE_TTL_SECONDS = 6 * 60 * 60;
const HIGH_INTENSITY_FATIGUE_THRESHOLD = 8;

/**
 * Calcula y cachea el objetivo de hidratación del día (FD-07, FD-DB-02).
 * Cache key `hydration:target:{userId}:{date}`, TTL 6h. Invalidación explícita
 * por cambio de peso o nueva sesión queda diferida (no hay event bus listener
 * aún) — el TTL corto acota la desviación máxima a 6 horas mientras tanto.
 */
@Injectable()
export class GetHydrationTargetUseCase {
  constructor(
    private readonly bodyWeightRepository: BodyWeightRepository,
    private readonly workoutSessionsRepository: WorkoutSessionsRepository,
    private readonly hydrationTargetEngine: HydrationTargetEngine,
    private readonly getTodayStepsUseCase: GetTodayStepsUseCase,
    private readonly redisService: RedisService,
  ) {}

  async execute(userId: string, dayStart: Date, dayEnd: Date): Promise<HydrationTargetBreakdown> {
    const dateKey = dayStart.toISOString().slice(0, 10);
    const cacheKey = `hydration:target:${userId}:${dateKey}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as HydrationTargetBreakdown;
    }

    const weightKg = await this.bodyWeightRepository.findLatestWeightKg(userId);
    if (weightKg == null) {
      throw new NotFoundException({ code: ErrorCode.ASSESSMENT_REQUIRED, message: 'Completa la evaluación inicial para calcular tu objetivo de hidratación.' });
    }

    const sessionsToday = await this.workoutSessionsRepository.findCompletedByUserAndRange(userId, dayStart, dayEnd);
    const hadSessionToday = sessionsToday.length > 0;
    const highIntensity = sessionsToday.some((s) => (s.subjectiveFatigue ?? 0) >= HIGH_INTENSITY_FATIGUE_THRESHOLD);

    const stepsToday = await this.getTodayStepsUseCase.execute(userId, dayStart);
    const breakdown = this.hydrationTargetEngine.calculate(weightKg, hadSessionToday, highIntensity, stepsToday);
    await this.redisService.set(cacheKey, JSON.stringify(breakdown), TARGET_CACHE_TTL_SECONDS);

    return breakdown;
  }
}
