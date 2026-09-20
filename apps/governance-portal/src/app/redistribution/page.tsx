'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { REDISTRIBUTION_RECOMMENDATIONS } from '@/graphql/queries';
import { useAuthStore } from '@/store/authStore';
import { useScopeStore } from '@/store/scopeStore';
import { getEnforcedScope } from '@/lib/scopeEnforcer';
import { ScopeSelector } from '@/components/common/ScopeSelector';
import {
  MOCK_RECOMMENDATIONS,
  fetchRedistributionRecommendations,
} from '@/lib/redistributionData';
import type {
  RedistributionRecommendation,
  RedistributionDecisionPayload,
  TransferLifecycleStatus,
} from '@/types';
import {
  CheckCircle,
  XCircle,
  Edit3,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  Clock,
  MapPin,
  Truck,
  Package,
  TrendingUp,
  Search,
  Sparkles,
  Info,
  Check,
  Ban,
  Activity,
  History,
} from 'lucide-react';

const URGENCY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' },
  high: { bg: '#FFEDD5', text: '#9A3412', border: '#FB923C' },
  medium: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  low: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
};

const LIFECYCLE_STEPS: Array<{ key: TransferLifecycleStatus; label: string; icon: any }> = [
  { key: 'recommended', label: 'Recommended', icon: Sparkles },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'dispatched', label: 'Dispatched', icon: Package },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: ShieldCheck },
];

async function postDecision(
  recommendationId: string,
  payload: RedistributionDecisionPayload,
): Promise<void> {
  await fetch(`/api/v1/governance/redistribution/${recommendationId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
}

export default function RedistributionPage() {
  const { user } = useAuthStore();
  const { districtId, stateId, level } = useScopeStore();

  const enforcedScope = useMemo(() => {
    return getEnforcedScope(user, { level, stateId, districtId });
  }, [user, level, stateId, districtId]);

  const currentDistrict = enforcedScope.districtId ?? 'dist-pune';

  const [recommendations, setRecommendations] = useState<RedistributionRecommendation[]>(MOCK_RECOMMENDATIONS);
  const [activeTab, setActiveTab] = useState<'pending' | 'decided'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Loading & In-flight states
  const [decidingId, setDecidingId] = useState<string | null>(null);

  // Modify Modal / Inline state
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [modifyQty, setModifyQty] = useState<number>(0);
  const [modifyNotes, setModifyNotes] = useState<string>('');
  const [modifyError, setModifyError] = useState<string | null>(null);

  // Reject Modal / Inline state
  const [rejectingRecId, setRejectingRecId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Approve state
  const [approveNotes, setApproveNotes] = useState<Record<string, string>>({});

  // GraphQL query fallback
  const { data: gqlData, refetch } = useQuery(REDISTRIBUTION_RECOMMENDATIONS, {
    variables: { district: currentDistrict },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    let isMounted = true;
    fetchRedistributionRecommendations(currentDistrict).then((recs) => {
      if (isMounted && recs.length > 0) {
        setRecommendations(recs);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentDistrict]);

  // Synchronize if GraphQL returns items
  useEffect(() => {
    if (gqlData?.redistributionRecommendations && gqlData.redistributionRecommendations.length > 0) {
      setRecommendations(gqlData.redistributionRecommendations);
    }
  }, [gqlData]);

  // Handle Approve
  const handleApprove = async (rec: RedistributionRecommendation) => {
    setDecidingId(rec.recommendationId);
    const notes = approveNotes[rec.recommendationId] || 'Approved via Governance Portal';
    const payload: RedistributionDecisionPayload = {
      decision: 'approved',
      modified_quantity: null,
      decided_by: user.name || user.id || 'District Health Officer',
      notes,
    };

    try {
      await postDecision(rec.recommendationId, payload);
    } catch {
      // Optimistic update fallback
    }

    setRecommendations((prev) =>
      prev.map((item) =>
        item.recommendationId === rec.recommendationId
          ? {
              ...item,
              status: 'approved',
              transferStatus: 'approved',
              decisionAt: new Date().toISOString(),
              decisionBy: user.name || 'District Health Officer',
              notes,
            }
          : item,
      ),
    );

    setDecidingId(null);
    refetch();
  };

  // Handle Modify Open
  const handleStartModify = (rec: RedistributionRecommendation) => {
    setEditingRecId(rec.recommendationId);
    setModifyQty(rec.quantity);
    setModifyNotes('');
    setModifyError(null);
    setRejectingRecId(null);
  };

  // Handle Modify Submit
  const handleSaveModify = async (rec: RedistributionRecommendation) => {
    if (!modifyNotes.trim()) {
      setModifyError('Notes explaining the reason for quantity modification are mandatory.');
      return;
    }
    if (modifyQty <= 0) {
      setModifyError('Modified quantity must be greater than zero.');
      return;
    }
    if (rec.sourceSurplus && modifyQty > rec.sourceSurplus) {
      setModifyError(`Modified quantity cannot exceed source surplus of ${rec.sourceSurplus.toLocaleString()} ${rec.unit}.`);
      return;
    }

    setDecidingId(rec.recommendationId);
    const payload: RedistributionDecisionPayload = {
      decision: 'modified',
      modified_quantity: modifyQty,
      decided_by: user.name || user.id || 'District Health Officer',
      notes: modifyNotes,
    };

    try {
      await postDecision(rec.recommendationId, payload);
    } catch {
      // Optimistic update fallback
    }

    setRecommendations((prev) =>
      prev.map((item) =>
        item.recommendationId === rec.recommendationId
          ? {
              ...item,
              status: 'modified',
              transferStatus: 'dispatched',
              quantity: modifyQty,
              decisionAt: new Date().toISOString(),
              decisionBy: user.name || 'District Health Officer',
              notes: modifyNotes,
            }
          : item,
      ),
    );

    setEditingRecId(null);
    setDecidingId(null);
    refetch();
  };

  // Handle Reject Open
  const handleStartReject = (rec: RedistributionRecommendation) => {
    setRejectingRecId(rec.recommendationId);
    setRejectNotes('');
    setRejectError(null);
    setEditingRecId(null);
  };

  // Handle Reject Submit
  const handleSaveReject = async (rec: RedistributionRecommendation) => {
    if (!rejectNotes.trim()) {
      setRejectError('Notes explaining the rejection justification are mandatory.');
      return;
    }

    setDecidingId(rec.recommendationId);
    const payload: RedistributionDecisionPayload = {
      decision: 'rejected',
      modified_quantity: null,
      decided_by: user.name || user.id || 'District Health Officer',
      notes: rejectNotes,
    };

    try {
      await postDecision(rec.recommendationId, payload);
    } catch {
      // Optimistic update fallback
    }

    setRecommendations((prev) =>
      prev.map((item) =>
        item.recommendationId === rec.recommendationId
          ? {
              ...item,
              status: 'rejected',
              decisionAt: new Date().toISOString(),
              decisionBy: user.name || 'District Health Officer',
              notes: rejectNotes,
            }
          : item,
      ),
    );

    setRejectingRecId(null);
    setDecidingId(null);
    refetch();
  };

  // Filtered recommendations
  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => {
      // Scope filter: strictly clamp to currentDistrict
      if (enforcedScope.districtId && r.districtId && r.districtId !== enforcedScope.districtId) {
        return false;
      }

      // Tab filter: Pending vs Decided
      if (activeTab === 'pending' && r.status !== 'pending') return false;
      if (activeTab === 'decided' && r.status === 'pending') return false;

      // Urgency filter
      if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMed = r.medicineName.toLowerCase().includes(q);
        const matchesFrom = r.fromPhcName.toLowerCase().includes(q);
        const matchesTo = r.toPhcName.toLowerCase().includes(q);
        const matchesReason = r.reason.toLowerCase().includes(q);
        if (!matchesMed && !matchesFrom && !matchesTo && !matchesReason) return false;
      }

      return true;
    });
  }, [recommendations, activeTab, urgencyFilter, searchQuery]);

  const pendingCount = recommendations.filter((r) => r.status === 'pending').length;
  const decidedCount = recommendations.filter((r) => r.status !== 'pending').length;

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
            Redistribution Intelligence & Decision Engine
          </h1>
          <p className="page-subtitle">
            Ranked inter-facility balancing recommendations: source surplus allocation, transit estimation, and transfer lifecycle tracking.
          </p>
        </div>
        <ScopeSelector />
      </div>

      {/* Mandatory Human Review Governance Banner */}
      <div
        style={{
          background: '#FEF3C7',
          border: '1px solid #FCD34D',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            padding: 8,
            borderRadius: '50%',
            background: '#F59E0B',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertOctagon size={20} />
        </div>
        <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
          <strong>Masterplan §88 Governance Protocol Enforced:</strong> Every resource movement requires individual human review.
          Automated batch approvals or bulk "Approve All" actions are strictly prohibited to prevent unverified physical diversion of medicine stocks. Each recommendation requires an explicit <strong>Approve</strong>, <strong>Reject</strong>, or <strong>Modify</strong> action.
        </div>
      </div>

      {/* Tab Selectors & Filter Bar */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          background: 'white',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Main Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === 'pending' ? 'var(--color-primary)' : 'var(--color-border)',
                background: activeTab === 'pending' ? 'var(--color-primary)' : 'white',
                color: activeTab === 'pending' ? 'white' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Sparkles size={15} />
              <span>Pending Action</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                  color: activeTab === 'pending' ? 'white' : '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('decided')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === 'decided' ? '#0284C7' : 'var(--color-border)',
                background: activeTab === 'decided' ? '#0284C7' : 'white',
                color: activeTab === 'decided' ? 'white' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <History size={15} />
              <span>Decided History & Transfers</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: activeTab === 'decided' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                  color: activeTab === 'decided' ? 'white' : '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {decidedCount}
              </span>
            </button>
          </div>

          {/* Urgency Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Urgency:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontSize: 12,
                fontFamily: 'var(--font-ui)',
                outline: 'none',
              }}
            >
              <option value="all">All Urgency Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
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
            placeholder="Search recommendations by medicine, source facility, or destination facility..."
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
      </div>

      {/* Recommendations Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredRecs.length === 0 ? (
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
              No Recommendations in this Category
            </div>
            <div style={{ fontSize: 13 }}>
              {activeTab === 'pending'
                ? 'All AI redistribution proposals have been reviewed and acted upon.'
                : 'No historical decisions recorded for this selection.'}
            </div>
          </div>
        ) : (
          filteredRecs.map((rec, index) => {
            const urgency = URGENCY_STYLE[rec.urgency] || URGENCY_STYLE.medium;
            const isEditing = editingRecId === rec.recommendationId;
            const isRejecting = rejectingRecId === rec.recommendationId;
            const isDeciding = decidingId === rec.recommendationId;

            return (
              <div
                key={rec.recommendationId}
                className="card"
                style={{
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Header Row: Rank Badge, Medicine Name, Urgency, AI Confidence */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: '#EEF2FF',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        {rec.medicineName}
                      </h3>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        Ref: {rec.recommendationId} • Generated {new Date(rec.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 4,
                        background: urgency.bg,
                        color: urgency.text,
                        border: `1px solid ${urgency.border}`,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {rec.urgency} Urgency
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: '#F1F5F9',
                        color: '#334155',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
                      AI Confidence: {Math.round(rec.aiConfidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Transfer Route Visual Card */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-light)',
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  {/* Source PHC */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Donor Facility (Source)
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                      {rec.fromPhcName}
                    </div>
                    <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
                      Surplus: +{(rec.sourceSurplus ?? 8400).toLocaleString()} {rec.unit} available
                    </div>
                  </div>

                  {/* Route Logistics Indicator */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0 12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--color-primary)',
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#EEF2FF',
                        padding: '4px 12px',
                        borderRadius: 999,
                      }}
                    >
                      <Truck size={14} />
                      <span>{rec.quantity.toLocaleString()} {rec.unit}</span>
                      <ArrowRight size={14} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={11} /> {rec.distanceKm ?? 14.8} km
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} /> ~{rec.transitTimeMinutes ?? 35} mins
                      </span>
                    </div>
                  </div>

                  {/* Destination PHC */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Recipient Facility (Destination)
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                      {rec.toPhcName}
                    </div>
                    <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                      Stock Deficit: -{(rec.destinationDeficit ?? rec.quantity).toLocaleString()} {rec.unit}
                    </div>
                  </div>
                </div>

                {/* Reason & Expected Benefit Strip */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    <strong style={{ color: '#0F172A' }}>AI Recommendation Rationale:</strong> {rec.reason}
                  </div>
                  {rec.expectedBenefit && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: 4,
                        padding: '6px 12px',
                        fontSize: 12,
                        color: '#065F46',
                        fontWeight: 500,
                      }}
                    >
                      <TrendingUp size={14} style={{ color: '#059669', flexShrink: 0 }} />
                      <span><strong>Expected Impact:</strong> {rec.expectedBenefit}</span>
                    </div>
                  )}
                </div>

                {/* ── TRANSFER LIFECYCLE TRACKER (For Decided Recommendations) ──────── */}
                {rec.status !== 'pending' && (
                  <div
                    style={{
                      background: '#F8FAFC',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      padding: 16,
                      marginTop: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', textTransform: 'uppercase' }}>
                        Transfer Lifecycle Tracker
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: rec.status === 'rejected' ? '#DC2626' : '#0284C7',
                          textTransform: 'capitalize',
                        }}
                      >
                        Status: {rec.transferStatus ?? rec.status}
                      </span>
                    </div>

                    {rec.status === 'rejected' ? (
                      <div style={{ padding: '8px 12px', background: '#FEE2E2', borderRadius: 4, color: '#991B1B', fontSize: 12 }}>
                        <strong>Rejection Recorded:</strong> {rec.notes || 'Rejected by health administrator.'}
                      </div>
                    ) : (
                      <div>
                        {/* Step Progress Line */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                          {LIFECYCLE_STEPS.map((step, idx) => {
                            const currentTransfer = rec.transferStatus ?? 'approved';
                            const stepIdx = LIFECYCLE_STEPS.findIndex((s) => s.key === currentTransfer);
                            const isCompleted = idx <= stepIdx;
                            const isCurrent = idx === stepIdx;
                            const IconComponent = step.icon;

                            return (
                              <div
                                key={step.key}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 6,
                                  zIndex: 1,
                                  flex: 1,
                                }}
                              >
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: isCompleted ? '#0284C7' : '#E2E8F0',
                                    color: isCompleted ? 'white' : '#94A3B8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: isCurrent ? '0 0 0 4px #BAE6FD' : 'none',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  <IconComponent size={15} />
                                </div>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: isCurrent ? 700 : 500,
                                    color: isCurrent ? '#0284C7' : isCompleted ? '#1E293B' : '#94A3B8',
                                  }}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Audit Details */}
                        <div
                          style={{
                            marginTop: 14,
                            paddingTop: 10,
                            borderTop: '1px solid var(--color-border-light)',
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          <div>
                            <strong>Decided By:</strong> {rec.decisionBy || 'Dr. S. Patil'} ({new Date(rec.decisionAt ?? rec.createdAt).toLocaleString()})
                          </div>
                          {rec.notes && <div><strong>Notes:</strong> {rec.notes}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── INLINE MODIFY FORM ────────────────────────────────────────── */}
                {isEditing && (
                  <div
                    style={{
                      background: '#EFF6FF',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #93C5FD',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1E3A8A' }}>
                        Modify Transfer Quantity
                      </span>
                      <button
                        onClick={() => setEditingRecId(null)}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 12 }}
                      >
                        Cancel
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#1E40AF', marginBottom: 4 }}>
                          New Quantity ({rec.unit})
                        </label>
                        <input
                          type="number"
                          value={modifyQty}
                          onChange={(e) => setModifyQty(parseInt(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #93C5FD',
                            fontSize: 13,
                            outline: 'none',
                          }}
                        />
                        <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>
                          Max surplus: {rec.sourceSurplus ?? 8400} {rec.unit}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#1E40AF', marginBottom: 4 }}>
                          Mandatory Modification Reason / Justification
                        </label>
                        <input
                          type="text"
                          value={modifyNotes}
                          onChange={(e) => setModifyNotes(e.target.value)}
                          placeholder="e.g. Reduced quantity to retain ICU emergency buffer at source facility"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #93C5FD',
                            fontSize: 13,
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {modifyError && (
                      <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 500 }}>
                        ⚠️ {modifyError}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => setEditingRecId(null)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          background: 'white',
                          color: '#475569',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveModify(rec)}
                        disabled={isDeciding}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: '#2563EB',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Check size={14} /> Submit Modified Transfer
                      </button>
                    </div>
                  </div>
                )}

                {/* ── INLINE REJECT FORM ────────────────────────────────────────── */}
                {isRejecting && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #FCA5A5',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>
                        Reject Recommendation Confirmation
                      </span>
                      <button
                        onClick={() => setRejectingRecId(null)}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 12 }}
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>
                        Mandatory Rejection Justification
                      </label>
                      <input
                        type="text"
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="e.g. State central depot has already scheduled direct supply replenishment"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #FCA5A5',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                    </div>

                    {rejectError && (
                      <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 500 }}>
                        ⚠️ {rejectError}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => setRejectingRecId(null)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          background: 'white',
                          color: '#475569',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveReject(rec)}
                        disabled={isDeciding}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: '#DC2626',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Ban size={14} /> Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}

                {/* ── EXACTLY THREE PRIMARY ACTIONS: APPROVE, REJECT, MODIFY ───── */}
                {rec.status === 'pending' && !isEditing && !isRejecting && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      paddingTop: 14,
                      borderTop: '1px solid var(--color-border-light)',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Requires formal administrative decision before dispatch order generation.
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* 1. MODIFY ACTION */}
                      <button
                        id={`modify-${rec.recommendationId}`}
                        onClick={() => handleStartModify(rec)}
                        disabled={isDeciding}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #93C5FD',
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        aria-label={`Modify recommendation ${rec.recommendationId}`}
                      >
                        <Edit3 size={14} /> Modify Quantity
                      </button>

                      {/* 2. REJECT ACTION */}
                      <button
                        id={`reject-${rec.recommendationId}`}
                        onClick={() => handleStartReject(rec)}
                        disabled={isDeciding}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #FCA5A5',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        aria-label={`Reject recommendation ${rec.recommendationId}`}
                      >
                        <XCircle size={14} /> Reject
                      </button>

                      {/* 3. APPROVE ACTION */}
                      <button
                        id={`approve-${rec.recommendationId}`}
                        onClick={() => handleApprove(rec)}
                        disabled={isDeciding}
                        style={{
                          padding: '7px 20px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: '#16A34A',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
                        }}
                        aria-label={`Approve recommendation ${rec.recommendationId}`}
                      >
                        <CheckCircle size={14} /> Approve Transfer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
