import { Body, Controller, Get, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { HealthSyncService } from './health-sync.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { syncHealthDataSchema, SyncHealthDataDto } from './dto/sync-health-data.dto';

/** FD-ARCH-06: ingestión async vía BullMQ — nunca sync en el open de la app. */
@Controller('health')
export class HealthSyncController {
  constructor(private readonly healthSyncService: HealthSyncService) {}

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ZodValidationPipe(syncHealthDataSchema))
  sync(@Body() dto: SyncHealthDataDto, @CurrentUser() user: AuthUser) {
    return this.healthSyncService.sync(user.id, dto);
  }

  @Get('steps/today')
  getTodaySteps(@CurrentUser() user: AuthUser) {
    return this.healthSyncService.getTodaySteps(user.id);
  }
}
