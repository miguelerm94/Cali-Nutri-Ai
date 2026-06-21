import { Injectable, Logger } from '@nestjs/common';
import { MealType } from '@prisma/client';
import { NutritionService } from '../../nutrition/nutrition.service';
import { HydrationService } from '../../hydration/hydration.service';
import { WorkoutSessionsRepository } from '../../training/repositories/workout-sessions.repository';
import { LogSetUseCase } from '../../training/use-cases/log-set.use-case';
import { CompleteSessionUseCase } from '../../training/use-cases/complete-session.use-case';

export interface ToolCallRequest {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolCallResult {
  tool_use_id: string;
  content: string;
  isError: boolean;
}

/**
 * Ejecuta los 6 tools canónicos de FD-ARCH-05. Cada tool es un wrapper delgado
 * sobre use-cases/servicios ya construidos en S3/S4/S5a — nunca duplica lógica
 * de negocio (cálculo de macros, progresión, RPE, etc.).
 */
@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly nutritionService: NutritionService,
    private readonly hydrationService: HydrationService,
    private readonly sessionsRepository: WorkoutSessionsRepository,
    private readonly logSetUseCase: LogSetUseCase,
    private readonly completeSessionUseCase: CompleteSessionUseCase,
  ) {}

  async execute(userId: string, call: ToolCallRequest): Promise<ToolCallResult> {
    try {
      const result = await this.dispatch(userId, call);
      return { tool_use_id: call.id, content: JSON.stringify(result), isError: false };
    } catch (error) {
      this.logger.warn(`Tool ${call.name} falló: ${(error as Error).message}`);
      return {
        tool_use_id: call.id,
        content: JSON.stringify({ error: (error as Error).message ?? 'No se pudo ejecutar la acción.' }),
        isError: true,
      };
    }
  }

  private dispatch(userId: string, call: ToolCallRequest): Promise<unknown> {
    switch (call.name) {
      case 'log_food':
        return this.logFood(userId, call.input as { food_name: string; quantity_g: number; meal_type: string });
      case 'log_water':
        return this.hydrationService.logWater(userId, { amount_ml: call.input.amount_ml as number });
      case 'log_workout_set':
        return this.logWorkoutSet(userId, call.input as { exercise_name: string; set_number: number; reps_completed: number; rpe?: number });
      case 'get_daily_summary':
        return this.getDailySummary(userId);
      case 'calculate_meal':
        return this.calculateMeal(call.input as { items: { food_name: string; quantity_g: number }[] });
      case 'complete_workout_session':
        return this.completeWorkoutSession(userId, call.input as { subjective_fatigue?: number });
      default:
        throw new Error(`Tool desconocido: ${call.name}`);
    }
  }

  private async logFood(userId: string, input: { food_name: string; quantity_g: number; meal_type: string }) {
    const matches = await this.nutritionService.searchFoods(input.food_name, 1);
    const food = matches[0];
    if (!food) {
      throw new Error(`No encontré "${input.food_name}" en la base de alimentos.`);
    }
    return this.nutritionService.logFood(userId, {
      food_id: food.id,
      quantity_g: input.quantity_g,
      meal_type: input.meal_type as MealType,
    });
  }

  private async logWorkoutSet(
    userId: string,
    input: { exercise_name: string; set_number: number; reps_completed: number; rpe?: number },
  ) {
    const session = await this.sessionsRepository.findActiveByUser(userId);
    if (!session) {
      throw new Error('No tienes una sesión de entrenamiento activa.');
    }
    const detail = await this.sessionsRepository.findById(session.id);
    const workoutExercise = detail?.workoutDay?.workoutExercises.find((we) =>
      we.exercise.name.toLowerCase().includes(input.exercise_name.toLowerCase()),
    );
    if (!workoutExercise) {
      throw new Error(`"${input.exercise_name}" no está en la rutina de hoy.`);
    }
    return this.logSetUseCase.execute(userId, session.id, {
      workout_exercise_id: workoutExercise.id,
      set_number: input.set_number,
      reps_completed: input.reps_completed,
      rpe: input.rpe,
    });
  }

  private async getDailySummary(userId: string) {
    const [nutrition, hydration] = await Promise.all([
      this.nutritionService.getDiaryToday(userId).catch(() => null),
      this.hydrationService.getToday(userId).catch(() => null),
    ]);
    return { nutrition, hydration };
  }

  private async calculateMeal(input: { items: { food_name: string; quantity_g: number }[] }) {
    type MealItemResult =
      | { food_name: string; found: false }
      | {
          food_name: string;
          found: true;
          quantity_g: number;
          calories_kcal: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
        };

    const results: MealItemResult[] = await Promise.all(
      input.items.map(async (item): Promise<MealItemResult> => {
        const matches = await this.nutritionService.searchFoods(item.food_name, 1);
        const food = matches[0];
        if (!food) return { food_name: item.food_name, found: false };
        const factor = item.quantity_g / 100;
        return {
          food_name: food.name,
          found: true,
          quantity_g: item.quantity_g,
          calories_kcal: Math.round(food.per_100g.calories_kcal * factor * 100) / 100,
          protein_g: Math.round(food.per_100g.protein_g * factor * 100) / 100,
          carbs_g: Math.round(food.per_100g.carbs_g * factor * 100) / 100,
          fat_g: Math.round(food.per_100g.fat_g * factor * 100) / 100,
        };
      }),
    );
    const totals = { calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    for (const r of results) {
      if (!r.found) continue;
      totals.calories_kcal += r.calories_kcal;
      totals.protein_g += r.protein_g;
      totals.carbs_g += r.carbs_g;
      totals.fat_g += r.fat_g;
    }
    return { items: results, totals };
  }

  private async completeWorkoutSession(userId: string, input: { subjective_fatigue?: number }) {
    const session = await this.sessionsRepository.findActiveByUser(userId);
    if (!session) {
      throw new Error('No tienes una sesión de entrenamiento activa.');
    }
    return this.completeSessionUseCase.execute(userId, session.id, { subjective_fatigue: input.subjective_fatigue });
  }
}
