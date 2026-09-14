// ---------------------------------------------------------------------------
// Stub useCurrentUser() hook.
// Returns a fixed national_admin user as specified in the backend contract.
// An auth/session provider will be injected later; this stub allows UI
// development to proceed without waiting on the auth team.
// ---------------------------------------------------------------------------

import type { CurrentUser } from '@/types/federated';

const STUB_USER: CurrentUser = {
  id: 'usr-national-admin-001',
  name: 'Sumaiya Khan',
  email: 'sumaiya.khan@smarthealth.gov.in',
  role: 'national_admin',
};

/**
 * Returns the current authenticated user.
 *
 * **Stub implementation** — always returns a fixed `national_admin` user.
 * Replace with a real auth provider hook when the auth team delivers the
 * session integration.
 */
export function useCurrentUser(): CurrentUser {
  return STUB_USER;
}
