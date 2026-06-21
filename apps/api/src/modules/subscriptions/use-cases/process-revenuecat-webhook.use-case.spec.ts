import { NotFoundException } from '@nestjs/common';
import { SubscriptionStatus, UserTier } from '@prisma/client';
import { ProcessRevenuecatWebhookUseCase } from './process-revenuecat-webhook.use-case';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';

function makeUseCase() {
  const subscriptionsRepository = {
    findUserByRevenuecatAppUserId: jest.fn().mockResolvedValue({ id: 'user-1' }),
    upsert: jest.fn().mockResolvedValue(undefined),
    updateUserTier: jest.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionsRepository;
  return { useCase: new ProcessRevenuecatWebhookUseCase(subscriptionsRepository), subscriptionsRepository };
}

function baseEvent(type: string, overrides: Record<string, unknown> = {}) {
  return { type, app_user_id: 'user-1', ...overrides };
}

describe('ProcessRevenuecatWebhookUseCase (FD-DB-08)', () => {
  it('lanza NotFoundException si el usuario no existe', async () => {
    const { useCase, subscriptionsRepository } = makeUseCase();
    (subscriptionsRepository.findUserByRevenuecatAppUserId as jest.Mock).mockResolvedValue(null);
    await expect(useCase.execute({ event: baseEvent('INITIAL_PURCHASE') } as never)).rejects.toThrow(NotFoundException);
  });

  it.each([
    ['INITIAL_PURCHASE', SubscriptionStatus.active, UserTier.premium],
    ['RENEWAL', SubscriptionStatus.active, UserTier.premium],
    ['UNCANCELLATION', SubscriptionStatus.active, UserTier.premium],
    ['PRODUCT_CHANGE', SubscriptionStatus.active, UserTier.premium],
    ['CANCELLATION', SubscriptionStatus.active, UserTier.premium], // sigue activa hasta current_period_end
    ['EXPIRATION', SubscriptionStatus.expired, UserTier.free],
    ['SUBSCRIPTION_PAUSED', SubscriptionStatus.paused, UserTier.free],
    ['BILLING_ISSUE', SubscriptionStatus.active, UserTier.premium], // grace period
  ])('mapea %s -> status %s -> tier %s', async (type, expectedStatus, expectedTier) => {
    const { useCase, subscriptionsRepository } = makeUseCase();
    await useCase.execute({ event: baseEvent(type as string) } as never);

    expect(subscriptionsRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ status: expectedStatus }));
    expect(subscriptionsRepository.updateUserTier).toHaveBeenCalledWith('user-1', expectedTier);
  });

  it('marca cancelAtPeriodEnd en true solo para CANCELLATION', async () => {
    const { useCase, subscriptionsRepository } = makeUseCase();
    await useCase.execute({ event: baseEvent('CANCELLATION') } as never);
    expect(subscriptionsRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ cancelAtPeriodEnd: true }));
  });

  it('mapea product_id "annual" a premium_annual', async () => {
    const { useCase, subscriptionsRepository } = makeUseCase();
    await useCase.execute({ event: baseEvent('INITIAL_PURCHASE', { product_id: 'com.app.premium_annual' }) } as never);
    expect(subscriptionsRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ planId: 'premium_annual' }));
  });

  it('mapea product_id sin "annual" a premium_monthly', async () => {
    const { useCase, subscriptionsRepository } = makeUseCase();
    await useCase.execute({ event: baseEvent('INITIAL_PURCHASE', { product_id: 'com.app.premium_monthly' }) } as never);
    expect(subscriptionsRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ planId: 'premium_monthly' }));
  });
});
