import { Injectable } from '@nestjs/common';
import { ProcessOfflineQueueUseCase } from './use-cases/process-offline-queue.use-case';
import { OfflineQueueItemDto } from './dto/offline-queue-item.dto';

@Injectable()
export class SyncService {
  constructor(private readonly processOfflineQueueUseCase: ProcessOfflineQueueUseCase) {}

  processOfflineQueue(userId: string, items: OfflineQueueItemDto[]) {
    return this.processOfflineQueueUseCase.execute(userId, items);
  }
}
