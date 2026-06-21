import { Injectable } from '@nestjs/common';
import { GetDashboardSummaryUseCase } from './use-cases/get-dashboard-summary.use-case';

@Injectable()
export class DashboardService {
  constructor(private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase) {}

  getSummary(userId: string) {
    return this.getDashboardSummaryUseCase.execute(userId);
  }
}
