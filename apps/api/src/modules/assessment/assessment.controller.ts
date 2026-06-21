import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { initialAssessmentSchema, InitialAssessmentDto } from './dto/initial-assessment.dto';

/** Base path: /assessment (API.md §4). */
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('initial')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(initialAssessmentSchema))
  completeInitial(@Body() dto: InitialAssessmentDto, @CurrentUser() user: AuthUser) {
    return this.assessmentService.completeInitial(user.id, dto);
  }
}
