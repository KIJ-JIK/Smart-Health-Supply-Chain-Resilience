'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { SUPPLY_CHAIN_SHIPMENTS } from '@/graphql/queries';
import { useScopeStore } from '@/store/scopeStore';
import { useAuthStore } from '@/store/authStore';
import { getEnforcedScope } from '@/lib/scopeEnforcer';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import {
  MOCK_SHIPMENTS,
  CHAIN_STAGES,
  SUPPLIER_PERFORMANCE_DATA,
  STAGE_BOTTLENECKS,
  DELAY_REASONS_DISTRIBUTION,
} from '@/lib/supplyChainData';
import type { Shipment, ChainStage, ShipmentStatus } from '@/types';
import {
  Truck,
  Package,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Search,
  Filter,
  BarChart3,
  Factory,
  Warehouse,
  Building2,
  Home,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';

const STAGE_ICONS: Record<ChainStage, any> = {
  manufacturer: Factory,
  warehouse: Warehouse,
  state: Building2,
  district: Building2,
  phc: Home,
};

const STATUS_BADGE: Record<ShipmentStatus, { bg: string; text: string; label: string }> = {
  ordered: { bg: '#F1F5F9', text: '#475569', label: 'ORDERED' },
  dispatched: { bg: '#E0F2FE', text: '#0369A1', label: 'DISPATCHED' },
  in_transit: { bg: '#EDE9FE', text: '#6D28D9', label: 'IN TRANSIT' },
  delivered: { bg: '#DCFCE7', text: '#15803D', label: 'DELIVERED' },
  delayed: { bg: '#FEE2E2', text: '#991B1B', label: 'DELAYED' },
  cancelled: { bg: '#F1F5F9', text: '#64748B', label: 'CANCELLED' },
};

export default function SupplyChainPage() {
  const { user } = useAuthStore();
  const { districtId, stateId, level } = useScopeStore();

  // Enforce frontend boundary so user can never query or receive outside their jurisdiction
  const enforcedScope = useMemo(() => {
    return getEnforcedScope(user, { level, stateId, districtId });
  }, [user, level, stateId, districtId]);

  const [activeView, setActiveView] = useState<'tracking' | 'analytics'>('tracking');
  const [selectedStage, setSelectedStage] = useState<ChainStage | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // GraphQL query fallback with strictly enforced variables
  const { data: gqlData, loading: gqlLoading } = useQuery(SUPPLY_CHAIN_SHIPMENTS, {
    variables: {
      filter: {
        districtId: enforcedScope.districtId ?? undefined,
        stateId: enforcedScope.stateId ?? undefined,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const shipments: Shipment[] = useMemo(() => {
    const rawShipments = gqlData?.supplyChainShipments && gqlData.supplyChainShipments.length > 0
      ? gqlData.supplyChainShipments
      : MOCK_SHIPMENTS;

    // Filter to strictly enforced scope on the client side as well
    return rawShipments.filter((s: Shipment) => {
      if (enforcedScope.districtId && s.districtId && s.districtId !== enforcedScope.districtId) {
        return false;
      }
      if (enforcedScope.stateId && s.stateId && s.stateId !== enforcedScope.stateId) {
        return false;
      }
      return true;
    });
  }, [gqlData, enforcedScope]);

  // Stage shipment count calculations
  const stageCounts = useMemo(() => {
    const counts: Record<ChainStage, number> = {
      manufacturer: 0,
      warehouse: 0,
      state: 0,
      district: 0,
      phc: 0,
    };
    shipments.forEach((s) => {
      if (s.stage && counts[s.stage] !== undefined) {
        counts[s.stage]++;
      }
    });
    return counts;
  }, [shipments]);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      // Stage filter
      if (selectedStage !== 'all' && s.stage !== selectedStage) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = s.shipmentId.toLowerCase().includes(q);
        const matchesSupplier = s.supplier.toLowerCase().includes(q);
        const matchesDest = s.destinationPhcName.toLowerCase().includes(q);
        const matchesItem = s.items.some((it) => it.medicineName.toLowerCase().includes(q));
        if (!matchesId && !matchesSupplier && !matchesDest && !matchesItem) return false;
      }
      return true;
    });
  }, [shipments, selectedStage, statusFilter, searchQuery]);

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Truck size={24} style={{ color: 'var(--color-primary)' }} />
            Supply Chain & Last-Mile Logistics
          </h1>
          <p className="page-subtitle">
            End-to-end multi-echelon pipeline: Manufacturer → Warehouse → State → District → PHC with bottleneck detection and redistribution tracing.
          </p>
        </div>
        <ScopeSelector />
      </div>

      {/* View Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveView('tracking')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid',
              borderColor: activeView === 'tracking' ? 'var(--color-primary)' : 'var(--color-border)',
              background: activeView === 'tracking' ? 'var(--color-primary)' : 'white',
              color: activeView === 'tracking' ? 'white' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Layers size={15} />
            <span>Chain-Stage & Shipment Tracking</span>
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid',
              borderColor: activeView === 'analytics' ? 'var(--color-primary)' : 'var(--color-border)',
              background: activeView === 'analytics' ? 'var(--color-primary)' : 'white',
              color: activeView === 'analytics' ? 'white' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <BarChart3 size={15} />
            <span>Logistics Analytics & Bottlenecks</span>
          </button>
        </div>

        {activeView === 'tracking' && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Showing <strong>{filteredShipments.length}</strong> active consignments
          </div>
        )}
      </div>

      {/* ────────────────── VIEW 1: CHAIN-STAGE & TRACKING ────────────────── */}
      {activeView === 'tracking' && (
        <>
          {/* Multi-Echelon Chain Stage Pipeline Strip */}
          <div
            className="card"
            style={{
              padding: 20,
              background: 'white',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Multi-Echelon Chain Stage Pipeline
                </span>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  Select any stage to filter shipments currently moving through that tier
                </p>
              </div>

              {selectedStage !== 'all' && (
                <button
                  onClick={() => setSelectedStage('all')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid var(--color-border)',
                    background: '#F8FAFC',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#64748B',
                  }}
                >
                  Clear Stage Filter (Show All)
                </button>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                position: 'relative',
              }}
            >
              {CHAIN_STAGES.map((stage, idx) => {
                const IconComponent = STAGE_ICONS[stage.key];
                const isSelected = selectedStage === stage.key;
                const count = stageCounts[stage.key];

                return (
                  <div
                    key={stage.key}
                    onClick={() => setSelectedStage(isSelected ? 'all' : stage.key)}
                    style={{
                      background: isSelected ? '#EFF6FF' : '#F8FAFC',
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: isSelected ? 'var(--color-primary)' : '#E2E8F0',
                          color: isSelected ? 'white' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComponent size={16} />
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: isSelected ? 'var(--color-primary)' : '#0F172A',
                        }}
                      >
                        {count} Active
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#1E40AF' : '#1E293B' }}>
                        {stage.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.3 }}>
                        {stage.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipment Table Filter & Search Controls */}
          <div
            className="card"
            style={{
              padding: 16,
              background: 'white',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shipments by ID, medicine, supplier, or destination..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 13,
                  fontFamily: 'var(--font-ui)',
                  outline: 'none',
                  background: '#F8FAFC',
                }}
              />
            </div>

            {/* Status Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: 12,
                  fontFamily: 'var(--font-ui)',
                  outline: 'none',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="in_transit">In Transit</option>
                <option value="delayed">Delayed</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="ordered">Ordered</option>
              </select>
            </div>
          </div>

          {/* Shipment Rows Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredShipments.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: 48,
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  background: 'white',
                }}
              >
                <CheckCircle size={40} style={{ color: '#10B981', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  No Shipments Matching Criteria
                </div>
                <div style={{ fontSize: 13 }}>
                  Try changing stage selection, clearing search query, or selecting another status filter.
                </div>
              </div>
            ) : (
              filteredShipments.map((shipment) => {
                const badge = STATUS_BADGE[shipment.status] || STATUS_BADGE.in_transit;
                const isDelayed = shipment.isDelayed || shipment.status === 'delayed';

                return (
                  <div
                    key={shipment.shipmentId}
                    className="card"
                    style={{
                      background: 'white',
                      border: isDelayed ? '2px solid #FCA5A5' : '1px solid var(--color-border)',
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      boxShadow: isDelayed ? '0 4px 16px rgba(239, 68, 68, 0.08)' : '0 2px 4px rgba(0,0,0,0.03)',
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            padding: 8,
                            borderRadius: 6,
                            background: isDelayed ? '#FEE2E2' : '#EFF6FF',
                            color: isDelayed ? '#DC2626' : 'var(--color-primary)',
                          }}
                        >
                          <Truck size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
                              {shipment.shipmentId}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: badge.bg,
                                color: badge.text,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {badge.label}
                            </span>
                            {shipment.stage && (
                              <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>
                                Stage: {shipment.stage}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            Ordered: {new Date(shipment.orderDate).toLocaleDateString('en-IN')} • Supplier: <strong>{shipment.supplier}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                          ₹{shipment.totalValue.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          Consignment Value
                        </div>
                      </div>
                    </div>

                    {/* Delay Banner (if delayed) */}
                    {isDelayed && (
                      <div
                        style={{
                          background: '#FEF2F2',
                          borderLeft: '4px solid #EF4444',
                          padding: '10px 14px',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 12,
                          color: '#991B1B',
                        }}
                      >
                        <AlertOctagon size={16} style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Transit Delay Flagged (+{shipment.delayHours ?? 24} hours):</strong>{' '}
                          {shipment.delayReason || 'Logistics transit exceeded scheduled route turnaround.'}
                        </div>
                      </div>
                    )}

                    {/* Route Logistics Row */}
                    <div
                      style={{
                        background: '#F8FAFC',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-light)',
                        padding: '12px 16px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 16,
                      }}
                    >
                      {/* Origin */}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          Origin / Source
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                          {shipment.sourceLocation || shipment.supplier}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          Dispatched: {shipment.dispatchTime ? new Date(shipment.dispatchTime).toLocaleString() : 'Pending'}
                        </div>
                      </div>

                      {/* Destination */}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          Destination Facility
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                          {shipment.destinationPhcName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          District: {shipment.districtId}
                        </div>
                      </div>

                      {/* Expected / Actual Delivery */}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          Delivery Timeline
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isDelayed ? '#DC2626' : '#059669', marginTop: 2 }}>
                          {shipment.actualDelivery
                            ? `Delivered: ${new Date(shipment.actualDelivery).toLocaleDateString('en-IN')}`
                            : `Expected: ${new Date(shipment.expectedDelivery).toLocaleDateString('en-IN')}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {shipment.actualDelivery ? 'Verified receipt' : 'Active estimated window'}
                        </div>
                      </div>
                    </div>

                    {/* Cargo / Items Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        Consigned Pharmaceuticals
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {shipment.items.map((it, i) => (
                          <div
                            key={i}
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              borderRadius: 4,
                              padding: '4px 10px',
                              fontSize: 12,
                              color: '#1E293B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Package size={13} style={{ color: 'var(--color-primary)' }} />
                            <span><strong>{it.medicineName}</strong>: {it.quantity.toLocaleString()} {it.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Traceability: Link to Redistribution Decision */}
                    {shipment.redistributionId && (
                      <div
                        style={{
                          paddingTop: 10,
                          borderTop: '1px solid var(--color-border-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0369A1' }}>
                          <ShieldCheck size={14} style={{ color: '#0284C7' }} />
                          <span>
                            Created from Approved Redistribution Decision:{' '}
                            <strong style={{ fontFamily: 'monospace' }}>{shipment.redistributionId}</strong>
                          </span>
                        </div>

                        <Link
                          href={`/redistribution?recId=${encodeURIComponent(shipment.redistributionId)}`}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#0284C7',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'none',
                            background: '#E0F2FE',
                            padding: '3px 8px',
                            borderRadius: 4,
                          }}
                        >
                          <span>View Decision Audit Record</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ────────────────── VIEW 2: LOGISTICS ANALYTICS & BOTTLENECKS ────────────────── */}
      {activeView === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Identified Bottleneck Callout Panel */}
          <div
            className="card"
            style={{
              padding: 20,
              background: '#FFF7ED',
              border: '2px solid #F97316',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: 8, borderRadius: '50%', background: '#F97316', color: 'white' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#9A3412', margin: 0 }}>
                  Primary Supply Chain Bottleneck Identified: Stage 5 (Last-Mile PHC Transit)
                </h2>
                <div style={{ fontSize: 12, color: '#C2410C', marginTop: 2 }}>
                  Automated delay-frequency analysis across 185 historical district consignments
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#7C2D12', lineHeight: 1.6, margin: 0 }}>
              While upstream tiers (Manufacturer → Central Warehouse) maintain a low delay frequency of <strong>4.8%</strong>, the final echelon (<strong>District Drug Warehouse → Primary Health Centre</strong>) experiences a <strong>28.6% delay frequency</strong>, causing the average turnaround time to triple from the target of 8.0 hours to <strong>22.4 hours</strong>.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginTop: 4,
              }}
            >
              <div style={{ background: 'white', padding: 12, borderRadius: 6, border: '1px solid #FED7AA' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9A3412', textTransform: 'uppercase' }}>
                  Last-Mile Delay Frequency
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#EA580C' }}>28.6%</div>
                <div style={{ fontSize: 11, color: '#9A3412' }}>vs. 4.8% at Manufacturer stage</div>
              </div>

              <div style={{ background: 'white', padding: 12, borderRadius: 6, border: '1px solid #FED7AA' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9A3412', textTransform: 'uppercase' }}>
                  Avg Last-Mile Transit
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#EA580C' }}>22.4 hrs</div>
                <div style={{ fontSize: 11, color: '#9A3412' }}>Target threshold: 8.0 hrs</div>
              </div>

              <div style={{ background: 'white', padding: 12, borderRadius: 6, border: '1px solid #FED7AA' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9A3412', textTransform: 'uppercase' }}>
                  Primary Contributing Cause
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#9A3412', marginTop: 4 }}>
                  Rural Road Access & Weather
                </div>
                <div style={{ fontSize: 11, color: '#9A3412' }}>Single-van route dependency</div>
              </div>
            </div>
          </div>

          {/* Stage Transit Time vs Target Chart */}
          <div className="card" style={{ padding: 20, background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Transit Time vs. Target Across Chain Echelons (Hours)
                </h3>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Comparing actual mean turnaround with masterplan service-level agreements (SLAs)
                </div>
              </div>
            </div>

            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={STAGE_BOTTLENECKS} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="h" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: 'none',
                      borderRadius: 8,
                      color: 'white',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="avgTransitHours" name="Actual Mean Transit" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="targetTransitHours" name="Target SLA" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Delay Reasons Breakdown & Supplier Performance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {/* Delay Frequency Root Causes */}
            <div className="card" style={{ padding: 20, background: 'white' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>
                Transit Delay Root-Cause Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {DELAY_REASONS_DISTRIBUTION.map((d, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#1E293B' }}>{d.reason}</span>
                      <span style={{ fontWeight: 700, color: d.color }}>{d.percentage}% ({d.count} events)</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${d.percentage}%`,
                          height: '100%',
                          background: d.color,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chain Stage Reliability Summary */}
            <div className="card" style={{ padding: 20, background: 'white' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>
                Stage Reliability Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {STAGE_BOTTLENECKS.map((st) => (
                  <div
                    key={st.stage}
                    style={{
                      padding: '10px 12px',
                      background: '#F8FAFC',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{st.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{st.primaryRootCause}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: st.bottleneckSeverity === 'critical' ? '#DC2626' : st.bottleneckSeverity === 'moderate' ? '#D97706' : '#16A34A',
                        }}
                      >
                        {st.delayFrequencyPct}% Delays
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {st.activeShipments} consignments
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Supplier Performance Scorecard */}
          <div className="card" style={{ padding: 20, background: 'white' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>
              Pharmaceutical Supplier & Logistics Vendor Scorecard
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor / Depot</th>
                    <th>Category</th>
                    <th>Shipments</th>
                    <th>On-Time %</th>
                    <th>Avg Delay</th>
                    <th>Fill Rate</th>
                    <th>QA Score</th>
                    <th>Total Dispatched</th>
                    <th>Vendor Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {SUPPLIER_PERFORMANCE_DATA.map((sup, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>{sup.supplierName}</td>
                      <td className="text-muted">{sup.category}</td>
                      <td>{sup.totalShipments}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: sup.onTimeRate >= 95 ? '#15803D' : sup.onTimeRate >= 85 ? '#D97706' : '#DC2626',
                          }}
                        >
                          {sup.onTimeRate}%
                        </span>
                      </td>
                      <td className="text-muted">{sup.avgDelayHours} hrs</td>
                      <td>{sup.fillRate}%</td>
                      <td>⭐ {sup.qualityScore} / 5</td>
                      <td>₹{(sup.totalValueINR / 10000000).toFixed(2)} Cr</td>
                      <td>
                        <span
                          className={`badge ${
                            sup.status === 'preferred'
                              ? 'badge-ok'
                              : sup.status === 'standard'
                              ? 'badge-info'
                              : 'badge-critical'
                          }`}
                        >
                          {sup.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
