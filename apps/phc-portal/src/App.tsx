import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { initializeDatabase } from './db/seedData';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
    },
  },
});

export function App() {
  useEffect(() => {
    initializeDatabase().catch((err) => {
      console.error('Failed to initialize local IndexedDB:', err);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

export default App;
