import { Injectable } from '@nestjs/common';
import { NotificationLogsRepository } from '../repositories/notification-logs.repository';

@Injectable()
export class ListNotificationsUseCase {
  constructor(private readonly notificationLogsRepository: NotificationLogsRepository) {}

  async execute(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationLogsRepository.findByUserId(userId),
      this.notificationLogsRepository.countUnread(userId),
    ]);
    return { notifications, unreadCount };
  }
}
