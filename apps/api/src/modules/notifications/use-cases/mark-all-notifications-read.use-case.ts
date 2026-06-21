import { Injectable } from '@nestjs/common';
import { NotificationLogsRepository } from '../repositories/notification-logs.repository';

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notificationLogsRepository: NotificationLogsRepository) {}

  async execute(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationLogsRepository.markAllAsOpened(userId);
    return { updated: result.count };
  }
}
