// ─────────────────────────────────────────────────────────────────────────────
// Apollo Client — real HttpLink connected to the Node.js backend GraphQL.
// Falls back to mock resolvers if the backend is unreachable (offline/CI mode).
// Backend: http://localhost:8000/graphql (NEXT_PUBLIC_BACKEND_URL override)
// ─────────────────────────────────────────────────────────────────────────────
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
  FetchResult,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { print } from 'graphql';
import {
  mockNationalOverview,
  mockStateOverview,
  mockDistrictOverview,
  mockPhcDetail,
  mockMedicineIntelligence,
  mockResourceIntelligence,
  mockWorkforceIntelligence,
  mockPatientIntelligence,
  mockForecasts,
  mockRedistributionRecommendations,
  mockSupplyChainShipments,
  mockAuditLog,
} from '../graphql/mockResolvers';

// ── Backend URL ───────────────────────────────────────────────────────────────
const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) ||
  'http://localhost:8000/graphql';

// ── Auth header injection ─────────────────────────────────────────────────────
// Reads JWT from localStorage (set by the auth store after login).
const authLink = setContext((_, { headers }) => {
  let token: string | null = null;
  try {
    token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  } catch {
    // SSR — no localStorage
  }
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  };
});

// ── Real HTTP link ────────────────────────────────────────────────────────────
const httpLink = new HttpLink({ uri: BACKEND_URL, fetch });

// ── Error link — logs GQL errors in dev ──────────────────────────────────────
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (process.env.NODE_ENV === 'development') {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.warn(`[GraphQL] ${message}`, { locations, path }),
      );
    }
    if (networkError) {
      console.warn('[GraphQL Network Error]', networkError);
    }
  }
});

// ── Fallback mock link (used when backend unreachable or in offline/CI mode) ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockResolvers: Record<string, (variables: any) => unknown> = {
  nationalOverview: () => mockNationalOverview(),
  stateOverview: ({ stateId }: { stateId: string }) => mockStateOverview(stateId),
  districtOverview: ({ districtId }: { districtId: string }) => mockDistrictOverview(districtId),
  phcDetail: ({ phcId }: { phcId: string }) => mockPhcDetail(phcId),
  medicineIntelligence: () => mockMedicineIntelligence(),
  resourceIntelligence: () => mockResourceIntelligence(),
  workforceIntelligence: () => mockWorkforceIntelligence(),
  patientIntelligence: () => mockPatientIntelligence(),
  forecasts: (vars: { metric?: string }) => mockForecasts(vars?.metric ?? 'stockDays'),
  redistributionRecommendations: () => mockRedistributionRecommendations(),
  supplyChainShipments: () => mockSupplyChainShipments(),
  auditLog: () => mockAuditLog(),
};

export const mockLink = new ApolloLink((operation) => {
  return new Observable<FetchResult>((observer) => {
    const { query, variables } = operation;
    const printed = print(query);
    const selectionMatch = printed.match(/\b(\w+)\s*[({]/g);
    const data: Record<string, unknown> = {};
    if (selectionMatch) {
      for (const sel of selectionMatch) {
        const field = sel.replace(/[\s({]/g, '');
        if (mockResolvers[field]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data[field] = mockResolvers[field](variables as any);
        }
      }
    }
    const timer = setTimeout(() => {
      observer.next({ data });
      observer.complete();
    }, 200 + Math.random() * 300);
    return () => clearTimeout(timer);
  });
});

// ── Apollo Client singleton ───────────────────────────────────────────────────
// Uses real backend link. Set NEXT_PUBLIC_USE_MOCK=true in .env.local to force mock.
const useMock =
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USE_MOCK === 'true';

export const apolloClient = new ApolloClient({
  link: useMock ? mockLink : from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});
