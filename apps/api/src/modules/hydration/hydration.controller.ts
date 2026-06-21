import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UsePipes } from '@nestjs/common';
import { HydrationService } from './hydration.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { logWaterSchema, LogWaterDto } from './dto/log-water.dto';
import { hydrationHistoryQuerySchema, HydrationHistoryQueryDto } from './dto/hydration-history-query.dto';

/** Base path: /hydration (API.md §7). */
@Controller('hydration')
export class HydrationController {
  constructor(private readonly hydrationService: HydrationService) {}

  @Get('today')
  getToday(@CurrentUser() user: AuthUser) {
    return this.hydrationService.getToday(user.id);
  }

  @Get('history')
  @UsePipes(new ZodValidationPipe(hydrationHistoryQuerySchema))
  getHistory(@Query() query: HydrationHistoryQueryDto, @CurrentUser() user: AuthUser) {
    return this.hydrationService.getHistory(user.id, query);
  }

  @Post('logs')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(logWaterSchema))
  logWater(@Body() dto: LogWaterDto, @CurrentUser() user: AuthUser) {
    return this.hydrationService.logWater(user.id, dto);
  }

  @Delete('logs/:logId')
  deleteWaterLog(@Param('logId') logId: string, @CurrentUser() user: AuthUser) {
    return this.hydrationService.deleteWaterLog(user.id, logId);
  }
}
