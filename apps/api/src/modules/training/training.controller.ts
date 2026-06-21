import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { startSessionSchema, StartSessionDto } from './dto/start-session.dto';
import { logSetSchema, LogSetDto } from './dto/log-set.dto';
import { completeSessionSchema, CompleteSessionDto } from './dto/complete-session.dto';
import { sessionsHistoryQuerySchema, exercisesQuerySchema, SessionsHistoryQueryDto, ExercisesQueryDto } from './dto/sessions-history-query.dto';

/** Base path: /training (API.md §5). */
@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('programs/active')
  getActiveProgram(@CurrentUser() user: AuthUser) {
    return this.trainingService.getActiveProgram(user.id);
  }

  @Get('today')
  getToday(@CurrentUser() user: AuthUser) {
    return this.trainingService.getToday(user.id);
  }

  @Get('stagnation-status')
  getStagnationStatus(@CurrentUser() user: AuthUser) {
    return this.trainingService.getStagnationStatus(user.id);
  }

  @Get('exercises')
  @UsePipes(new ZodValidationPipe(exercisesQuerySchema))
  getExercises(@Query() query: ExercisesQueryDto) {
    return this.trainingService.getExercises(query);
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(startSessionSchema))
  startSession(@Body() dto: StartSessionDto, @CurrentUser() user: AuthUser) {
    return this.trainingService.startSession(user.id, dto);
  }

  @Get('sessions')
  @UsePipes(new ZodValidationPipe(sessionsHistoryQuerySchema))
  getSessionHistory(@Query() query: SessionsHistoryQueryDto, @CurrentUser() user: AuthUser) {
    return this.trainingService.getSessionHistory(user.id, query);
  }

  @Get('sessions/:sessionId')
  getSessionDetail(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthUser) {
    return this.trainingService.getSessionDetail(user.id, sessionId);
  }

  @Post('sessions/:sessionId/logs')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(logSetSchema))
  logSet(@Param('sessionId') sessionId: string, @Body() dto: LogSetDto, @CurrentUser() user: AuthUser) {
    return this.trainingService.logSet(user.id, sessionId, dto);
  }

  @Patch('sessions/:sessionId/complete')
  @UsePipes(new ZodValidationPipe(completeSessionSchema))
  completeSession(@Param('sessionId') sessionId: string, @Body() dto: CompleteSessionDto, @CurrentUser() user: AuthUser) {
    return this.trainingService.completeSession(user.id, sessionId, dto);
  }

  @Delete('sessions/:sessionId')
  cancelSession(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthUser) {
    return this.trainingService.cancelSession(user.id, sessionId);
  }
}
