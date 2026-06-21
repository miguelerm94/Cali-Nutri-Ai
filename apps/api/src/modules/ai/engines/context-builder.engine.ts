import { Injectable } from '@nestjs/common';
import { NutritionService } from '../../nutrition/nutrition.service';
import { HydrationService } from '../../hydration/hydration.service';
import { GetTodayUseCase } from '../../training/use-cases/get-today.use-case';
import { WorkoutSessionsRepository } from '../../training/repositories/workout-sessions.repository';

const SYSTEM_PROMPT = `Eres CALI, coach de calistenia y nutrición de CALI-NUTRI AI. Hablas en español, directo y motivador, basado en evidencia científica. Usas las herramientas disponibles para registrar datos del usuario cuando te lo pida explícitamente (comida, agua, series, finalizar sesión). Nunca inventes valores nutricionales o de entrenamiento — si no encuentras el dato, dilo.`;

/**
 * FD-ARCH-03: contexto fijo por request (no hay pipeline de resumen histórico
 * comprimido de 200 tokens — esa pieza queda diferida, fuera del alcance de S5b).
 * Presupuestos de tokens son orientativos, no se truncan duro aquí porque los
 * datos reales (10 sesiones, 14 días de diario, 3 medidas) ya caben holgadamente.
 */
@Injectable()
export class ContextBuilderEngine {
  constructor(
    private readonly nutritionService: NutritionService,
    private readonly hydrationService: HydrationService,
    private readonly getTodayUseCase: GetTodayUseCase,
    private readonly sessionsRepository: WorkoutSessionsRepository,
  ) {}

  getSystemPrompt(): string {
    return SYSTEM_PROMPT;
  }

  async buildUserContext(userId: string): Promise<string> {
    const [targets, diaryToday, hydrationToday, today, recentSessions] = await Promise.all([
      this.nutritionService.getTargets(userId).catch(() => null),
      this.nutritionService.getDiaryToday(userId).catch(() => null),
      this.hydrationService.getToday(userId).catch(() => null),
      this.getTodayUseCase.execute(userId).catch(() => null),
      this.sessionsRepository.findHistoryByUser(userId, { from: new Date(0), to: new Date(), limit: 10 }).catch(() => []),
    ]);

    const lines: string[] = [];

    if (targets) {
      lines.push(
        `Objetivo nutricional: ${targets.goal_type}, ${targets.targets.calories_kcal} kcal/día, ` +
          `${targets.targets.protein_g}g proteína, ${targets.targets.carbs_g}g carbos, ${targets.targets.fat_g}g grasa.`,
      );
    } else {
      lines.push('El usuario aún no tiene objetivos nutricionales calculados (onboarding incompleto).');
    }

    if (diaryToday) {
      lines.push(
        `Hoy ha consumido ${diaryToday.summary.calories.consumed} kcal` +
          (diaryToday.summary.calories.target != null ? ` de ${diaryToday.summary.calories.target} kcal objetivo.` : '.'),
      );
    }

    if (hydrationToday) {
      lines.push(`Hidratación hoy: ${hydrationToday.consumed_ml}ml de ${hydrationToday.target_ml}ml objetivo.`);
    }

    if (today?.has_workout_today) {
      lines.push(
        `Entrenamiento de hoy: ${today.workout_day?.day_name ?? 'desconocido'}.` +
          (today.active_session_id ? ' Tiene una sesión activa en curso.' : today.completed_today ? ' Ya la completó hoy.' : ' Aún no la inicia.'),
      );
    } else {
      lines.push('No tiene un programa de entrenamiento activo.');
    }

    if (recentSessions.length > 0) {
      lines.push(`Últimas ${recentSessions.length} sesiones completadas registradas en el historial.`);
    }

    return lines.join('\n');
  }
}
