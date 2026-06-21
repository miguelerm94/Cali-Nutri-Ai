import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { NotificationLogsRepository } from '../repositories/notification-logs.repository';
import { ExpoPushAdapter } from '../adapters/expo-push.adapter';

/**
 * Bloque base para los disparadores programados (12:00/18:00/20:00 de FD-07,
 * recordatorios de entrenamiento/racha): aún no existe un scheduler (S6a no
 * lo incluye), así que hoy esto solo se invoca manualmente o vía tool calls
 * de CALI. El cron queda diferido a una tarea futura de infraestructura.
 */
@Injectable()
export class SendNotificationUseCase {
  constructor(
    private readonly deviceTokensRepository: DeviceTokensRepository,
    private readonly notificationLogsRepository: NotificationLogsRepository,
    private readonly expoPushAdapter: ExpoPushAdapter,
  ) {}

  async execute(params: { userId: string; type: NotificationType; title: string; body: string; deepLink?: string }) {
    const { userId, type, title, body, deepLink } = params;
    const devices = await this.deviceTokensRepository.findByUserId(userId);

    await this.expoPushAdapter.send(
      devices.map((d) => d.token),
      title,
      body,
      deepLink ? { deepLink } : undefined,
    );

    return this.notificationLogsRepository.create({ userId, type, deepLink, platform: devices[0]?.platform });
  }
}
