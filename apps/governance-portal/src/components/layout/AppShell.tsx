'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CopilotDockedPanel } from '@/components/copilot/CopilotDockedPanel';
import { SiteFooter } from './SiteFooter';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // On Homepage Hub, Login, Terms, and Privacy pages, render clean full-screen view without internal portal sidebar/header
  if (pathname === '/' || pathname === '/login' || pathname === '/terms' || pathname === '/privacy') {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="main-wrapper flex flex-col justify-between min-h-screen">
        <div>
          <Header
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          />
          <main className="main-content" id="main-content">
            {children}
          </main>
        </div>
        <SiteFooter />
      </div>

      {/* Docked Copilot Side Panel available on all pages without context switch */}
      <CopilotDockedPanel />
    </div>
  );
}
