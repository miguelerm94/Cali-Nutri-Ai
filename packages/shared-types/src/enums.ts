/**
 * Enums espejo del schema Prisma canónico (schema_v2.md).
 * Se mantienen sincronizados manualmente — cambios en schema.prisma
 * deben replicarse aquí (ver Instrucción Maestra §8, regla 5).
 */
export enum Sex {
  male = 'male',
  female = 'female',
}

export enum UnitPreference {
  metric = 'metric',
  imperial = 'imperial',
}

export enum UserTier {
  free = 'free',
  premium = 'premium',
}

export enum GoalType {
  muscle_gain = 'muscle_gain',
  fat_loss = 'fat_loss',
  recomposition = 'recomposition',
  maintenance = 'maintenance',
}

export enum PresentationLevel {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced',
}

export enum SyncOperation {
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export enum SyncEndpoint {
  workout_sessions = 'workout_sessions',
  workout_logs = 'workout_logs',
  food_diary = 'food_diary',
  water_logs = 'water_logs',
}

export enum SyncStatus {
  pending = 'pending',
  processing = 'processing',
  synced = 'synced',
  failed = 'failed',
}
