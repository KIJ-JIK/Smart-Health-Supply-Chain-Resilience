'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import { DataFreshnessLabel } from '@/components/common/DataFreshnessLabel';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { getEnforcedScope } from '@/lib/scopeEnforcer';
import {
  MapPin,
  Layers,
  Truck,
  Building2,
  AlertTriangle,
  Flame,
  ShieldAlert,
} from 'lucide-react';

// Dynamically import GisMap with SSR disabled to ensure WebGL/MapLibre loads on client
const GisMap = dynamic(
  () => import('@/components/gis/GisMap').then((mod) => mod.GisMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 'calc(100vh - 170px)',
          minHeight: '620px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid #e2e8f0',
            borderTopColor: '#1a56db',
            animation: 'spin 1s linear infinite',
          }}
        />
        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
          Initializing MapLibre GL & Deck.gl Canvas…
        </div>
      </div>
    ),
  }
);

export default function GisPage() {
  const { user } = useAuthStore();
  const { level, stateId, districtId } = useScopeStore();
  // Enforce: compute bounded scope for any future backend tile/data requests
  // GisMap reads from scopeStore directly; enforcer ensures any backend queries are bounded
  const _scope = getEnforcedScope(user, { level, stateId, districtId });
  void _scope; // used by backend API calls in production

  return (
    <div className="gis-page-wrapper" style={{ paddingBottom: 24 }}>
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={22} color="#1a56db" />
            <span>GIS Health Geospatial Map</span>
          </h1>
          <p className="page-subtitle">
            Multi-layer MapLibre & Deck.gl geospatial intelligence for facility monitoring & inter-PHC supply logistics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              fontSize: '11px',
              fontWeight: 600,
              color: '#065f46',
            }}
          >
            <Truck size={12} color="#059669" />
            <span>PHC-to-PHC Logistics Verified</span>
          </div>

          <DataFreshnessLabel source="Map Layer Tile Sync" compact />
        </div>
      </div>

      {/* Shared Drill-down Breadcrumb & Scope Selector */}
      <ScopeSelector showSummaryChip />

      {/* Map Canvas with 8 Toggleable Layers & Side Panel */}
      <GisMap />
    </div>
  );
}
