import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { MealType } from '@prisma/client';
import { FoodsRepository } from '../repositories/foods.repository';
import { FoodDiaryRepository } from '../repositories/food-diary.repository';
import { LogFoodDto } from '../dto/log-food.dto';

/**
 * POST /nutrition/diary — registro manual (MVP.md §6.3).
 * FD-DB-04: snapshot de macros al momento del registro — NUNCA recalcular desde
 * foods.* en el futuro, protege el historial ante actualizaciones de la base USDA.
 */
@Injectable()
export class LogFoodUseCase {
  constructor(
    private readonly foodsRepository: FoodsRepository,
    private readonly foodDiaryRepository: FoodDiaryRepository,
  ) {}

  async execute(userId: string, dto: LogFoodDto) {
    const food = await this.foodsRepository.findById(dto.food_id);
    if (!food) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'Alimento no encontrado.' });
    }

    const factor = dto.quantity_g / Number(food.servingSizeG);
    const entry = await this.foodDiaryRepository.create({
      userId,
      foodId: food.id,
      mealType: dto.meal_type as MealType,
      quantityG: dto.quantity_g,
      calories: round2(Number(food.calories) * factor),
      proteinG: round2(Number(food.proteinG) * factor),
      carbsG: round2(Number(food.carbsG) * factor),
      fatG: round2(Number(food.fatG) * factor),
      consumedAt: dto.consumed_at ? new Date(dto.consumed_at) : new Date(),
    });

    return {
      id: entry.id,
      meal_type: entry.mealType,
      food: { id: entry.food.id, name: entry.food.name, source: entry.food.source },
      quantity_g: Number(entry.quantityG),
      nutrition: {
        calories_kcal: Number(entry.calories),
        protein_g: Number(entry.proteinG),
        carbs_g: Number(entry.carbsG),
        fat_g: Number(entry.fatG),
      },
      logged_at: entry.consumedAt,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
