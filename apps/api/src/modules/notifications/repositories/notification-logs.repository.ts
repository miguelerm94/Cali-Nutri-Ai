import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class NotificationLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string, limit = 50) {
    return this.prisma.notificationLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }

  countUnread(userId: string) {
    return this.prisma.notificationLog.count({ where: { userId, openedAt: null } });
  }

  markAsOpened(userId: string, id: string) {
    return this.prisma.notificationLog.updateMany({
      where: { id, userId, openedAt: null },
      data: { openedAt: new Date() },
    });
  }

  markAllAsOpened(userId: string) {
    return this.prisma.notificationLog.updateMany({
      where: { userId, openedAt: null },
      data: { openedAt: new Date() },
    });
  }

  create(params: { userId: string; type: NotificationType; deepLink?: string; platform?: string }) {
    return this.prisma.notificationLog.create({ data: params });
  }
}
