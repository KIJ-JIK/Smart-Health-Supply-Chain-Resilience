// ---------------------------------------------------------------------------
// Left navigation sidebar for the BRICS Federated Intelligence & Governance Portal.
// Aligned with team design system (Dark slate, Lucide icons, glowing active states).
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
} from 'lucide-react';
import { useUIStore } from '@/store';

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Command Overview', href: '/', icon: LayoutDashboard },
  { key: 'nodes', label: 'Sovereign Nodes', href: '/nodes', icon: Server, badge: '5 Online', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'rounds', label: 'Training Rounds', href: '/rounds', icon: Activity, badge: 'Live', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
  { key: 'review', label: 'Model Review & Sign-Off', href: '/rounds/review', icon: FileCheck2, badge: 'Action', badgeColor: 'bg-amber-500/20 text-amber-300' },
  { key: 'lineage', label: 'Model Lineage (DAG)', href: '/lineage', icon: GitBranch },
  { key: 'privacy', label: 'Differential Privacy', href: '/privacy', icon: ShieldCheck, badge: 'ε=1.42', badgeColor: 'bg-teal-500/20 text-teal-300' },
  { key: 'settings', label: 'Coordinator Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={`min-h-screen bg-[#0d1523] border-r border-slate-800 text-slate-100 flex flex-col transition-all duration-300 select-none z-20 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-xs border border-teal-500/30">
              BR
            </div>
            <div>
              <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">
                BRICS Alliance
              </span>
              <p className="text-[10px] text-slate-400 font-mono">Federation Oversight</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all mx-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.key}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Network Pulse Card */}
      {!collapsed && (
        <div className="p-3 mx-2.5 mb-4 rounded-xl bg-[#111827] border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Consensus Engine
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">100% OK</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            FedAvg with Paillier Cryptosystem and Gaussian DP noise active.
          </p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
