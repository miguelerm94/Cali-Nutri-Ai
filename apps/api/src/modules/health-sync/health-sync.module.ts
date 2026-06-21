import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthDataRepository } from './repositories/health-data.repository';
import { HealthSyncProcessor } from './queue/health-sync.processor';
import { EnqueueHealthSyncUseCase } from './use-cases/enqueue-health-sync.use-case';
import { GetTodayStepsUseCase } from './use-cases/get-today-steps.use-case';
import { HealthSyncService } from './health-sync.service';
import { HealthSyncController } from './health-sync.controller';
import { HEALTH_SYNC_QUEUE } from './queue/health-sync.queue';

/**
 * S6a — HealthSync (FD-INFRA-01 semana 11, FD-08, FD-ARCH-06): sync asíncrono
 * de HealthKit/Health Connect vía BullMQ. Conexión Redis dedicada (no la de
 * `RedisService`) porque BullMQ exige `maxRetriesPerRequest: null`.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('redis.url'),
          maxRetriesPerRequest: null,
        },
      }),
    }),
    BullModule.registerQueue({ name: HEALTH_SYNC_QUEUE }),
  ],
  controllers: [HealthSyncController],
  providers: [HealthDataRepository, HealthSyncProcessor, EnqueueHealthSyncUseCase, GetTodayStepsUseCase, HealthSyncService],
  exports: [GetTodayStepsUseCase],
})
export class HealthSyncModule {}
