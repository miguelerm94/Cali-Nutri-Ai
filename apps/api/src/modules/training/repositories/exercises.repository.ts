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
}
