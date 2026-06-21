import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

/**
 * Lectura mínima del Goal activo (objetivo nutricional vigente). El CRUD completo
 * de Goal vive en `assessment/repositories/goal.repository.ts` (creación en
 * onboarding) y se moverá a BodyModule cuando ese módulo se construya
 * (BackendArchitecture.md ubica `goals.repository.ts` ahí) — no construido aún,
 * por lo que esta lectura vive temporalmente en NutritionModule, su consumidor actual.
 */
@Injectable()
export class GoalTargetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByUser(userId: string) {
    return this.prisma.goal.findFirst({ where: { userId, status: 'active' }, orderBy: { createdAt: 'desc' } });
  }
}
