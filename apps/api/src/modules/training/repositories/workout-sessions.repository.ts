import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class WorkoutSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(params: { userId: string; programId?: string; workoutDayId?: string; startedAt: Date }) {
    return this.prisma.workoutSession.create({
      data: {
        userId: params.userId,
        programId: params.programId,
        workoutDayId: params.workoutDayId,
        startedAt: params.startedAt,
      },
    });
  }

  findActiveByUser(userId: string) {
    return this.prisma.workoutSession.findFirst({
      where: { userId, finishedAt: null },
      orderBy: { startedAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.workoutSession.findUnique({
      where: { id },
      include: {
        workoutLogs: { include: { exercise: true }, orderBy: { createdAt: 'asc' } },
        workoutDay: { include: { workoutExercises: true } },
      },
    });
  }

  complete(id: string, params: { finishedAt: Date; durationMinutes: number; subjectiveFatigue?: number; notes?: string }) {
    return this.prisma.workoutSession.update({
      where: { id },
      data: {
        finishedAt: params.finishedAt,
        durationMinutes: params.durationMinutes,
        subjectiveFatigue: params.subjectiveFatigue,
        notes: params.notes,
      },
    });
  }

  delete(id: string) {
    return this.prisma.workoutSession.delete({ where: { id } });
  }

  findHistoryByUser(userId: string, params: { from: Date; to: Date; limit: number; cursor?: string }) {
    return this.prisma.workoutSession.findMany({
      where: {
        userId,
        finishedAt: { not: null },
        startedAt: { gte: params.from, lte: params.to },
      },
      include: { workoutDay: true, workoutLogs: true },
      orderBy: { startedAt: 'desc' },
      take: params.limit,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
    });
  }

  /** Sesiones completadas de un programa, más recientes primero — usado por ProgressionEngine/StagnationDetectorEngine. */
  findCompletedByProgram(programId: string, limit = 60) {
    return this.prisma.workoutSession.findMany({
      where: { programId, finishedAt: { not: null } },
      include: { workoutLogs: true, workoutDay: { include: { workoutExercises: true } } },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  countCompletedByProgram(programId: string) {
    return this.prisma.workoutSession.count({ where: { programId, finishedAt: { not: null } } });
  }

  /** Sesiones completadas por el usuario en un rango de fechas — usado por HydrationModule (FD-07) y DashboardModule. */
  findCompletedByUserAndRange(userId: string, from: Date, to: Date) {
    return this.prisma.workoutSession.findMany({
      where: { userId, finishedAt: { not: null }, startedAt: { gte: from, lt: to } },
      orderBy: { startedAt: 'desc' },
    });
  }
}
