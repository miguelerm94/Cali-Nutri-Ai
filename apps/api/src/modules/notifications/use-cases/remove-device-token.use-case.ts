import { Injectable } from '@nestjs/common';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';

@Injectable()
export class RemoveDeviceTokenUseCase {
  constructor(private readonly deviceTokensRepository: DeviceTokensRepository) {}

  async execute(userId: string, deviceId: string): Promise<{ removed: boolean }> {
    await this.deviceTokensRepository.removeByDeviceId(userId, deviceId);
    return { removed: true };
  }
}
