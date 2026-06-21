/**
 * Tipos de la cola offline. Fuente: BackendArchitecture.md §14 "Estrategia Offline Sync"
 * + schema_v2.md modelo SyncQueueItem (FD-DB-09).
 *
 * Operaciones soportadas offline (cliente): workout_sessions, workout_logs,
 * food_diary, water_logs. Búsqueda USDA, CALI, Apple Health y onboarding
 * NUNCA son offline.
 */
export type SyncOperationLiteral = 'create' | 'update' | 'delete';
export type SyncEndpointLiteral =
  | 'workout_sessions'
  | 'workout_logs'
  | 'food_diary'
  | 'water_logs';
export type SyncStatusLiteral = 'pending' | 'processing' | 'synced' | 'failed';

/** Item tal como lo genera y envía el cliente (MMKV queue). */
export interface OfflineQueueItem {
  local_id: string; // UUID generado en el cliente — clave de idempotencia
  operation: SyncOperationLiteral;
  endpoint: SyncEndpointLiteral;
  payload: Record<string, unknown>;
  client_created_at: string; // ISO 8601
  client_version: string;
}

export interface OfflineQueueResultItem {
  local_id: string;
  server_id: string | null;
  status: 'created' | 'updated' | 'deleted' | 'already_synced' | 'failed';
}

export interface OfflineQueueResponse {
  synced_count: number;
  failed_count: number;
  results: OfflineQueueResultItem[];
  errors: Array<{ local_id: string; message: string }>;
}
