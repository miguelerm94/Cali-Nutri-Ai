import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { searchFoodQuerySchema, SearchFoodQueryDto } from './dto/search-food.dto';
import { logFoodSchema, LogFoodDto } from './dto/log-food.dto';
import { updateFoodEntrySchema, UpdateFoodEntryDto } from './dto/update-food-entry.dto';
import { diaryQuerySchema, DiaryQueryDto } from './dto/diary-query.dto';

/** Base path: /nutrition (API.md §6). */
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('targets')
  getTargets(@CurrentUser() user: AuthUser) {
    return this.nutritionService.getTargets(user.id);
  }

  @Get('diary/today')
  getDiaryToday(@CurrentUser() user: AuthUser) {
    return this.nutritionService.getDiaryToday(user.id);
  }

  @Get('diary')
  @UsePipes(new ZodValidationPipe(diaryQuerySchema))
  getDiary(@Query() query: DiaryQueryDto, @CurrentUser() user: AuthUser) {
    return this.nutritionService.getDiary(user.id, query);
  }

  @Post('diary')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(logFoodSchema))
  logFood(@Body() dto: LogFoodDto, @CurrentUser() user: AuthUser) {
    return this.nutritionService.logFood(user.id, dto);
  }

  @Patch('diary/:entryId')
  @UsePipes(new ZodValidationPipe(updateFoodEntrySchema))
  updateFoodEntry(@Param('entryId') entryId: string, @Body() dto: UpdateFoodEntryDto, @CurrentUser() user: AuthUser) {
    return this.nutritionService.updateFoodEntry(user.id, entryId, dto);
  }

  @Delete('diary/:entryId')
  deleteFoodEntry(@Param('entryId') entryId: string, @CurrentUser() user: AuthUser) {
    return this.nutritionService.deleteFoodEntry(user.id, entryId);
  }

  @Get('foods/search')
  @UsePipes(new ZodValidationPipe(searchFoodQuerySchema))
  searchFoods(@Query() query: SearchFoodQueryDto) {
    return this.nutritionService.searchFoods(query.q, query.limit);
  }
}
