import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UsePipes } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { registerDeviceTokenSchema, RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.list(user.id);
  }

  @Patch('notifications/:id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Patch('notifications/read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Post('notifications/device-tokens')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerDeviceTokenSchema))
  registerDeviceToken(@Body() dto: RegisterDeviceTokenDto, @CurrentUser() user: AuthUser) {
    return this.notificationsService.registerDeviceToken(user.id, dto);
  }

  @Delete('notifications/device-tokens/:deviceId')
  removeDeviceToken(@Param('deviceId') deviceId: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.removeDeviceToken(user.id, deviceId);
  }
}
