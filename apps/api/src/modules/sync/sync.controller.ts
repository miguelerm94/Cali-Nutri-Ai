import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { SyncService } from './sync.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { offlineQueueRequestSchema, OfflineQueueItemDto } from './dto/offline-queue-item.dto';

/** Base path: /sync (BackendArchitecture.md §14 — "nuevo endpoint dedicado"). */
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('offline-queue')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(offlineQueueRequestSchema))
  processOfflineQueue(@Body() items: OfflineQueueItemDto[], @CurrentUser() user: AuthUser) {
    return this.syncService.processOfflineQueue(user.id, items);
  }
}
