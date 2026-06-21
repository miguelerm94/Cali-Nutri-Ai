import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PresentationLevel, Sex, UnitPreference } from '@prisma/client';
import { MovementScores } from '../engines/assessment-scoring.engine';

@Injectable()
export class AssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Marca cualquier evaluación previa como inactiva y crea la nueva activa.
   * Garantiza la UNIQUE PARTIAL INDEX idx_user_assessments_one_active_per_user (FIX-04)
   * a nivel de aplicación (la DB la garantiza como segunda línea de defensa).
   */
  async createActiveAssessment(
    userId: string,
    raw: { pullupsMax: number; pushupsMax: number; squatsMax: number; dipsMax: number; plankSeconds: number },
    scores: MovementScores,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userAssessment.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
      return tx.userAssessment.create({
        data: {
          userId,
          pullupsMax: raw.pullupsMax,
          pushupsMax: raw.pushupsMax,
          squatsMax: raw.squatsMax,
          dipsMax: raw.dipsMax,
          plankSeconds: raw.plankSeconds,
          pullupsScore: scores.pullupsScore,
          pushupsScore: scores.pushupsScore,
          squatsScore: scores.squatsScore,
          coreScore: scores.coreScore,
          globalScore: scores.globalScore,
          presentationLevel: scores.presentationLevel,
          isActive: true,
        },
      });
    });
  }

  /** Completa el onboarding: biométricos base + state machine → paso 7 (FD-ARCH-07). */
  updateUserOnboardingData(
    userId: string,
    data: {
      birthDate: Date;
      sex: Sex;
      heightCm: number;
      targetWeightKg?: number;
      trainingFrequency: number;
      unitPreference: UnitPreference;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        onboardingStep: 7,
        onboardingComplete: true,
      },
    });
  }

  createBodyMeasurement(userId: string, weightKg: number) {
    return this.prisma.bodyMeasurement.create({
      data: { userId, weightKg, source: 'manual' },
    });
  }
}
