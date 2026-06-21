import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GoalType } from '@prisma/client';
import { MacroTargets } from '../engines/macro-calculator.engine';

/**
 * NOTA DE UBICACIÓN: BackendArchitecture.md ubica goals.repository.ts en
 * modules/body/ (módulo aún no construido). Vive aquí temporalmente porque
 * el onboarding (S2) ya necesita crear el Goal activo. Se mueve a BodyModule
 * cuando ese módulo se construya, sin cambiar su interfaz pública.
 */
@Injectable()
export class GoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Garantiza 1 solo goal activo por usuario (idx_goals_one_active_per_user, FIX-04). */
  async createActiveGoal(userId: string, goalType: GoalType, targetWeightKg: number | undefined, macros: MacroTargets) {
    return this.prisma.$transaction(async (tx) => {
      await tx.goal.updateMany({ where: { userId, status: 'active' }, data: { status: 'cancelled' } });
      return tx.goal.create({
        data: {
          userId,
          goalType,
          startDate: new Date(),
          targetWeightKg,
          status: 'active',
          tdee: macros.tdee,
          targetCalories: macros.targetCalories,
          targetProteinG: macros.targetProteinG,
          targetCarbsG: macros.targetCarbsG,
          targetFatG: macros.targetFatG,
        },
      });
    });
  }
}
