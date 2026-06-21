import { SetMetadata } from '@nestjs/common';

export const REQUIRES_PREMIUM_KEY = 'requiresPremium';

/** Marca un endpoint como exclusivo de usuarios tier=premium (PremiumGuard). */
export const RequiresPremium = () => SetMetadata(REQUIRES_PREMIUM_KEY, true);
