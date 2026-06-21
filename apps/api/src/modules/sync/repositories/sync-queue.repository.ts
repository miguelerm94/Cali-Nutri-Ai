import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { SyncEndpoint, SyncOperation, SyncStatus } from '@prisma/client';
import { OfflineQueueItemDto } from '../dto/offline-queue-item.dto';

@Injectable()
export class SyncQueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempotencia: el id del registro ES el local_id generado por el cliente. */
  findByIdAndUser(localId: string, userId: string) {
    return this.prisma.syncQueueItem.findFirst({ where: { id: localId, userId } });
  }

  create(userId: string, item: OfflineQueueItemDto) {
    return this.prisma.syncQueueItem.create({
      data: {
        id: item.local_id,
        userId,
        operation: item.operation as SyncOperation,
        endpoint: item.endpoint as SyncEndpoint,
        payload: item.payload as any,
        clientCreatedAt: new Date(item.client_created_at),
        status: SyncStatus.pending,
      },
    });
  }

  markStatus(localId: string, status: SyncStatus, errorMessage?: string) {
    return this.prisma.syncQueueItem.update({
      where: { id: localId },
      data: {
        status,
        errorMessage,
        syncedAt: status === SyncStatus.synced ? new Date() : undefined,
      },
    });
  }
}
