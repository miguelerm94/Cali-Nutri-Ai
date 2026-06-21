import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HealthDataRepository } from '../repositories/health-data.repository';
import { HEALTH_SYNC_QUEUE, HealthSyncJobData } from './health-sync.queue';

/**
 * FD-ARCH-06: el sync de HealthKit/Health Connect es asíncrono — nunca bloquea
 * la respuesta de POST /health/sync. El job solo hace el upsert en `health_data`.
 */
@Processor(HEALTH_SYNC_QUEUE)
export class HealthSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(HealthSyncProcessor.name);

  constructor(private readonly healthDataRepository: HealthDataRepository) {
    super();
  }

  async process(job: Job<HealthSyncJobData>): Promise<void> {
    const { userId, platform, dataDate, steps, weightKg, sleepMinutes } = job.data;
    await this.healthDataRepository.upsert({
      userId,
      platform,
      dataDate: new Date(dataDate),
      steps,
      weightKg,
      sleepMinutes,
    });
    this.logger.log(`HealthSync procesado: user ${userId} platform ${platform} fecha ${dataDate}`);
  }
}
