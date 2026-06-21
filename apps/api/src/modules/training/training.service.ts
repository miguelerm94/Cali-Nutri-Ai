import { Injectable } from '@nestjs/common';
import { StartSessionUseCase } from './use-cases/start-session.use-case';
import { LogSetUseCase } from './use-cases/log-set.use-case';
import { CompleteSessionUseCase } from './use-cases/complete-session.use-case';
import { CancelSessionUseCase } from './use-cases/cancel-session.use-case';
import { GetActiveProgramUseCase } from './use-cases/get-active-program.use-case';
import { GetTodayUseCase } from './use-cases/get-today.use-case';
import { GetSessionHistoryUseCase } from './use-cases/get-session-history.use-case';
import { GetSessionDetailUseCase } from './use-cases/get-session-detail.use-case';
import { GetExercisesUseCase } from './use-cases/get-exercises.use-case';
import { GetStagnationStatusUseCase } from './use-cases/get-stagnation-status.use-case';
import { StartSessionDto } from './dto/start-session.dto';
import { LogSetDto } from './dto/log-set.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { SessionsHistoryQueryDto, ExercisesQueryDto } from './dto/sessions-history-query.dto';

@Injectable()
export class TrainingService {
  constructor(
    private readonly startSessionUseCase: StartSessionUseCase,
    private readonly logSetUseCase: LogSetUseCase,
    private readonly completeSessionUseCase: CompleteSessionUseCase,
    private readonly cancelSessionUseCase: CancelSessionUseCase,
    private readonly getActiveProgramUseCase: GetActiveProgramUseCase,
    private readonly getTodayUseCase: GetTodayUseCase,
    private readonly getSessionHistoryUseCase: GetSessionHistoryUseCase,
    private readonly getSessionDetailUseCase: GetSessionDetailUseCase,
    private readonly getExercisesUseCase: GetExercisesUseCase,
    private readonly getStagnationStatusUseCase: GetStagnationStatusUseCase,
  ) {}

  getActiveProgram(userId: string) {
    return this.getActiveProgramUseCase.execute(userId);
  }

  getToday(userId: string) {
    return this.getTodayUseCase.execute(userId);
  }

  startSession(userId: string, dto: StartSessionDto) {
    return this.startSessionUseCase.execute(userId, dto.workout_day_id);
  }

  logSet(userId: string, sessionId: string, dto: LogSetDto) {
    return this.logSetUseCase.execute(userId, sessionId, dto);
  }

  completeSession(userId: string, sessionId: string, dto: CompleteSessionDto) {
    return this.completeSessionUseCase.execute(userId, sessionId, dto);
  }

  cancelSession(userId: string, sessionId: string) {
    return this.cancelSessionUseCase.execute(userId, sessionId);
  }

  getSessionHistory(userId: string, query: SessionsHistoryQueryDto) {
    return this.getSessionHistoryUseCase.execute(userId, query);
  }

  getSessionDetail(userId: string, sessionId: string) {
    return this.getSessionDetailUseCase.execute(userId, sessionId);
  }

  getExercises(query: ExercisesQueryDto) {
    return this.getExercisesUseCase.execute(query);
  }

  getStagnationStatus(userId: string) {
    return this.getStagnationStatusUseCase.execute(userId);
  }
}
