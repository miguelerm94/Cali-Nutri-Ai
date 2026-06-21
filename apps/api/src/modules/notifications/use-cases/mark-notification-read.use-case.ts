import { Injectable } from '@nestjs/common';
import { NotificationLogsRepository } from '../repositories/notification-logs.repository';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(private readonly notificationLogsRepository: NotificationLogsRepository) {}

  async execute(userId: string, id: string): Promise<{ updated: boolean }> {
    const result = await this.notificationLogsRepository.markAsOpened(userId, id);
    return { updated: result.count > 0 };
  }
}
