import { Body, Controller, ForbiddenException, Get, Headers, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@cali-nutri/shared-types';
import { SubscriptionsService } from './subscriptions.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { revenuecatWebhookSchema, RevenuecatWebhookDto } from './dto/revenuecat-webhook.dto';

/**
 * FD-DB-08: RevenueCat es la fuente de verdad del tier de suscripción.
 * El webhook es público (RevenueCat no envía un JWT de Supabase) pero se
 * valida con el header Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
 * configurado en el dashboard de RevenueCat.
 */
@Controller()
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('subscriptions/me')
  getMySubscription(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.getSubscription(user.id);
  }

  @Public()
  @Post('webhooks/revenuecat')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(revenuecatWebhookSchema))
  handleRevenuecatWebhook(@Body() dto: RevenuecatWebhookDto, @Headers('authorization') authorization?: string) {
    const expectedSecret = this.configService.get<string>('revenuecat.webhookSecret');
    if (expectedSecret) {
      const token = authorization?.replace(/^Bearer\s+/i, '');
      if (token !== expectedSecret) {
        throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Firma de webhook inválida.' });
      }
    }

    return this.subscriptionsService.processRevenuecatWebhook(dto);
  }
}
