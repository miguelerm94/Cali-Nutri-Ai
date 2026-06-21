import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class WaterLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, amountMl: number, createdAt?: Date) {
    return this.prisma.waterLog.create({
      data: { userId, amountMl, ...(createdAt ? { createdAt } : {}) },
    });
  }

  findById(id: string) {
    return this.prisma.waterLog.findUnique({ where: { id } });
  }

  findByUserAndRange(userId: string, from: Date, to: Date) {
    return this.prisma.waterLog.findMany({
      where: { userId, createdAt: { gte: from, lt: to } },
      orderBy: { createdAt: 'asc' },
    });
  }

  delete(id: string) {
    return this.prisma.waterLog.delete({ where: { id } });
  }
}
