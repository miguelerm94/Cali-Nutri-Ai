import { Injectable } from '@nestjs/common';
import { MealType } from '@prisma/client';
import { FoodDiaryRepository } from '../repositories/food-diary.repository';
import { GoalTargetsRepository } from '../repositories/goal-targets.repository';
import { DiaryQueryDto } from '../dto/diary-query.dto';

const DEFAULT_WINDOW_DAYS = 7;

/**
 * GET /nutrition/diary/today y GET /nutrition/diary (API.md): misma forma de
 * respuesta, distinto rango. "today" = [hoy 00:00 UTC, mañana 00:00 UTC).
 */
@Injectable()
export class GetFoodDiaryUseCase {
  constructor(
    private readonly foodDiaryRepository: FoodDiaryRepository,
    private readonly goalTargetsRepository: GoalTargetsRepository,
  ) {}

  async executeToday(userId: string) {
    const from = startOfUtcDay(new Date());
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    return this.build(userId, from, to);
  }

  async executeRange(userId: string, query: DiaryQueryDto) {
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : new Date();
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : new Date(to.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return this.build(userId, from, to, query.meal_type as MealType | undefined);
  }

  private async build(userId: string, from: Date, to: Date, mealType?: MealType) {
    const [entries, goal] = await Promise.all([
      this.foodDiaryRepository.findByUserAndRange(userId, from, to, mealType),
      this.goalTargetsRepository.findActiveByUser(userId),
    ]);

    const totals = entries.reduce(
      (acc, e) => ({
        calories: acc.calories + Number(e.calories),
        protein: acc.protein + Number(e.proteinG),
        carbs: acc.carbs + Number(e.carbsG),
        fat: acc.fat + Number(e.fatG),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const targetCalories = goal?.targetCalories ?? null;
    const targetProtein = goal?.targetProteinG != null ? Number(goal.targetProteinG) : null;
    const targetCarbs = goal?.targetCarbsG != null ? Number(goal.targetCarbsG) : null;
    const targetFat = goal?.targetFatG != null ? Number(goal.targetFatG) : null;

    return {
      entries: entries.map((e) => ({
        id: e.id,
        meal_type: e.mealType,
        logged_at: e.consumedAt,
        food: { id: e.food.id, name: e.food.name, brand: e.food.brand },
        quantity_g: Number(e.quantityG),
        nutrition: { calories_kcal: Number(e.calories), protein_g: Number(e.proteinG), fat_g: Number(e.fatG), carbs_g: Number(e.carbsG) },
      })),
      summary: {
        calories: macroSummary(totals.calories, targetCalories),
        protein: macroSummary(totals.protein, targetProtein),
        carbs: macroSummary(totals.carbs, targetCarbs),
        fat: macroSummary(totals.fat, targetFat),
      },
      by_meal: this.byMeal(entries),
    };
  }

  private byMeal(entries: Awaited<ReturnType<FoodDiaryRepository['findByUserAndRange']>>) {
    const meals: Record<string, { calories_kcal: number; protein_g: number }> = {
      breakfast: { calories_kcal: 0, protein_g: 0 },
      lunch: { calories_kcal: 0, protein_g: 0 },
      dinner: { calories_kcal: 0, protein_g: 0 },
      snack: { calories_kcal: 0, protein_g: 0 },
      pre_workout: { calories_kcal: 0, protein_g: 0 },
      post_workout: { calories_kcal: 0, protein_g: 0 },
    };
    for (const e of entries) {
      meals[e.mealType].calories_kcal += Number(e.calories);
      meals[e.mealType].protein_g += Number(e.proteinG);
    }
    return meals;
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Indicadores de color de MVP.md §6.4: verde ±10%, amarillo 10–20%, rojo +20%. */
function macroSummary(consumed: number, target: number | null) {
  const rounded = Math.round(consumed * 100) / 100;
  if (target == null) {
    return { consumed: rounded, target: null, remaining: null, percent: null, status: null };
  }
  const percent = target > 0 ? Math.round((consumed / target) * 1000) / 10 : 0;
  const deviation = Math.abs(percent - 100);
  const status = deviation <= 10 ? 'on_track' : deviation <= 20 ? 'warning' : 'off_track';
  return { consumed: rounded, target, remaining: Math.round((target - consumed) * 100) / 100, percent, status };
}
