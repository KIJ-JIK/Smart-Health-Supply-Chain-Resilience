import React from 'react';
import { LayoutDashboard, Package, ReceiptText, Activity, Bell } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { PHCNavTab } from '../../types';
import { useLanguageStore } from '../../stores/languageStore';

const tabs: { id: PHCNavTab; labelKey: string; defaultLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', labelKey: 'nav.mobile.dashboard', defaultLabel: 'Home',     icon: LayoutDashboard },
  { id: 'inventory', labelKey: 'nav.mobile.inventory', defaultLabel: 'Stock',    icon: Package },
  { id: 'billing',   labelKey: 'nav.mobile.billing',   defaultLabel: 'Dispense', icon: ReceiptText },
  { id: 'footfall',  labelKey: 'nav.mobile.footfall',  defaultLabel: 'Footfall', icon: Activity },
  { id: 'alerts',    labelKey: 'nav.mobile.alerts',    defaultLabel: 'Alerts',   icon: Bell },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();
  const { t } = useLanguageStore();

  const alertCount = useLiveQuery(async () =>
    db.alerts.where('status').equals('open').count(), []) || 0;

  const badgeMap: Partial<Record<PHCNavTab, number>> = {
    alerts: alertCount || 0,
  };

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0a0f1a]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-[#1e2d3d] shadow-[0_-1px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-1px_24px_rgba(0,0,0,0.5)] flex items-center justify-around px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {tabs.map(({ id, labelKey, defaultLabel, icon: Icon }) => {
        const isActive = activeTab === id;
        const badge = badgeMap[id] ?? 0;
        const label = t(labelKey, defaultLabel);
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            className={`relative flex flex-col items-center justify-center flex-1 py-0.5 text-[10px] sm:text-[11px] font-medium transition-all duration-200 ${
              isActive
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {/* Active top pill */}
            {isActive && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary-500 rounded-full" />
            )}

            {/* Icon container with active bg */}
            <div className={`relative flex items-center justify-center w-8 h-6 rounded-lg mb-0.5 transition-all duration-200 ${
              isActive ? 'bg-primary-500/10 dark:bg-primary-500/20' : ''
            }`}>
              <Icon className={`transition-all duration-200 ${
                isActive
                  ? 'w-4 h-4 text-primary-600 dark:text-primary-400 scale-110'
                  : 'w-4 h-4 text-slate-400 dark:text-slate-500'
              }`} />

              {/* Badge */}
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[12px] h-3 px-0.5 flex items-center justify-center text-[8px] font-black bg-rose-500 text-white rounded-full leading-none">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>

            <span className="truncate max-w-[60px]">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
