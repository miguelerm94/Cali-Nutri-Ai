import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GeneratedWorkoutDay } from '../engines/routine-generator.engine';
import { PresentationLevel, TrainingStructure } from '@prisma/client';

@Injectable()
export class TrainingProgramsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea el programa con sus días y ejercicios anidados en una sola transacción. */
  createWithDays(params: {
    userId: string;
    goalId?: string;
    name: string;
    weeklyFrequency: number;
    structure: TrainingStructure;
    generatedForLevel: PresentationLevel;
    startDate: Date;
    days: GeneratedWorkoutDay[];
  }) {
    return this.prisma.trainingProgram.create({
      data: {
        userId: params.userId,
        goalId: params.goalId,
        name: params.name,
        weeklyFrequency: params.weeklyFrequency,
        structure: params.structure,
        generatedForLevel: params.generatedForLevel,
        startDate: params.startDate,
        workoutDays: {
          create: params.days.map((day) => ({
            dayName: day.dayName,
            dayType: day.dayType,
            dayOrder: day.dayOrder,
            workoutExercises: {
              create: day.exercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                exerciseOrder: ex.exerciseOrder,
                sets: ex.sets,
                repsTarget: ex.repsTarget,
                restSeconds: ex.restSeconds,
                targetRpe: ex.targetRpe,
              })),
            },
          })),
        },
      },
      include: { workoutDays: { include: { workoutExercises: true } } },
    });
  }

  findActiveByUser(userId: string) {
    return this.prisma.trainingProgram.findFirst({
      where: { userId, status: 'active' },
      include: { workoutDays: { include: { workoutExercises: { include: { exercise: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.trainingProgram.findUnique({
      where: { id },
      include: { workoutDays: { include: { workoutExercises: true }, orderBy: { dayOrder: 'asc' } } },
    });
  }

  /** FD-02: detección pasiva — solo persiste el flag informativo, sin acción automática. */
  setStagnationAlert(id: string, alert: boolean, detectedAt: Date | null) {
    return this.prisma.trainingProgram.update({
      where: { id },
      data: { stagnationAlert: alert, stagnationDetectedAt: detectedAt },
    });
  }
}
