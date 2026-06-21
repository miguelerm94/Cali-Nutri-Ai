import { Injectable } from '@nestjs/common';
import { CompleteInitialAssessmentUseCase, CompleteAssessmentResult } from './use-cases/complete-initial-assessment.use-case';
import { InitialAssessmentDto } from './dto/initial-assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(private readonly completeInitialAssessmentUseCase: CompleteInitialAssessmentUseCase) {}

  completeInitial(userId: string, dto: InitialAssessmentDto): Promise<CompleteAssessmentResult> {
    return this.completeInitialAssessmentUseCase.execute(userId, dto);
  }
}
