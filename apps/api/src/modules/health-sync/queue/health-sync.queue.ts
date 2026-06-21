export const HEALTH_SYNC_QUEUE = 'health-sync';
export const HEALTH_SYNC_INGEST_JOB = 'ingest';

export interface HealthSyncJobData {
  userId: string;
  platform: 'healthkit' | 'health_connect';
  dataDate: string;
  steps?: number;
  weightKg?: number;
  sleepMinutes?: number;
}
