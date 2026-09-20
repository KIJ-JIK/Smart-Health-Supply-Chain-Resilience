// ─────────────────────────────────────────────────────────────────────────────
// Apollo Client — wired to a SchemaLink + mock resolvers.
// When the backend is live, replace the `link` with an HttpLink pointing at
// the real GraphQL endpoint.
// ─────────────────────────────────────────────────────────────────────────────
import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  Observable,
  FetchResult,
} from '@apollo/client';
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

// ── Root field resolver map ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolvers: Record<string, (variables: any) => unknown> = {
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

// ── Inline mock link that intercepts all operations ───────────────────────────
const mockLink = new ApolloLink((operation) => {
  return new Observable<FetchResult>((observer) => {
    const { query, variables } = operation;
    const printed = print(query);

    // Parse out which root fields are being requested
    // and resolve each one from the mock map.
    const selectionMatch = printed.match(/\b(\w+)\s*[({]/g);
    const data: Record<string, unknown> = {};

    if (selectionMatch) {
      for (const sel of selectionMatch) {
        const field = sel.replace(/[\s({]/g, '');
        if (resolvers[field]) {
          // Pass variables for field-specific resolvers
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data[field] = resolvers[field](variables as any);
        }
      }
    }

    // Simulate async network latency
    const timer = setTimeout(() => {
      observer.next({ data });
      observer.complete();
    }, 200 + Math.random() * 300);

    return () => clearTimeout(timer);
  });
});

// ── Apollo Client singleton ───────────────────────────────────────────────────
export const apolloClient = new ApolloClient({
  link: mockLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});
