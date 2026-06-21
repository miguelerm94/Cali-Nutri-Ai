import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SyncHealthDataDto } from '../dto/sync-health-data.dto';
import { HEALTH_SYNC_QUEUE, HEALTH_SYNC_INGEST_JOB, HealthSyncJobData } from '../queue/health-sync.queue';

@Injectable()
export class EnqueueHealthSyncUseCase {
  constructor(@InjectQueue(HEALTH_SYNC_QUEUE) private readonly queue: Queue<HealthSyncJobData>) {}

  async execute(userId: string, dto: SyncHealthDataDto): Promise<{ accepted: boolean }> {
    await this.queue.add(HEALTH_SYNC_INGEST_JOB, { userId, ...dto });
    return { accepted: true };
  }
}
