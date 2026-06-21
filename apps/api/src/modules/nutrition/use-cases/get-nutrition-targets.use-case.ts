import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { GoalTargetsRepository } from '../repositories/goal-targets.repository';

/** GET /nutrition/targets — expone el Goal activo calculado en el onboarding (FD-05/FD-06). */
@Injectable()
export class GetNutritionTargetsUseCase {
  constructor(private readonly goalTargetsRepository: GoalTargetsRepository) {}

  async execute(userId: string) {
    const goal = await this.goalTargetsRepository.findActiveByUser(userId);
    if (!goal || goal.targetCalories == null) {
      throw new NotFoundException({ code: ErrorCode.ASSESSMENT_REQUIRED, message: 'Completa el onboarding para calcular tus objetivos nutricionales.' });
    }

    return {
      goal_type: goal.goalType,
      targets: {
        calories_kcal: goal.targetCalories,
        protein_g: Number(goal.targetProteinG),
        fat_g: Number(goal.targetFatG),
        carbs_g: Number(goal.targetCarbsG),
      },
      tdee_kcal: goal.tdee,
    };
  }
}
