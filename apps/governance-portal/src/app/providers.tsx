'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apolloClient';
import { AutoTranslateProvider } from '@/components/common/AutoTranslateProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <AutoTranslateProvider>{children}</AutoTranslateProvider>
    </ApolloProvider>
  );
}

