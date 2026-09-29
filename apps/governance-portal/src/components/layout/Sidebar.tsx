'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { useAlertStore } from '@/store/alertStore';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { AuraLogo } from '@/components/brand/AuraLogo';

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

const NAV_ITEM_KEYS: Record<string, string> = {
  '/governance': 'nav.governance',
  '/gis': 'nav.gis',
  '/medicine': 'nav.medicine',
  '/resources': 'nav.resources',
  '/workforce': 'nav.workforce',
  '/patients': 'nav.patients',
  '/copilot': 'nav.copilot',
  '/forecasts': 'nav.forecasts',
  '/early-warnings': 'nav.earlyWarnings',
  '/analytics': 'nav.analytics',
  '/redistribution': 'nav.redistribution',
  '/supply-chain': 'nav.supplyChain',
  '/emergency': 'nav.emergency',
  '/simulator': 'nav.simulator',
  '/audit': 'nav.audit',
  '/admin': 'nav.admin',
  '/manage-jurisdiction': 'nav.jurisdiction',
};

const SECTION_KEYS: Record<string, string> = {
  overview: 'nav.groupMain',
  intelligence: 'nav.groupSurveillance',
  ai: 'nav.groupSurveillance',
  operations: 'nav.groupLogistics',
  crisis: 'nav.groupLogistics',
  admin: 'nav.groupGovernance',
};

const iconClass = 'nav-item-icon';
const sz = 16;

// Static navigation definition to avoid recreation on every render
const NAV_SECTIONS: NavSection[] = [
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
        label: 'AI Copilot',
        href: '/copilot',
        icon: <Bot size={sz} className={iconClass} />,
      },
      {
        label: 'AI Forecasts',
        href: '/forecasts',
        icon: <BrainCircuit size={sz} className={iconClass} />,
      },
      {
        label: 'Early Warnings',
        href: '/early-warnings',
        icon: <Bell size={sz} className={iconClass} />,
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

// ── Sidebar component ─────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const unreadAlerts = useAlertStore((s) => s.unacknowledgedCount);

  // Track which sections are open (all open by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_SECTIONS.map((s) => [s.key, true]))
  );

  const toggleSection = (key: string) => {
    if (collapsed) return;
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo & Top Collapse Toggle */}
      <div className={`sidebar-logo flex items-center justify-between px-3.5 py-3 border-b border-slate-100 dark:border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <AuraLogo size={24} />
          {!collapsed && (
            <div className="sidebar-logo-text flex flex-col min-w-0">
              <span className="sidebar-logo-title font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight truncate">AURA Vantage</span>
              <span className="sidebar-logo-sub text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase truncate">{t('brand.subtitle', 'Governance Command')}</span>
            </div>
          )}
        </div>
        {/* Mobile close button (X) when mobile drawer is open */}
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close menu"
            aria-label="Close menu"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {onToggle && !collapsed && !mobileOpen && (
          <button
            type="button"
            onClick={onToggle}
            className="hidden lg:block p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse sidebar menu"
            aria-label="Collapse sidebar menu"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav select-none">
        {NAV_SECTIONS.map((section) => {
          // Filter items by role
          const visibleItems = section.items.filter((item) =>
            !item.roles || item.roles.includes(user.role),
          );
          if (visibleItems.length === 0) return null;

          const isOpen = openSections[section.key] !== false;
          const sectionTitle = t(SECTION_KEYS[section.key], section.label);

          return (
            <div key={section.key} className="nav-section">
              {/* Section label (only shown when expanded) */}
              <div
                className="nav-section-label cursor-pointer select-none"
                onClick={() => toggleSection(section.key)}
                role="button"
                aria-expanded={isOpen}
              >
                <span className="nav-section-label-text">{sectionTitle}</span>
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
                  const badge = item.href === '/early-warnings' ? unreadAlerts : undefined;
                  const itemTitle = t(NAV_ITEM_KEYS[item.href], item.label);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => onCloseMobile?.()}
                      onMouseEnter={() => {
                        try {
                          router.prefetch(item.href);
                        } catch {}
                      }}
                      className={`nav-item${isActive ? ' active' : ''}`}
                      title={collapsed ? itemTitle : undefined}
                    >
                      {item.icon}
                      <span className="nav-item-label flex items-center justify-between gap-1 w-full">
                        <span>{itemTitle}</span>
                      </span>
                      {badge && badge > 0 ? (
                        <span className="nav-item-badge">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapsible Menu Bar Bottom Action */}
      {onToggle && (
        <div className="sidebar-footer p-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center bg-slate-50/60 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className={`flex items-center gap-2 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-semibold cursor-pointer ${
              collapsed ? 'w-auto justify-center' : 'w-full justify-center'
            }`}
            title={collapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
            aria-label={collapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>{t('action.close', 'Collapse Menu')}</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
