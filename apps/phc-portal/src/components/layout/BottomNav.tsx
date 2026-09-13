import React from 'react';
import { LayoutDashboard, Package, ReceiptText, Activity, Bell } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { PHCNavTab } from '../../types';

const tabs: { id: PHCNavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Home',      icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'billing',   label: 'Dispense',  icon: ReceiptText },
  { id: 'footfall',  label: 'Footfall',  icon: Activity },
  { id: 'alerts',    label: 'Alerts',    icon: Bell },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();

  const alertCount = useLiveQuery(async () =>
    db.alerts.where('status').equals('open').count(), []) || 0;

  const badgeMap: Partial<Record<PHCNavTab, number>> = {
    alerts: alertCount || 0,
  };

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0a0f1a]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-[#1e2d3d] shadow-[0_-1px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-1px_24px_rgba(0,0,0,0.5)] flex items-center justify-around px-2 py-2"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        const badge = badgeMap[id] ?? 0;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all duration-200 ${
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            {/* Active top pill */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full" />
            )}

            {/* Icon container with active bg */}
            <div className={`relative flex items-center justify-center w-9 h-7 rounded-xl mb-0.5 transition-all duration-200 ${
              isActive ? 'bg-primary-500/10 dark:bg-primary-500/15' : ''
            }`}>
              <Icon className={`transition-all duration-200 ${
                isActive
                  ? 'w-[18px] h-[18px] text-primary-600 dark:text-primary-400 scale-110'
                  : 'w-4 h-4 text-slate-400 dark:text-slate-600'
              }`} />

              {/* Badge */}
              {badge > 0 && (
                <span className="absolute top-0 right-0 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center text-[9px] font-black bg-rose-500 text-white rounded-full leading-none">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>

            <span className={`font-${isActive ? 'bold' : 'medium'}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
