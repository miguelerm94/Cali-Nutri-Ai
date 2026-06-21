import { Injectable } from '@nestjs/common';
import { GetNutritionTargetsUseCase } from './use-cases/get-nutrition-targets.use-case';
import { SearchFoodUseCase } from './use-cases/search-food.use-case';
import { LogFoodUseCase } from './use-cases/log-food.use-case';
import { GetFoodDiaryUseCase } from './use-cases/get-food-diary.use-case';
import { UpdateFoodEntryUseCase } from './use-cases/update-food-entry.use-case';
import { DeleteFoodEntryUseCase } from './use-cases/delete-food-entry.use-case';
import { LogFoodDto } from './dto/log-food.dto';
import { UpdateFoodEntryDto } from './dto/update-food-entry.dto';
import { DiaryQueryDto } from './dto/diary-query.dto';

@Injectable()
export class NutritionService {
  constructor(
    private readonly getNutritionTargetsUseCase: GetNutritionTargetsUseCase,
    private readonly searchFoodUseCase: SearchFoodUseCase,
    private readonly logFoodUseCase: LogFoodUseCase,
    private readonly getFoodDiaryUseCase: GetFoodDiaryUseCase,
    private readonly updateFoodEntryUseCase: UpdateFoodEntryUseCase,
    private readonly deleteFoodEntryUseCase: DeleteFoodEntryUseCase,
  ) {}

  getTargets(userId: string) {
    return this.getNutritionTargetsUseCase.execute(userId);
  }

  searchFoods(query: string, limit: number) {
    return this.searchFoodUseCase.execute(query, limit);
  }

  getDiaryToday(userId: string) {
    return this.getFoodDiaryUseCase.executeToday(userId);
  }

  getDiary(userId: string, query: DiaryQueryDto) {
    return this.getFoodDiaryUseCase.executeRange(userId, query);
  }

  logFood(userId: string, dto: LogFoodDto) {
    return this.logFoodUseCase.execute(userId, dto);
  }

  updateFoodEntry(userId: string, entryId: string, dto: UpdateFoodEntryDto) {
    return this.updateFoodEntryUseCase.execute(userId, entryId, dto);
  }

  deleteFoodEntry(userId: string, entryId: string) {
    return this.deleteFoodEntryUseCase.execute(userId, entryId);
  }
}
