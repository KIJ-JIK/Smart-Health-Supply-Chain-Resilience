'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CopilotDockedPanel } from '@/components/copilot/CopilotDockedPanel';
import { SiteFooter } from './SiteFooter';
import { useAuthStore } from '@/store/authStore';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Read both auth state and the hydration flag from the store together.
  // _hasHydrated is set to true inside onRehydrateStorage, which fires once
  // Zustand's persist middleware has finished reading from localStorage.
  // This guarantees we never redirect before the persisted session is restored.
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeHydrated = useAuthStore((state) => state._hasHydrated);

  // Redirect to login if not authenticated on a protected route
  useEffect(() => {
    if (!storeHydrated) return;
    const publicPaths = ['/', '/login', '/terms', '/privacy'];
    if (!isAuthenticated && !publicPaths.includes(pathname)) {
      router.replace('/login');
    }
  }, [storeHydrated, isAuthenticated, pathname, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  // On Homepage Hub, Login, Terms, and Privacy pages, render clean full-screen view without internal portal sidebar/header
  const isPublicPath = ['/', '/login', '/terms', '/privacy'].includes(pathname);

  if (isPublicPath) {
    return <>{children}</>;
  }

  // Show nothing until we know whether the user is logged in.
  // This prevents both a flash of protected content and a premature redirect.
  if (!storeHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="app-layout">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => {
            // On desktop toggles collapsed, on mobile opens drawer
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setMobileSidebarOpen((o) => !o);
            } else {
              setSidebarCollapsed((c) => !c);
            }
          }}
        />
        <main className="main-content flex-1 overflow-y-auto" id="main-content">
          <div className="min-h-[calc(100vh-180px)]">
            {children}
          </div>
          <SiteFooter className="mt-8 -mx-6 -mb-6" />
        </main>
      </div>

      {/* Docked Copilot Side Panel available on all pages without context switch */}
      <CopilotDockedPanel />
    </div>
  );
}
