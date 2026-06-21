import { Injectable } from '@nestjs/common';
import { HealthDataRepository } from '../repositories/health-data.repository';

@Injectable()
export class GetTodayStepsUseCase {
  constructor(private readonly healthDataRepository: HealthDataRepository) {}

  async execute(userId: string, date: Date): Promise<number | undefined> {
    const records = await this.healthDataRepository.findByUserAndDate(userId, date);
    const steps = records.reduce((total, record) => total + (record.steps ?? 0), 0);
    return records.length > 0 ? steps : undefined;
  }
}
