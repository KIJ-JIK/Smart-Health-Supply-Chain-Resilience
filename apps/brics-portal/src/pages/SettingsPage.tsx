// ---------------------------------------------------------------------------
// Settings & Country Onboarding — BRICS Federated Intelligence & Governance
// ---------------------------------------------------------------------------

import React from 'react';
import { useQuery } from '@apollo/client';
import {
  Settings,
  Server,
  ShieldCheck,
  Lock,
  Globe,
  RefreshCw,
  Cpu,
  Key,
  Layers,
} from 'lucide-react';
import { GET_FEDERATED_NODES } from '@/graphql';
import { StatusBadge, DataFreshnessLabel, CardSkeleton, ErrorState } from '@/components/common';
import { DisabledCountryButton } from '@/components/settings';
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
      <div className="max-w-7xl mx-auto py-6">
        <ErrorState
          title="Failed to Load Federation Settings"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-400" />
            Federation Coordinator Settings &amp; Cryptography Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sovereign participant registry, mTLS encryption cipher suites, and multi-cloud sync endpoints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DisabledCountryButton />
        </div>
      </div>

      {/* Coordinator Endpoints & Cluster Info */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Central Federation Coordinator Topology</h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
            Cluster Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#0d1523] border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
              Central Sync Ingestion API
            </span>
            <p className="font-mono text-teal-300 font-bold text-sm">http://localhost:8000</p>
            <p className="text-[11px] text-slate-500">FastAPI &amp; Express Telemetry Ingestion</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1523] border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
              AI Demand &amp; Optimization Engine
            </span>
            <p className="font-mono text-cyan-300 font-bold text-sm">http://localhost:5000</p>
            <p className="text-[11px] text-slate-500">Prophet &amp; FedAvg Aggregator Service</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1523] border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
              District Command Bridge
            </span>
            <p className="font-mono text-indigo-300 font-bold text-sm">http://localhost:3000</p>
            <p className="text-[11px] text-slate-500">Varanasi UP Health Administration Portal</p>
          </div>
        </div>
      </div>

      {/* Sovereign Nation Nodes Specification Table */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">
              Sovereign Member State Enclaves (5 Member Consortium)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Quorum Threshold: 4 of 5</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="py-2.5 px-3">Sovereign Nation</th>
                <th className="py-2.5 px-3">Node Status</th>
                <th className="py-2.5 px-3">gRPC Port</th>
                <th className="py-2.5 px-3">TLS Cipher</th>
                <th className="py-2.5 px-3">Authentication</th>
                <th className="py-2.5 px-3">Legal &amp; Privacy Framework</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300 text-[11px]">
              {nodes.map((node) => {
                const conf = PROTOCOL_CONFIGS[node.countryCode] || {
                  grpcPort: 8443,
                  tlsCipher: 'TLS_AES_256_GCM_SHA384',
                  authType: 'mTLS + X.509',
                  legalJurisdiction: 'Data Residency Sovereignty',
                };
                const flag = COUNTRY_FLAGS[node.countryCode];

                return (
                  <tr key={node.countryCode} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 font-sans font-semibold text-white flex items-center gap-2">
                      <span className="text-xl">{flag}</span>
                      <span>{node.countryName}</span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={node.status} size="sm" pulse={node.status === 'participating'} />
                    </td>
                    <td className="py-3 px-3 text-cyan-300">{conf.grpcPort}</td>
                    <td className="py-3 px-3 text-slate-300">{conf.tlsCipher}</td>
                    <td className="py-3 px-3 text-emerald-400">{conf.authType}</td>
                    <td className="py-3 px-3 font-sans text-slate-400">{conf.legalJurisdiction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
