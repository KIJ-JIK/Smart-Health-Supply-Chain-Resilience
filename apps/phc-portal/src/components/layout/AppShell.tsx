import React, { useEffect, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useUIStore } from '../../stores/uiStore';
import { useThemeStore } from '../../stores/themeStore';
import { DashboardView } from '../../modules/dashboard/DashboardView';
import { FacilityView } from '../../modules/facility/FacilityView';
import { EquipmentView } from '../../modules/equipment/EquipmentView';
import { InventoryView } from '../../modules/inventory/InventoryView';
import { BillingView } from '../../modules/billing/BillingView';
import { BedsView } from '../../modules/beds/BedsView';
import { OxygenView } from '../../modules/oxygen/OxygenView';
import { StaffView } from '../../modules/staff/StaffView';
import { FootfallView } from '../../modules/footfall/FootfallView';
import { RequestsView } from '../../modules/requests/RequestsView';
import { AlertsView } from '../../modules/alerts/AlertsView';
import { EmergencyView } from '../../modules/emergency/EmergencyView';
import { SyncStatusView } from '../../modules/sync/SyncStatusView';
import { ResilienceTestView } from '../../modules/testing/ResilienceTestView';
import { SettingsView } from '../../modules/settings/SettingsView';
import { EmergencyModal } from '../../modules/emergency/EmergencyModal';
import { AutoDraftModal } from '../../modules/autoDraft/AutoDraftModal';
import { LoginView } from '../../modules/auth/LoginView';
import { usePhcAuthStore } from '../../stores/authStore';
import { X, CheckCircle2, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export const AppShell: React.FC = () => {
  const { activeTab, toasts, removeToast } = useUIStore();
  const { isDark } = useThemeStore();
  const { isAuthenticated } = usePhcAuthStore();
  const [isLoginRoute, setIsLoginRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      return !isAuthenticated || window.location.pathname === '/login' || window.location.hash === '#login';
    }
    return !isAuthenticated;
  });

  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== 'undefined') {
        setIsLoginRoute(!isAuthenticated || window.location.pathname === '/login' || window.location.hash === '#login');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [isAuthenticated]);

  // Sync dark class to <html> on every render
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (!isAuthenticated || isLoginRoute) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setIsLoginRoute(false);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
          }
        }}
      />
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':   return <DashboardView />;
      case 'facility':    return <FacilityView />;
      case 'equipment':   return <EquipmentView />;
      case 'inventory':   return <InventoryView />;
      case 'billing':     return <BillingView />;
      case 'beds':        return <BedsView />;
      case 'oxygen':      return <OxygenView />;
      case 'staff':       return <StaffView />;
      case 'footfall':    return <FootfallView />;
      case 'requests':    return <RequestsView />;
      case 'alerts':      return <AlertsView />;
      case 'emergency':   return <EmergencyView />;
      case 'sync':        return <SyncStatusView />;
      case 'testing':     return <ResilienceTestView />;
      case 'settings':    return <SettingsView />;
      default:            return <DashboardView />;
    }
  };

  const toastStyles = {
    success: 'bg-emerald-950 text-emerald-100 border-emerald-800 shadow-emerald-900/50',
    error:   'bg-rose-950 text-rose-100 border-rose-800 shadow-rose-900/50',
    warning: 'bg-amber-950 text-amber-100 border-amber-800 shadow-amber-900/50',
    info:    'bg-navy-700 text-slate-100 border-navy-500 shadow-black/30',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#0a0f1a] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-7 pb-20 lg:pb-7">
          <div className="max-w-7xl mx-auto">
            {/* Keyed re-mount gives each tab its entrance animation */}
            <div
              key={activeTab}
              className="animate-slide-up-fade"
            >
              {renderActiveView()}
            </div>
          </div>
        </main>

        <BottomNav />
      </div>

      {/* Modals */}
      <EmergencyModal />
      <AutoDraftModal />

      {/* Toast stack */}
      <div className="fixed bottom-16 lg:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t, i) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold
              animate-slide-up-fade backdrop-blur-sm
              ${toastStyles[t.type as keyof typeof toastStyles] || toastStyles.info}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === 'error'   && <AlertOctagon  className="w-4 h-4 text-rose-400 shrink-0" />}
              {t.type === 'warning' && <AlertTriangle  className="w-4 h-4 text-amber-400 shrink-0" />}
              {t.type === 'info'    && <Info           className="w-4 h-4 text-sky-400 shrink-0" />}
              <span className="leading-snug">{t.text}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss"
              className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 transition-all shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
