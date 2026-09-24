// ---------------------------------------------------------------------------
// AppLayout — Sidebar + Header + Content Area Layout Wrapper
// Aligned with dark Command Center design system.
// ---------------------------------------------------------------------------

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, Header } from '@/components/layout';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 flex flex-row font-sans selection:bg-teal-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#0a0f1a] overflow-y-auto max-w-[1600px] w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
