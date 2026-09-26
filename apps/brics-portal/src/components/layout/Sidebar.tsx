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
      { key: 'review', label: 'Model Review & Sign-Off', href: '/rounds/review', icon: FileCheck2, badge: 'Action', badgeVariant: 'amber' },
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
      className={`hidden lg:flex flex-col h-full bg-[#0b1e36] text-white border-r border-slate-700/60 select-none z-30 transition-all duration-200 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Top Identity Header */}
      <div className="h-12 px-3 border-b border-slate-700/60 flex items-center justify-between bg-[#0b1e36]">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm">
              🌐
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
              Federated Council
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-800 text-white font-bold border-l-4 border-blue-400 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
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
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              item.badgeVariant === 'emerald'
                                ? 'bg-emerald-600 text-white'
                                : item.badgeVariant === 'amber'
                                ? 'bg-amber-600 text-white'
                                : 'bg-blue-600 text-white'
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

      {/* Bottom Node Security Banner */}
      {!collapsed && (
        <div className="p-3 m-2 rounded-md bg-[#08172b] border border-slate-700/60 text-slate-300 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Radio className="w-3.5 h-3.5" />
              Sovereign FedAvg
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">5/5 Ready</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Paillier homomorphic encryption and Gaussian DP noise active.
          </p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
