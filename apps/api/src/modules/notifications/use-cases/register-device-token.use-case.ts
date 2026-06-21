import { Injectable } from '@nestjs/common';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { RegisterDeviceTokenDto } from '../dto/register-device-token.dto';

@Injectable()
export class RegisterDeviceTokenUseCase {
  constructor(private readonly deviceTokensRepository: DeviceTokensRepository) {}

  execute(userId: string, dto: RegisterDeviceTokenDto) {
    return this.deviceTokensRepository.upsert({ userId, ...dto });
  }
}
