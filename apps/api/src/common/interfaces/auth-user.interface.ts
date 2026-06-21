import { UserTierLiteral } from '@cali-nutri/shared-types';

/** Forma de req.user adjuntada por JwtAuthGuard. Fuente: BackendArchitecture.md §8. */
export interface AuthUser {
  id: string;
  email: string;
  tier: UserTierLiteral;
  onboarding_complete: boolean;
}
