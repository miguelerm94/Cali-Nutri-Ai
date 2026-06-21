import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { AssessmentScoringEngine } from './engines/assessment-scoring.engine';
import { AssessmentRepository } from './repositories/assessment.repository';
import { GoalRepository } from './repositories/goal.repository';
import { CompleteInitialAssessmentUseCase } from './use-cases/complete-initial-assessment.use-case';
import { TrainingModule } from '../training/training.module';
import { NutritionModule } from '../nutrition/nutrition.module';

/**
 * Dependencias: PrismaModule (@Global), TrainingModule (genera rutina post-assessment),
 * NutritionModule (TdeeCalculatorEngine/MacroCalculatorEngine, promovidos en S4).
 */
@Module({
  imports: [TrainingModule, NutritionModule],
  controllers: [AssessmentController],
  providers: [AssessmentService, AssessmentScoringEngine, AssessmentRepository, GoalRepository, CompleteInitialAssessmentUseCase],
  exports: [AssessmentService],
})
export class AssessmentModule {}
