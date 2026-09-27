// ---------------------------------------------------------------------------
// Left navigation sidebar for the BRICS Federated Intelligence & Governance Portal.
// Styled in deep institutional navy blue (#0b1e36) matching the top heading banner.
// ---------------------------------------------------------------------------

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Activity,
  GitBranch,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  FileCheck2,
  Globe2,
} from 'lucide-react';
import { useUIStore } from '@/store';
import { useMemberPrivacyBudget } from '@/hooks';
import { AuraLogo } from '../brand/AuraLogo';

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'blue' | 'emerald' | 'amber';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Consortium & Surveillance',
    items: [
      { key: 'overview', label: 'Command Overview', href: '/', icon: LayoutDashboard },
      { key: 'nodes', label: 'Sovereign Enclaves', href: '/nodes', icon: Server, badge: '5 Online', badgeVariant: 'emerald' },
    ],
  },
  {
    label: 'Federated Training & AI',
    items: [
      { key: 'rounds', label: 'Training Rounds', href: '/rounds', icon: Activity, badge: 'Live', badgeVariant: 'blue' },
      { key: 'lineage', label: 'Model Lineage (DAG)', href: '/lineage', icon: GitBranch },
    ],
  },
  {
    label: 'Governance & Privacy',
    items: [
      { key: 'review', label: 'Model Review & Sign-Off', href: '/review', icon: FileCheck2, badge: 'Action', badgeVariant: 'amber' },
      { key: 'privacy', label: 'Differential Privacy', href: '/privacy', icon: ShieldCheck, badge: 'ε=1.42', badgeVariant: 'emerald' },
      { key: 'settings', label: 'Coordinator Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { cumulativeEpsilon } = useMemberPrivacyBudget('ZA');

  return (
    <aside
      className={`hidden lg:flex flex-col h-full bg-white text-slate-900 border-r border-slate-200 select-none z-30 transition-all duration-200 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Top Identity Header */}
      <div className="h-14 px-3 border-b border-slate-100 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <AuraLogo size={24} />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 tracking-tight leading-tight truncate">
                AURA Sovereign
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase truncate">
                BRICS Federated Grid
              </span>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors mx-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-0.5">
            {!collapsed && (
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : item.href === '/rounds'
                  ? pathname === '/rounds'
                  : item.href === '/review'
                  ? pathname === '/review' || pathname === '/rounds/review'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors relative ${
                    isActive
                      ? 'bg-slate-50 text-slate-900 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-slate-900 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  />
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {(() => {
                        const badgeText = item.key === 'privacy'
                          ? `ε=${cumulativeEpsilon.toFixed(2)}`
                          : item.badge;
                        if (!badgeText) return null;
                        return (
                          <span
                            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                              item.badgeVariant === 'emerald'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.badgeVariant === 'amber'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {badgeText}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: Enclave status + Platform link */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">FedAvg · 5/5 Ready</span>
            </span>
            <span className="font-mono text-slate-400">ε=1.42</span>
          </div>
          <a
            href="http://localhost:3000"
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Globe2 className="w-3 h-3" />
            <span>← Platform Hub</span>
          </a>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
