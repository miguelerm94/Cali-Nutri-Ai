import { Injectable } from '@nestjs/common';
import { ListNotificationsUseCase } from './use-cases/list-notifications.use-case';
import { MarkNotificationReadUseCase } from './use-cases/mark-notification-read.use-case';
import { MarkAllNotificationsReadUseCase } from './use-cases/mark-all-notifications-read.use-case';
import { RegisterDeviceTokenUseCase } from './use-cases/register-device-token.use-case';
import { RemoveDeviceTokenUseCase } from './use-cases/remove-device-token.use-case';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly registerDeviceTokenUseCase: RegisterDeviceTokenUseCase,
    private readonly removeDeviceTokenUseCase: RemoveDeviceTokenUseCase,
  ) {}

  list(userId: string) {
    return this.listNotificationsUseCase.execute(userId);
  }

  markRead(userId: string, id: string) {
    return this.markNotificationReadUseCase.execute(userId, id);
  }

  markAllRead(userId: string) {
    return this.markAllNotificationsReadUseCase.execute(userId);
  }

  registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    return this.registerDeviceTokenUseCase.execute(userId, dto);
  }

  removeDeviceToken(userId: string, deviceId: string) {
    return this.removeDeviceTokenUseCase.execute(userId, deviceId);
  }
}
