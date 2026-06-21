import { Injectable } from '@nestjs/common';
import { UserTier } from '@prisma/client';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';

@Injectable()
export class GetSubscriptionUseCase {
  constructor(private readonly subscriptionsRepository: SubscriptionsRepository) {}

  async execute(userId: string) {
    const subscription = await this.subscriptionsRepository.findByUserId(userId);
    if (!subscription) {
      return { tier: UserTier.free, subscription: null };
    }

    return {
      tier: subscription.status === 'trial' || subscription.status === 'active' ? UserTier.premium : UserTier.free,
      subscription: {
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEnd: subscription.trialEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    };
  }
}
