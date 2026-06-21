import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class DeviceTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(params: { userId: string; token: string; platform: string; deviceId: string; appVersion?: string }) {
    const { userId, deviceId, ...rest } = params;
    return this.prisma.deviceToken.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: { userId, deviceId, ...rest },
      update: { ...rest },
    });
  }

  removeByDeviceId(userId: string, deviceId: string) {
    return this.prisma.deviceToken.deleteMany({ where: { userId, deviceId } });
  }

  findByUserId(userId: string) {
    return this.prisma.deviceToken.findMany({ where: { userId } });
  }
}
