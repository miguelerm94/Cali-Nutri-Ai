import { Injectable } from '@nestjs/common';
import { HealthPlatform } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class HealthDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(params: {
    userId: string;
    platform: HealthPlatform;
    dataDate: Date;
    steps?: number;
    weightKg?: number;
    sleepMinutes?: number;
  }) {
    const { userId, platform, dataDate, steps, weightKg, sleepMinutes } = params;
    return this.prisma.healthData.upsert({
      where: { userId_platform_dataDate: { userId, platform, dataDate } },
      create: { userId, platform, dataDate, steps, weightKg, sleepMinutes },
      update: { steps, weightKg, sleepMinutes },
    });
  }

  findByUserAndDate(userId: string, dataDate: Date) {
    return this.prisma.healthData.findMany({ where: { userId, dataDate } });
  }
}
