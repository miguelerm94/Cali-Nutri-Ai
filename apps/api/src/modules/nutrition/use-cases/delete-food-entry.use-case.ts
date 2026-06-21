import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { FoodDiaryRepository } from '../repositories/food-diary.repository';

@Injectable()
export class DeleteFoodEntryUseCase {
  constructor(private readonly foodDiaryRepository: FoodDiaryRepository) {}

  async execute(userId: string, entryId: string): Promise<void> {
    const entry = await this.foodDiaryRepository.findById(entryId);
    if (!entry) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'Entrada no encontrada.' });
    }
    if (entry.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No tienes acceso a esta entrada.' });
    }
    await this.foodDiaryRepository.delete(entryId);
  }
}
