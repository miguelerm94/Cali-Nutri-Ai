import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class WorkoutLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(params: { sessionId: string; exerciseId: string; setNumber: number; repsCompleted: number; rpe?: number; notes?: string }) {
    return this.prisma.workoutLog.create({
      data: {
        sessionId: params.sessionId,
        exerciseId: params.exerciseId,
        setNumber: params.setNumber,
        repsCompleted: params.repsCompleted,
        rpe: params.rpe,
        notes: params.notes,
      },
    });
  }

  countBySession(sessionId: string) {
    return this.prisma.workoutLog.count({ where: { sessionId } });
  }

  findBySession(sessionId: string) {
    return this.prisma.workoutLog.findMany({ where: { sessionId }, include: { exercise: true }, orderBy: { createdAt: 'asc' } });
  }
}
