// ---------------------------------------------------------------------------
// Root App Component for BRICS Federated Intelligence Portal (Vite SPA)
// Configures Apollo Provider, BrowserRouter, AppLayout, and all routes.
// ---------------------------------------------------------------------------

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloWrapper } from '@/components/providers';
import { AppLayout } from '@/layouts/AppLayout';
import {
  OverviewPage,
  NodesPage,
  RoundsPage,
  RoundReviewPage,
  LineagePage,
  PrivacyPage,
  SettingsPage,
} from '@/pages';

export function App() {
  return (
    <ApolloWrapper>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/nodes" element={<NodesPage />} />
            <Route path="/rounds" element={<RoundsPage />} />
            <Route path="/rounds/review" element={<RoundReviewPage />} />
            <Route path="/lineage" element={<LineagePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ApolloWrapper>
  );
}

export default App;
