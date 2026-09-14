// ---------------------------------------------------------------------------
// Apollo Client configuration with a local-only mock link.
// Uses SchemaLink to resolve queries against in-memory mock resolvers
// so the portal works without a live backend during development.
// ---------------------------------------------------------------------------

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { SchemaLink } from '@apollo/client/link/schema';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

// Build an executable schema from our type definitions and mock resolvers
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create the Apollo Client with a SchemaLink — all queries resolve locally
export const apolloClient = new ApolloClient({
  link: new SchemaLink({ schema }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
