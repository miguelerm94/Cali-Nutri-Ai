import { Module } from '@nestjs/common';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import { NotificationLogsRepository } from './repositories/notification-logs.repository';
import { ExpoPushAdapter } from './adapters/expo-push.adapter';
import { ListNotificationsUseCase } from './use-cases/list-notifications.use-case';
import { MarkNotificationReadUseCase } from './use-cases/mark-notification-read.use-case';
import { MarkAllNotificationsReadUseCase } from './use-cases/mark-all-notifications-read.use-case';
import { RegisterDeviceTokenUseCase } from './use-cases/register-device-token.use-case';
import { RemoveDeviceTokenUseCase } from './use-cases/remove-device-token.use-case';
import { SendNotificationUseCase } from './use-cases/send-notification.use-case';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

/**
 * S6a — Notificaciones (FD-INFRA-01 semana 11, FD-DB-10): registro de device
 * tokens, historial leído/no-leído, envío best-effort vía Expo Push API.
 *
 * Fuera de alcance (documentado, no es un olvido):
 *   - Scheduler de disparadores horarios (12:00/18:00/20:00 de FD-07,
 *     recordatorios de racha/entrenamiento): no existe infraestructura de
 *     cron en el proyecto aún. `SendNotificationUseCase` es el bloque base
 *     listo para conectarse cuando se construya.
 */
@Module({
  controllers: [NotificationsController],
  providers: [
    DeviceTokensRepository,
    NotificationLogsRepository,
    ExpoPushAdapter,
    ListNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    RegisterDeviceTokenUseCase,
    RemoveDeviceTokenUseCase,
    SendNotificationUseCase,
    NotificationsService,
  ],
  exports: [SendNotificationUseCase],
})
export class NotificationsModule {}
