// ---------------------------------------------------------------------------
// Apollo Client — connected to the Node.js backend GraphQL server with
// seamless mock schema fallback for standalone/offline operation.
// ---------------------------------------------------------------------------

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, from, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { SchemaLink } from '@apollo/client/link/schema';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || '/graphql';

// Executable mock schema for offline/standalone development
const mockSchema = makeExecutableSchema({ typeDefs, resolvers });
const mockLink = new SchemaLink({ schema: mockSchema });

// If VITE_USE_MOCK is explicitly 'true', force mock schema; otherwise attempt live backend with automatic resilient fallback
const forceMock = import.meta.env?.VITE_USE_MOCK === 'true';

// Resilient fallback link: if network fails with 500 or connection error, fallback to mockLink
const resilientFallbackLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    let sub: any;
    try {
      sub = forward(operation).subscribe({
        next: (result) => {
          if (result.errors && result.errors.length > 0 && !result.data) {
            console.warn('[BRICS GQL] Network returned GraphQL errors with no data, falling back to mock schema');
            mockLink.request(operation)?.subscribe(observer);
          } else {
            observer.next(result);
          }
        },
        error: (networkErr) => {
          console.warn('[BRICS GQL] Backend unavailable, gracefully falling back to mock schema:', networkErr.message);
          mockLink.request(operation)?.subscribe(observer);
        },
        complete: () => observer.complete(),
      });
    } catch (err) {
      mockLink.request(operation)?.subscribe(observer);
    }
    return () => sub?.unsubscribe();
  });
});

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
const networkPipeline = from([resilientFallbackLink, errorLink, authLink, httpLink]);

export const apolloClient = new ApolloClient({
  link: forceMock ? mockLink : networkPipeline,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});

