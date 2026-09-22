// ---------------------------------------------------------------------------
// Apollo Client — connected to the Node.js backend GraphQL server.
// Backend: http://localhost:8000/graphql (VITE_BACKEND_URL override)
// Falls back to mock SchemaLink if VITE_USE_MOCK=true (offline/CI mode).
// ---------------------------------------------------------------------------

import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { SchemaLink } from '@apollo/client/link/schema';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:8000/graphql';

// Auth header injection
const authLink = setContext((_, { headers }) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('brics_auth_token') : null;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message }) => console.warn('[BRICS GQL]', message));
  }
  if (networkError) console.warn('[BRICS Network]', networkError);
});

const httpLink = new HttpLink({ uri: BACKEND_URL });

// Fallback mock schema for offline/CI use
const mockSchema = makeExecutableSchema({ typeDefs, resolvers });
const mockLink = new SchemaLink({ schema: mockSchema });

const useMock = import.meta.env?.VITE_USE_MOCK !== 'false';

export const apolloClient = new ApolloClient({
  link: useMock ? mockLink : from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
