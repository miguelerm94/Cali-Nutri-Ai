/**
 * Eventos internos del sistema, emitidos/escuchados via EventEmitter2.
 * Patrón: "Monolito Modular con Event Bus Interno" (BackendArchitecture.md §1).
 *
 * S1 define los eventos de Auth y Sync. Los de Training/Nutrition/Hydration/AI
 * se añaden en sus respectivos sprints sin romper este enum (solo se agregan claves).
 */
export enum AppEvent {
  // Auth
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.logged_in',
  USER_DELETED_REQUESTED = 'user.deleted_requested', // GDPR — soft delete (S6)

  // Sync offline (A-01 — S1)
  SYNC_ITEM_RECEIVED = 'sync.item.received', // Disparado por SyncService tras persistir en sync_queue_items
  SYNC_ITEM_PROCESSED = 'sync.item.processed',
  SYNC_ITEM_FAILED = 'sync.item.failed',
}
