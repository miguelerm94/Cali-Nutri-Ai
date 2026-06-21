import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ExerciseCategory } from '@prisma/client';

@Injectable()
export class ExercisesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCategory(category: ExerciseCategory) {
    return this.prisma.exercise.findMany({
      where: { category, isActive: true },
      orderBy: { difficulty: 'asc' },
    });
  }

  findAllActive() {
    return this.prisma.exercise.findMany({ where: { isActive: true } });
  }

  findById(id: string) {
    return this.prisma.exercise.findUnique({ where: { id } });
  }

  findFiltered(params: { category?: ExerciseCategory; difficulty?: number; search?: string; limit: number }) {
    return this.prisma.exercise.findMany({
      where: {
        isActive: true,
        category: params.category,
        difficulty: params.difficulty,
        ...(params.search
          ? { OR: [{ name: { contains: params.search, mode: 'insensitive' } }, { nameEs: { contains: params.search, mode: 'insensitive' } }] }
          : {}),
      },
      orderBy: { difficulty: 'asc' },
      take: params.limit,
    });
  }
}
