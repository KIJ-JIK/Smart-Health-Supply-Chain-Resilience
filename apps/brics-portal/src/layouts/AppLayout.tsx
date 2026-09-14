// ---------------------------------------------------------------------------
// AppLayout — the sidebar + header + content area layout wrapper for Vite.
// Uses React Router's <Outlet /> for nested route rendering.
// ---------------------------------------------------------------------------

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, Header } from '@/components/layout';
import { colors } from '@/styles/theme';

export function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bg.base }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <main
          style={{
            flex: 1,
            padding: 24,
            backgroundColor: colors.bg.base,
            color: colors.text.primary,
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
