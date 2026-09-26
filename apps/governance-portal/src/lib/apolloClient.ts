// ─────────────────────────────────────────────────────────────────────────────
// Apollo Client — real HttpLink connected directly to the Express + GraphQL backend.
// Strict live database queries; all mock fallbacks and mock links eliminated.
// Backend: http://localhost:8000/graphql (NEXT_PUBLIC_BACKEND_URL override)
// ─────────────────────────────────────────────────────────────────────────────
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

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

// ── Error link — logs GQL errors and surfaces real failures ────────────────────
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(`[Governance GraphQL Error] ${message}`, { locations, path }),
    );
  }
  if (networkError) {
    console.error('[Governance GraphQL Network Error]', networkError);
  }
});

// ── Apollo Client singleton ───────────────────────────────────────────────────
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    },
    query: {
      fetchPolicy: 'cache-first',
    },
  },
});

