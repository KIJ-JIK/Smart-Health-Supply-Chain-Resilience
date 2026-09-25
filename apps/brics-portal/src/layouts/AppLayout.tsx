// ---------------------------------------------------------------------------
// AppLayout — Sidebar + Header + Content Area Layout Wrapper
// Clean white background & institutional government styling
// ---------------------------------------------------------------------------

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, Header } from '@/components/layout';

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#f8fafc]">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 pb-20 lg:pb-6 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
