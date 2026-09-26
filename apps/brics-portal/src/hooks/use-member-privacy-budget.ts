import { useQuery } from '@apollo/client';
import { GET_FEDERATED_PRIVACY_BUDGET } from '@/graphql';
import type { PrivacyBudgetEntry } from '@/types/federated';

export interface MemberPrivacyBudgetResult {
  cumulativeEpsilon: number;
  budgetLimit: number;
  latestEntry: PrivacyBudgetEntry | null;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Custom hook to retrieve the current privacy budget status for a given BRICS member nation.
 * Defaults to South Africa (Member 4 - 'ZA').
 */
export function useMemberPrivacyBudget(targetCountryCode = 'ZA'): MemberPrivacyBudgetResult {
  const { data, loading, error } = useQuery<{
    federatedPrivacyBudget: PrivacyBudgetEntry[];
  }>(GET_FEDERATED_PRIVACY_BUDGET, {
    fetchPolicy: 'cache-first',
  });

  const entries = data?.federatedPrivacyBudget || [];
  const memberEntries = entries.filter(
    (e) => e.countryId === targetCountryCode
  );

  const latestEntry = memberEntries.length > 0
    ? memberEntries.reduce((prev, curr) =>
        curr.cumulativeEpsilon > prev.cumulativeEpsilon ? curr : prev
      )
    : null;

  const cumulativeEpsilon = latestEntry?.cumulativeEpsilon ?? 0;
  const budgetLimit = latestEntry?.budgetLimit ?? 10.0;

  return {
    cumulativeEpsilon,
    budgetLimit,
    latestEntry,
    loading,
    error,
  };
}
