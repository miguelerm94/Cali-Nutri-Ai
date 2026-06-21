import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SyncQueueRepository } from '../repositories/sync-queue.repository';
import { OfflineQueueItemDto } from '../dto/offline-queue-item.dto';
import { AppEvent } from '../../../infrastructure/events/events.enum';
import { OfflineQueueResponse, OfflineQueueResultItem } from '@cali-nutri/shared-types';

/**
 * Procesa la cola offline (BackendArchitecture.md §14, A-01 — S1).
 *
 * ALCANCE S1 ("offline queue base"): esta clase garantiza ACEPTACIÓN
 * IDEMPOTENTE de los items en `sync_queue_items` y emite un evento por item
 * (AppEvent.SYNC_ITEM_RECEIVED). La escritura real en las tablas de dominio
 * (workout_sessions, food_diary, water_logs...) la harán los listeners que
 * se añaden en S3 (Training), S4 (Nutrición) y S5a (Hidratación) — esos
 * módulos no existen todavía. Por eso el status que se persiste es 'pending'
 * hasta que un listener futuro lo marque 'synced' o 'failed'.
 *
 * Orden de procesamiento: cronológico por client_created_at (estrategia
 * documentada "Last Write Wins").
 */
@Injectable()
export class ProcessOfflineQueueUseCase {
  private readonly logger = new Logger(ProcessOfflineQueueUseCase.name);

  constructor(
    private readonly syncQueueRepository: SyncQueueRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string, items: OfflineQueueItemDto[]): Promise<OfflineQueueResponse> {
    const ordered = [...items].sort(
      (a, b) => new Date(a.client_created_at).getTime() - new Date(b.client_created_at).getTime(),
    );

    const results: OfflineQueueResultItem[] = [];
    const errors: Array<{ local_id: string; message: string }> = [];

    for (const item of ordered) {
      try {
        const existing = await this.syncQueueRepository.findByIdAndUser(item.local_id, userId);

        if (existing) {
          // Idempotencia: ya se recibió este local_id — no se duplica.
          results.push({
            local_id: item.local_id,
            server_id: existing.id,
            status: existing.status === 'synced' ? 'already_synced' : 'created',
          });
          continue;
        }

        const created = await this.syncQueueRepository.create(userId, item);

        this.eventEmitter.emit(AppEvent.SYNC_ITEM_RECEIVED, {
          userId,
          localId: created.id,
          endpoint: item.endpoint,
          operation: item.operation,
          payload: item.payload,
        });

        results.push({ local_id: item.local_id, server_id: created.id, status: 'created' });
      } catch (err) {
        this.logger.error(`Error procesando item offline ${item.local_id}: ${(err as Error).message}`);
        errors.push({ local_id: item.local_id, message: (err as Error).message });
        // No detiene la cola — continúa con el resto de items (BackendArchitecture.md §14).
      }
    }

    return {
      synced_count: results.length,
      failed_count: errors.length,
      results,
      errors,
    };
  }
}
