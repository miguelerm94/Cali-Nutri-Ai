import { Injectable } from '@nestjs/common';
import { GetSubscriptionUseCase } from './use-cases/get-subscription.use-case';
import { ProcessRevenuecatWebhookUseCase } from './use-cases/process-revenuecat-webhook.use-case';
import { RevenuecatWebhookDto } from './dto/revenuecat-webhook.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
    private readonly processRevenuecatWebhookUseCase: ProcessRevenuecatWebhookUseCase,
  ) {}

  getSubscription(userId: string) {
    return this.getSubscriptionUseCase.execute(userId);
  }

  processRevenuecatWebhook(dto: RevenuecatWebhookDto) {
    return this.processRevenuecatWebhookUseCase.execute(dto);
  }
}
