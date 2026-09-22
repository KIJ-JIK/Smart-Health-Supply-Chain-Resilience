import { useBricsAuthStore } from '@/store/auth-store';
import type { CurrentUser } from '@/types/federated';

/**
 * Returns the current authenticated user and their active sovereign delegation.
 */
export function useCurrentUser(): CurrentUser {
  const currentUser = useBricsAuthStore((state) => state.currentUser);
  return currentUser;
}
