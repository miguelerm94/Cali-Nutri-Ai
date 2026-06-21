import { Injectable } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus, UserTier } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  findByRevenuecatUserId(revenuecatUserId: string) {
    return this.prisma.subscription.findUnique({ where: { revenuecatUserId } });
  }

  upsert(params: {
    userId: string;
    revenuecatUserId: string;
    planId: SubscriptionPlan | null;
    status: SubscriptionStatus;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    trialEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  }) {
    return this.prisma.subscription.upsert({
      where: { userId: params.userId },
      create: params,
      update: {
        revenuecatUserId: params.revenuecatUserId,
        planId: params.planId,
        status: params.status,
        currentPeriodStart: params.currentPeriodStart,
        currentPeriodEnd: params.currentPeriodEnd,
        trialEnd: params.trialEnd,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd,
      },
    });
  }

  /** RevenueCat es la fuente de verdad del tier — sincronizado vía webhook (FD-DB-08). */
  updateUserTier(userId: string, tier: UserTier) {
    return this.prisma.user.update({ where: { id: userId }, data: { tier } });
  }

  findUserByRevenuecatAppUserId(revenuecatUserId: string) {
    return this.prisma.user.findUnique({ where: { id: revenuecatUserId } });
  }
}
