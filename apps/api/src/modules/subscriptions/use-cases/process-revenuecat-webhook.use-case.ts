import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus, UserTier } from '@prisma/client';
import { ErrorCode } from '@cali-nutri/shared-types';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { RevenuecatWebhookDto } from '../dto/revenuecat-webhook.dto';

const ACTIVE_TIER_STATUSES: SubscriptionStatus[] = [SubscriptionStatus.trial, SubscriptionStatus.active];

/**
 * POST /webhooks/revenuecat — FD-DB-08. RevenueCat es la fuente de verdad del
 * tier; `app_user_id` = users.id (FD-ARCH-01: el cliente identifica RevenueCat
 * con el mismo id de Supabase/users).
 */
@Injectable()
export class ProcessRevenuecatWebhookUseCase {
  private readonly logger = new Logger(ProcessRevenuecatWebhookUseCase.name);

  constructor(private readonly subscriptionsRepository: SubscriptionsRepository) {}

  async execute(dto: RevenuecatWebhookDto): Promise<{ processed: boolean }> {
    const { event } = dto;
    const userId = event.app_user_id;

    const user = await this.subscriptionsRepository.findUserByRevenuecatAppUserId(userId);
    if (!user) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: `Usuario ${userId} no existe.` });
    }

    const status = this.mapStatus(event.type);
    const cancelAtPeriodEnd = event.type === 'CANCELLATION';

    await this.subscriptionsRepository.upsert({
      userId,
      revenuecatUserId: userId,
      planId: this.mapPlan(event.product_id),
      status,
      currentPeriodStart: event.purchased_at_ms ? new Date(event.purchased_at_ms) : null,
      currentPeriodEnd: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
      trialEnd: event.period_type === 'TRIAL' && event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
      cancelAtPeriodEnd,
    });

    const tier: UserTier = ACTIVE_TIER_STATUSES.includes(status) ? UserTier.premium : UserTier.free;
    await this.subscriptionsRepository.updateUserTier(userId, tier);

    this.logger.log(`RevenueCat ${event.type} → user ${userId} → tier ${tier}`);
    return { processed: true };
  }

  private mapStatus(eventType: string): SubscriptionStatus {
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE':
        return SubscriptionStatus.active;
      case 'CANCELLATION':
        return SubscriptionStatus.active; // sigue activa hasta current_period_end
      case 'EXPIRATION':
        return SubscriptionStatus.expired;
      case 'SUBSCRIPTION_PAUSED':
        return SubscriptionStatus.paused;
      case 'BILLING_ISSUE':
        return SubscriptionStatus.active; // grace period — RevenueCat reintenta el cobro
      default:
        return SubscriptionStatus.expired;
    }
  }

  private mapPlan(productId?: string): SubscriptionPlan | null {
    if (!productId) return null;
    return productId.includes('annual') ? SubscriptionPlan.premium_annual : SubscriptionPlan.premium_monthly;
  }
}
