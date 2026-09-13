import React, { useState } from 'react';
import {
  LayoutDashboard, Building2, Package, ReceiptText, BedDouble,
  Wind, Wrench, Users, Activity, SendHorizontal, Bell, AlertOctagon,
  RefreshCw, FlaskConical, Settings, ChevronLeft, ChevronRight,
  HeartPulse,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useMutationQueue } from '../../hooks/useMutationQueue';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { PHCNavTab } from '../../types';

interface NavItem {
  id: PHCNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'red' | 'amber' | 'teal';
}

const groups = [
  {
    label: 'Core Operations',
    items: ['dashboard', 'facility', 'inventory', 'billing'] as PHCNavTab[],
  },
  {
    label: 'Resource Logistics',
    items: ['beds', 'oxygen', 'equipment', 'staff', 'footfall'] as PHCNavTab[],
  },
  {
    label: 'Governance & Sync',
    items: ['requests', 'alerts', 'emergency', 'sync', 'testing', 'settings'] as PHCNavTab[],
  },
];

const iconMap: Record<PHCNavTab, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  facility:  Building2,
  inventory: Package,
  billing:   ReceiptText,
  beds:      BedDouble,
  oxygen:    Wind,
  equipment: Wrench,
  staff:     Users,
  footfall:  Activity,
  requests:  SendHorizontal,
  alerts:    Bell,
  emergency: AlertOctagon,
  sync:      RefreshCw,
  testing:   FlaskConical,
  settings:  Settings,
};

const labelMap: Record<PHCNavTab, string> = {
  dashboard: 'Dashboard',
  facility:  'Facility',
  inventory: 'Inventory & Batches',
  billing:   'Billing / Dispensing',
  beds:      'Beds Management',
  oxygen:    'Oxygen Supply',
  equipment: 'Equipment & Bio-Med',
  staff:     'Staff & Attendance',
  footfall:  'Patient Footfall',
  requests:  'Resource Requests',
  alerts:    'Alerts & Flags',
  emergency: 'Emergency Center',
  sync:      'Sync & Conflicts',
  testing:   'Offline Resilience Lab',
  settings:  'Settings & Config',
};

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();
  const { conflictCount, pendingCount } = useMutationQueue();
  const [collapsed, setCollapsed] = useState(false);

  const openAlertsCount = useLiveQuery(async () =>
    db.alerts.where('status').equals('open').count(), []) || 0;

  const pendingRequestsCount = useLiveQuery(async () =>
    db.resource_requests.where('status').equals('pending').count(), []) || 0;

  const badgeMap: Partial<Record<PHCNavTab, { count: number | string; variant: 'red' | 'amber' | 'teal' }>> = {
    requests: pendingRequestsCount > 0 ? { count: pendingRequestsCount, variant: 'teal' } : undefined as any,
    alerts:   openAlertsCount > 0      ? { count: openAlertsCount,      variant: 'red' }  : undefined as any,
    sync:     conflictCount > 0
                ? { count: `${conflictCount}!`, variant: 'red' }
                : pendingCount > 0
                  ? { count: pendingCount, variant: 'amber' }
                  : undefined as any,
  };

  const NavBtn = ({ id }: { id: PHCNavTab }) => {
    const Icon = iconMap[id];
    const isActive = activeTab === id;
    const badge = badgeMap[id];

    return (
      <button
        onClick={() => setActiveTab(id)}
        title={collapsed ? labelMap[id] : undefined}
        aria-current={isActive ? 'page' : undefined}
        aria-label={labelMap[id]}
        className={`
          relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium
          transition-all duration-200 group select-none
          ${isActive
            ? 'bg-gradient-to-r from-primary-600/20 to-primary-500/10 text-primary-400 font-semibold nav-active-glow'
            : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
          }
          ${collapsed ? 'justify-center px-2' : ''}
        `}
      >
        {/* Active left bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
        )}

        <Icon
          className={`shrink-0 transition-all duration-200 group-hover:scale-110 ${
            collapsed ? 'w-5 h-5' : 'w-4 h-4'
          } ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}`}
        />

        {!collapsed && (
          <span className="truncate flex-1 text-left">{labelMap[id]}</span>
        )}

        {/* Badge */}
        {badge && !collapsed && (
          <span className={`ml-auto shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-black ${
            badge.variant === 'red'   ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30' :
            badge.variant === 'amber' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' :
                                        'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30'
          }`}>
            {badge.count}
          </span>
        )}

        {/* Collapsed dot badge */}
        {badge && collapsed && (
          <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
            badge.variant === 'red' ? 'bg-rose-500' : badge.variant === 'amber' ? 'bg-amber-500' : 'bg-primary-500'
          }`} />
        )}
      </button>
    );
  };

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={`
        hidden lg:flex flex-col
        bg-[#0a0f1a] border-r border-[#1e2d3d]
        shrink-0 select-none overflow-hidden
        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-[#1e2d3d] ${collapsed ? 'justify-center' : ''}`}>
        <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-[0_0_12px_rgba(13,148,136,0.4)]">
          <HeartPulse className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-white leading-tight whitespace-nowrap">Smart Health</div>
            <div className="text-[10px] text-slate-500 whitespace-nowrap">Offline-First Edge Portal</div>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {groups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'pt-4' : ''}>
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                {group.label}
              </div>
            )}
            {collapsed && gi > 0 && (
              <div className="my-2 mx-2 border-t border-[#1e2d3d]" />
            )}
            <div className="space-y-0.5">
              {group.items.map((id) => <NavBtn key={id} id={id} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`p-3 border-t border-[#1e2d3d] flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
            <span className="text-[11px] text-slate-600 font-mono">v1.0.4</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft  className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
