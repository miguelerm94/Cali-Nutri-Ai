import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { MealType } from '@prisma/client';

export interface CreateFoodDiaryEntryInput {
  userId: string;
  foodId: string;
  mealType: MealType;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  consumedAt: Date;
}

@Injectable()
export class FoodDiaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateFoodDiaryEntryInput) {
    return this.prisma.foodDiaryEntry.create({ data: input, include: { food: true } });
  }

  findById(id: string) {
    return this.prisma.foodDiaryEntry.findUnique({ where: { id }, include: { food: true } });
  }

  /** [from, to) — rango de fecha en UTC, indexado vía idx_food_diary_date. */
  findByUserAndRange(userId: string, from: Date, to: Date, mealType?: MealType) {
    return this.prisma.foodDiaryEntry.findMany({
      where: { userId, consumedAt: { gte: from, lt: to }, mealType },
      include: { food: true },
      orderBy: { consumedAt: 'asc' },
    });
  }

  update(id: string, data: { quantityG?: number; mealType?: MealType; calories?: number; proteinG?: number; carbsG?: number; fatG?: number }) {
    return this.prisma.foodDiaryEntry.update({ where: { id }, data, include: { food: true } });
  }

  delete(id: string) {
    return this.prisma.foodDiaryEntry.delete({ where: { id } });
  }
}
