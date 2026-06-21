import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Food, FoodSource, Prisma } from '@prisma/client';

type UsdaFoodData = Omit<Prisma.FoodUncheckedCreateInput, 'source' | 'externalId'>;

/**
 * Búsqueda fuzzy vía `contains`/`mode: insensitive` (Prisma) sobre `name`/`nameEs`.
 * El índice GIN pg_trgm de 01_materialized_views.sql acelera estas consultas en
 * Postgres — no requiere cambios aquí, es transparente a nivel de query plan.
 */
@Injectable()
export class FoodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  search(query: string, limit: number): Promise<Food[]> {
    return this.prisma.food.findMany({
      where: {
        isActive: true,
        OR: [{ name: { contains: query, mode: 'insensitive' } }, { nameEs: { contains: query, mode: 'insensitive' } }],
      },
      orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
      take: limit,
    });
  }

  findById(id: string): Promise<Food | null> {
    return this.prisma.food.findUnique({ where: { id } });
  }

  findByExternalId(source: FoodSource, externalId: string): Promise<Food | null> {
    return this.prisma.food.findUnique({ where: { source_externalId: { source, externalId } } });
  }

  upsertFromUsda(externalId: string, data: UsdaFoodData): Promise<Food> {
    return this.prisma.food.upsert({
      where: { source_externalId: { source: FoodSource.usda, externalId } },
      create: { ...data, source: FoodSource.usda, externalId },
      update: data,
    });
  }
}
