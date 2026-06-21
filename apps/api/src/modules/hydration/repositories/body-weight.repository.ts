import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

/**
 * Lectura mínima de peso corporal — pertenece a BodyModule (BackendArchitecture.md),
 * no construido aún. Vive aquí temporalmente, igual que GoalTargetsRepository en
 * NutritionModule, hasta que exista BodyModule.
 */
@Injectable()
export class BodyWeightRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestWeightKg(userId: string): Promise<number | null> {
    const latest = await this.findLatestMeasurement(userId);
    return latest?.weightKg != null ? Number(latest.weightKg) : null;
  }

  findLatestMeasurement(userId: string) {
    return this.prisma.bodyMeasurement.findFirst({
      where: { userId, weightKg: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
