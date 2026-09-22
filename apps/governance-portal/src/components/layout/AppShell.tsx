'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CopilotDockedPanel } from '@/components/copilot/CopilotDockedPanel';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // On Homepage Hub and Login page, render clean full-screen view without internal portal sidebar/header
  if (pathname === '/' || pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="main-wrapper">
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="main-content" id="main-content">
          {children}
        </main>
      </div>

      {/* Docked Copilot Side Panel available on all pages without context switch */}
      <CopilotDockedPanel />
    </div>
  );
}
