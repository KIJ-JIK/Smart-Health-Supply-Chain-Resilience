'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Pill,
  Package,
  Users,
  HeartPulse,
  BrainCircuit,
  Bell,
  Shuffle,
  Truck,
  ShieldAlert,
  Swords,
  Bot,
  BarChart3,
  ScrollText,
  Settings,
  RefreshCw,
  ChevronDown,
  Activity,
  Globe,
} from 'lucide-react';
import { useAlertStore } from '@/store/alertStore';
import { useAuthStore } from '@/store/authStore';

// ── Navigation structure (masterplan §24) ─────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: () => number;
  roles?: ('national_admin' | 'state_admin' | 'district_admin')[];
}

interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
}

const iconClass = 'nav-item-icon';
const sz = 16;

const useNavSections = (): NavSection[] => {
  const unreadCount = useAlertStore((s) => s.unacknowledgedCount);

  return [
    {
      key: 'overview',
      label: 'Command & Control',
      items: [
        {
          label: 'National Command Center',
          href: '/governance',
          icon: <LayoutDashboard size={sz} className={iconClass} />,
          roles: ['national_admin', 'state_admin', 'district_admin'],
        },
        {
          label: 'GIS Health Map',
          href: '/gis',
          icon: <Map size={sz} className={iconClass} />,
        },
      ],
    },
    {
      key: 'intelligence',
      label: 'Intelligence',
      items: [
        {
          label: 'Medicine Intelligence',
          href: '/medicine',
          icon: <Pill size={sz} className={iconClass} />,
        },
        {
          label: 'Resources',
          href: '/resources',
          icon: <Package size={sz} className={iconClass} />,
        },
        {
          label: 'Workforce',
          href: '/workforce',
          icon: <Users size={sz} className={iconClass} />,
        },
        {
          label: 'Patient Intelligence',
          href: '/patients',
          icon: <HeartPulse size={sz} className={iconClass} />,
        },
      ],
    },
    {
      key: 'ai',
      label: 'AI & Analytics',
      items: [
        {
          label: 'AI Forecasts',
          href: '/forecasts',
          icon: <BrainCircuit size={sz} className={iconClass} />,
        },
        {
          label: 'Early Warnings',
          href: '/early-warnings',
          icon: <Bell size={sz} className={iconClass} />,
          badge: () => unreadCount,
        },
        {
          label: 'Analytics & Reports',
          href: '/analytics',
          icon: <BarChart3 size={sz} className={iconClass} />,
        },
      ],
    },
    {
      key: 'operations',
      label: 'Operations',
      items: [
        {
          label: 'Redistribution',
          href: '/redistribution',
          icon: <Shuffle size={sz} className={iconClass} />,
        },
        {
          label: 'Supply Chain',
          href: '/supply-chain',
          icon: <Truck size={sz} className={iconClass} />,
        },
      ],
    },
    {
      key: 'crisis',
      label: 'Crisis Management',
      items: [
        {
          label: 'Emergency / Pandemic',
          href: '/emergency',
          icon: <ShieldAlert size={sz} className={iconClass} />,
          roles: ['national_admin', 'state_admin'],
        },
        {
          label: 'Crisis Simulator',
          href: '/simulator',
          icon: <Swords size={sz} className={iconClass} />,
          roles: ['national_admin', 'state_admin'],
        },
        {
          label: 'AI Copilot',
          href: '/copilot',
          icon: <Bot size={sz} className={iconClass} />,
        },
      ],
    },
    {
      key: 'admin',
      label: 'Governance',
      items: [
        {
          label: 'Audit Log',
          href: '/audit',
          icon: <ScrollText size={sz} className={iconClass} />,
          roles: ['national_admin', 'state_admin', 'district_admin'],
        },
        {
          label: 'Administration & Sync',
          href: '/admin',
          icon: <Settings size={sz} className={iconClass} />,
          roles: ['national_admin', 'state_admin', 'district_admin'],
        },
        {
          label: 'Manage Jurisdiction',
          href: '/manage-jurisdiction',
          icon: <Globe size={sz} className={iconClass} />,
          roles: ['national_admin', 'state_admin', 'district_admin'],
        },
      ],
    },
  ];
};

// ── Sidebar component ─────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const navSections = useNavSections();

  // Track which sections are open (all open by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(navSections.map((s) => [s.key, true])),
  );

  const toggleSection = (key: string) => {
    if (collapsed) return; // Can't collapse sections when sidebar is collapsed
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={18} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">Health Gov</span>
          <span className="sidebar-logo-sub">Governance Portal</span>
        </div>
      </div>

      {/* Jurisdiction indicator (not collapsed) */}
      {!collapsed && (
        <div style={{ padding: '8px 12px' }}>
          <div className="jurisdiction-pill" style={{ fontSize: '11px', padding: '3px 8px' }}>
            <Globe size={10} />
            {user.role === 'national_admin'
              ? 'National View'
              : user.role === 'state_admin'
              ? `State: Maharashtra`
              : `District: Pune`}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {navSections.map((section) => {
          // Filter items by role
          const visibleItems = section.items.filter((item) =>
            !item.roles || item.roles.includes(user.role),
          );
          if (visibleItems.length === 0) return null;

          const isOpen = openSections[section.key] !== false;

          return (
            <div key={section.key} className="nav-section">
              {/* Section label (only shown when expanded) */}
              <div
                className="nav-section-label"
                onClick={() => toggleSection(section.key)}
                role="button"
                aria-expanded={isOpen}
              >
                <span className="nav-section-label-text">{section.label}</span>
                <ChevronDown
                  size={12}
                  className={`nav-section-chevron${isOpen ? ' open' : ''}`}
                />
              </div>

              {/* Items */}
              <div
                className="nav-items"
                style={{
                  maxHeight: isOpen || collapsed ? '1000px' : '0px',
                }}
              >
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);
                  const badge = item.badge?.();
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={`nav-item${isActive ? ' active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      {item.icon}
                      <span className="nav-item-label">{item.label}</span>
                      {item.href === '/manage-jurisdiction' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-400 border border-teal-500/30">
                          NEW
                        </span>
                      )}
                      {badge && badge > 0 && (
                        <span className="nav-item-badge">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
