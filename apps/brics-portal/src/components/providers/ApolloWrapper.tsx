// ---------------------------------------------------------------------------
// ApolloProvider wrapper for Vite SPA.
// Wraps children with ApolloProvider using the local mock client.
// ---------------------------------------------------------------------------

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/graphql/client';

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
