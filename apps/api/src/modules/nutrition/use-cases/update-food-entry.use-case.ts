import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { MealType } from '@prisma/client';
import { FoodDiaryRepository } from '../repositories/food-diary.repository';
import { UpdateFoodEntryDto } from '../dto/update-food-entry.dto';

/** PATCH /nutrition/diary/:entry_id — recalcula macros si cambia el gramaje (FD-DB-04). */
@Injectable()
export class UpdateFoodEntryUseCase {
  constructor(private readonly foodDiaryRepository: FoodDiaryRepository) {}

  async execute(userId: string, entryId: string, dto: UpdateFoodEntryDto) {
    const entry = await this.foodDiaryRepository.findById(entryId);
    if (!entry) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'Entrada no encontrada.' });
    }
    if (entry.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No tienes acceso a esta entrada.' });
    }

    const quantityG = dto.quantity_g ?? Number(entry.quantityG);
    const factor = quantityG / Number(entry.quantityG);

    const updated = await this.foodDiaryRepository.update(entryId, {
      quantityG: dto.quantity_g,
      mealType: dto.meal_type as MealType | undefined,
      calories: dto.quantity_g ? round2(Number(entry.calories) * factor) : undefined,
      proteinG: dto.quantity_g ? round2(Number(entry.proteinG) * factor) : undefined,
      carbsG: dto.quantity_g ? round2(Number(entry.carbsG) * factor) : undefined,
      fatG: dto.quantity_g ? round2(Number(entry.fatG) * factor) : undefined,
    });

    return {
      id: updated.id,
      quantity_g: Number(updated.quantityG),
      meal_type: updated.mealType,
      nutrition: { calories_kcal: Number(updated.calories), protein_g: Number(updated.proteinG), carbs_g: Number(updated.carbsG), fat_g: Number(updated.fatG) },
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
