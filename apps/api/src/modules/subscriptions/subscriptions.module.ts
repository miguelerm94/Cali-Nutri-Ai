import { Module } from '@nestjs/common';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { GetSubscriptionUseCase } from './use-cases/get-subscription.use-case';
import { ProcessRevenuecatWebhookUseCase } from './use-cases/process-revenuecat-webhook.use-case';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

/**
 * S6a — Monetización (FD-INFRA-01 semana 11): RevenueCat es la fuente de
 * verdad del tier (FD-DB-08). NestJS solo refleja el estado vía webhook.
 */
@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsRepository, GetSubscriptionUseCase, ProcessRevenuecatWebhookUseCase, SubscriptionsService],
})
export class SubscriptionsModule {}
