import { z } from 'zod';

/**
 * Item de la cola offline tal como lo envía el cliente (MMKV).
 * Fuente: BackendArchitecture.md §14 "Estrategia Offline Sync" (A-01, FD-DB-09).
 * Operaciones soportadas: workout_sessions, workout_logs, food_diary, water_logs.
 */
export const offlineQueueItemSchema = z.object({
  local_id: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  endpoint: z.enum(['workout_sessions', 'workout_logs', 'food_diary', 'water_logs']),
  payload: z.record(z.unknown()),
  client_created_at: z.string().datetime(),
  client_version: z.string().default('1.0.0'),
});

export const offlineQueueRequestSchema = z.array(offlineQueueItemSchema).min(1).max(200);

export type OfflineQueueItemDto = z.infer<typeof offlineQueueItemSchema>;
