// ---------------------------------------------------------------------------
// Settings & Country Onboarding Stub — BRICS Federated Intelligence Portal
//
// Features (Prompt 7):
// - Read-only list of the 5 fixed sovereign countries (India, Brazil, Russia, China, South Africa)
// - Configured coordinator endpoints (stubbed)
// - Disabled "Add Country" button with accessible tooltip explaining:
//     "Onboarding a new federation participant is an out-of-scope, Phase-5+
//      operational process requiring legal/data-sovereignty review, not a
//      self-service UI action for this build."
// ---------------------------------------------------------------------------

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_FEDERATED_NODES } from '@/graphql';
import { StatusBadge, DataFreshnessLabel, CardSkeleton, ErrorState } from '@/components/common';
import { DisabledCountryButton } from '@/components/settings';
import { colors, typography } from '@/styles/theme';
import type { FederatedNode } from '@/types/federated';

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  BR: '🇧🇷',
  RU: '🇷🇺',
  CN: '🇨🇳',
  ZA: '🇿🇦',
};

const PROTOCOL_CONFIGS: Record<
  string,
  {
    grpcPort: number;
    tlsCipher: string;
    authType: string;
    legalJurisdiction: string;
  }
> = {
  IN: {
    grpcPort: 8443,
    tlsCipher: 'TLS_AES_256_GCM_SHA384',
    authType: 'mTLS + Sovereign X.509 Certificate',
    legalJurisdiction: 'Digital Personal Data Protection (DPDP) Act (India)',
  },
  BR: {
    grpcPort: 8443,
    tlsCipher: 'TLS_AES_256_GCM_SHA384',
    authType: 'mTLS + Sovereign X.509 Certificate',
    legalJurisdiction: 'Lei Geral de Proteção de Dados (LGPD) (Brazil)',
  },
  RU: {
    grpcPort: 8443,
    tlsCipher: 'TLS_AES_256_GCM_SHA384',
    authType: 'mTLS + Sovereign X.509 Certificate',
    legalJurisdiction: 'Federal Law No. 152-FZ on Personal Data (Russia)',
  },
  CN: {
    grpcPort: 8443,
    tlsCipher: 'TLS_AES_256_GCM_SHA384',
    authType: 'mTLS + Sovereign X.509 Certificate',
    legalJurisdiction: 'Personal Information Protection Law (PIPL) (China)',
  },
  ZA: {
    grpcPort: 8443,
    tlsCipher: 'TLS_AES_256_GCM_SHA384',
    authType: 'mTLS + Sovereign X.509 Certificate',
    legalJurisdiction: 'Protection of Personal Information Act (POPIA) (South Africa)',
  },
};

export default function SettingsPage() {
  const { data, loading, error, refetch } = useQuery<{
    federatedNodes: FederatedNode[];
  }>(GET_FEDERATED_NODES);

  const nodes = data?.federatedNodes || [];

  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: '20px auto' }}>
        <ErrorState
          title="Failed to Load Federation Settings"
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ ...typography.titleLarge, color: colors.text.primary, margin: 0 }}>
              Federation Settings &amp; Topology Configuration
            </h2>
            <StatusBadge tone="green" label="Phase 5 Fixed 5-Node Cluster" size="sm" />
          </div>
          <p style={{ ...typography.body, color: colors.text.secondary, marginTop: 4, maxWidth: 750 }}>
            Read-only registry of coordinator endpoints, sovereign legal jurisdictions, and cryptographic
            handshake parameters.
          </p>
        </div>

        {/* Disabled Add Country Button with Tooltip */}
        <DisabledCountryButton />
      </div>

      {/* Legal & Data Sovereignty Architecture Notice */}
      <div
        style={{
          backgroundColor: colors.bg.surface,
          border: `1px solid ${colors.bg.border}`,
          borderRadius: 8,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h4 style={{ ...typography.titleMedium, color: colors.text.primary, margin: 0 }}>
            Consortium Expansion &amp; Sovereign Onboarding Protocol
          </h4>
          <p
            style={{
              ...typography.bodySmall,
              color: colors.text.secondary,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Membership in the BRICS Federated Health AI network is governed by multilateral treaty.
            Onboarding a candidate sovereign node cannot be performed via self-service portal actions;
            it mandates cross-border bilateral data-protection clearance, DP-SGD budget negotiation, and
            mutual TLS certificate pinning.
          </p>
        </div>
      </div>

      {/* Read-Only Participant List */}
      <div
        style={{
          backgroundColor: colors.bg.surface,
          border: `1px solid ${colors.bg.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.bg.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ ...typography.titleMedium, color: colors.text.primary, margin: 0 }}>
            Configured Sovereign Coordinator Endpoints
          </h3>
          <span style={{ ...typography.bodySmall, color: colors.text.muted }}>
            Fixed 5-Member Consortium (Phase 5 Architectural Scope)
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 16 }}>
            <CardSkeleton count={5} height={80} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {nodes.map((node, index) => {
              const flag = COUNTRY_FLAGS[node.countryCode] || '';
              const config = PROTOCOL_CONFIGS[node.countryCode] || {
                grpcPort: 8443,
                tlsCipher: 'TLS_AES_256_GCM_SHA384',
                authType: 'mTLS + Sovereign X.509',
                legalJurisdiction: 'Sovereign Data Jurisdiction',
              };

              return (
                <div
                  key={node.countryCode}
                  style={{
                    padding: '20px 24px',
                    borderBottom:
                      index < nodes.length - 1 ? `1px solid ${colors.bg.borderSubtle}` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    backgroundColor: index % 2 === 1 ? colors.bg.surfaceHover : 'transparent',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '1.75rem' }}>{flag}</span>
                      <div>
                        <div
                          style={{
                            ...typography.body,
                            fontWeight: 700,
                            color: colors.text.primary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span>{node.countryName}</span>
                          <span style={{ ...typography.bodySmall, color: colors.text.muted }}>
                            ({node.countryCode})
                          </span>
                        </div>
                        <div style={{ ...typography.bodySmall, color: colors.text.muted }}>
                          Legal Regime: {config.legalJurisdiction}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StatusBadge status={node.status} size="sm" />
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          backgroundColor: colors.bg.surfaceHover,
                          border: `1px solid ${colors.bg.border}`,
                          color: colors.text.secondary,
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontFamily: 'monospace',
                        }}
                      >
                        Port {config.grpcPort}
                      </span>
                    </div>
                  </div>

                  {/* Endpoint Details Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 12,
                      backgroundColor: colors.bg.surface,
                      border: `1px solid ${colors.bg.borderSubtle}`,
                      borderRadius: 6,
                      padding: 12,
                      ...typography.bodySmall,
                    }}
                  >
                    <div>
                      <span style={{ color: colors.text.muted, display: 'block', fontSize: '0.6875rem' }}>
                        Coordinator gRPC/HTTPS API Endpoint:
                      </span>
                      <span
                        style={{
                          ...typography.mono,
                          color: colors.brand.primary,
                          wordBreak: 'break-all',
                        }}
                      >
                        {node.coordinatorEndpoint || 'https://fed-coordinator.smarthealth.gov/api'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: colors.text.muted, display: 'block', fontSize: '0.6875rem' }}>
                        Authentication &amp; Transport Security:
                      </span>
                      <span style={{ color: colors.text.primary, fontWeight: 500 }}>
                        {config.authType} ({config.tlsCipher.split('_')[1]})
                      </span>
                    </div>

                    <div>
                      <span style={{ color: colors.text.muted, display: 'block', fontSize: '0.6875rem' }}>
                        Last Handshake Verification:
                      </span>
                      <DataFreshnessLabel
                        timestamp={node.lastModelUpload || '2026-09-10T14:00:00.000Z'}
                        prefix="Verified"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Protocol Configuration Parameters Footer */}
      <div
        style={{
          backgroundColor: colors.bg.surface,
          border: `1px solid ${colors.bg.border}`,
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          ...typography.bodySmall,
          color: colors.text.muted,
        }}
      >
        <span>
          Consortium Transport: <strong>Flower / FedAvg Engine</strong> | Coordination Protocol:{' '}
          <strong>mTLS Cross-Border Channel</strong>
        </span>
        <span>Version: BRICS-FED-PROT-v2.4</span>
      </div>
    </div>
  );
}

