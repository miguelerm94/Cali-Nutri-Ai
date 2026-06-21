import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { OfflineQueueItem } from '@cali-nutri/shared-types';
import { apiClient } from './api-client';

/**
 * Cola offline del cliente (A-01 — S1). Cliente-first, sync-on-reconnect.
 * Fuente: BackendArchitecture.md §14. Operaciones soportadas:
 *   workout_sessions, workout_logs, food_diary, water_logs.
 * Los módulos de dominio (S3/S4/S5a) usarán `enqueue()` desde sus propios
 * servicios cuando detecten que el dispositivo está offline.
 */
const storage = new MMKV({ id: 'cali-offline-queue' });
const QUEUE_KEY = 'queue:items';

function readQueue(): OfflineQueueItem[] {
  const raw = storage.getString(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeQueue(items: OfflineQueueItem[]): void {
  storage.set(QUEUE_KEY, JSON.stringify(items));
}

export const offlineQueueService = {
  async enqueue(item: Omit<OfflineQueueItem, 'local_id' | 'client_created_at' | 'client_version'>) {
    const queue = readQueue();
    queue.push({
      ...item,
      local_id: Crypto.randomUUID(),
      client_created_at: new Date().toISOString(),
      client_version: '1.0.0',
    });
    writeQueue(queue);
  },

  getAll(): OfflineQueueItem[] {
    return readQueue();
  },

  size(): number {
    return readQueue().length;
  },

  /** Envía toda la cola pendiente a POST /sync/offline-queue y limpia los items aceptados. */
  async flush(): Promise<void> {
    const queue = readQueue();
    if (queue.length === 0) return;

    try {
      const { data } = await apiClient.post('/sync/offline-queue', queue);
      const acceptedIds = new Set(
        data.data.results
          .filter((r: { status: string }) => r.status !== 'failed')
          .map((r: { local_id: string }) => r.local_id),
      );
      writeQueue(queue.filter((item) => !acceptedIds.has(item.local_id)));
    } catch {
      // Si falla la red de nuevo, los items permanecen en cola para el siguiente intento.
    }
  },

  /** Se suscribe a cambios de conectividad y flushea automáticamente al reconectar. */
  startAutoFlush(): () => void {
    return NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void offlineQueueService.flush();
      }
    });
  },
};
