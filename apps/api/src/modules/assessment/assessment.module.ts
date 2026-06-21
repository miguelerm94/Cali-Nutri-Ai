import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { AssessmentScoringEngine } from './engines/assessment-scoring.engine';
import { TdeeCalculatorEngine } from './engines/tdee-calculator.engine';
import { MacroCalculatorEngine } from './engines/macro-calculator.engine';
import { AssessmentRepository } from './repositories/assessment.repository';
import { GoalRepository } from './repositories/goal.repository';
import { CompleteInitialAssessmentUseCase } from './use-cases/complete-initial-assessment.use-case';
import { TrainingModule } from '../training/training.module';

/** Dependencias: PrismaModule (@Global), TrainingModule (genera rutina post-assessment). */
@Module({
  imports: [TrainingModule],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    AssessmentScoringEngine,
    TdeeCalculatorEngine,
    MacroCalculatorEngine,
    AssessmentRepository,
    GoalRepository,
    CompleteInitialAssessmentUseCase,
  ],
  exports: [AssessmentService],
})
export class AssessmentModule {}
