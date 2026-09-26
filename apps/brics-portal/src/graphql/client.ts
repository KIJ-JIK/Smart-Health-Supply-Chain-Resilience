// ---------------------------------------------------------------------------
// Apollo Client — connected directly to the backend GraphQL server at
// http://localhost:8000/graphql. All mock schemas and fallback links eliminated.
// ---------------------------------------------------------------------------

import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

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
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.warn(`[BRICS GQL Error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    );
  }
  if (networkError) {
    console.warn('[BRICS Network Error]:', networkError);
  }
});

const httpLink = new HttpLink({ uri: BACKEND_URL });

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});


