import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncQueueRepository } from './repositories/sync-queue.repository';
import { ProcessOfflineQueueUseCase } from './use-cases/process-offline-queue.use-case';

@Module({
  controllers: [SyncController],
  providers: [SyncService, SyncQueueRepository, ProcessOfflineQueueUseCase],
  exports: [SyncService],
})
export class SyncModule {}
