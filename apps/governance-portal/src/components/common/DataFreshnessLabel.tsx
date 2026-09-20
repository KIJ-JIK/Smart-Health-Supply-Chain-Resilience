'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, RefreshCw, Info } from 'lucide-react';

export interface DataFreshnessLabelProps {
  /** ISO string, Epoch milliseconds, or Date object of the last sync */
  timestamp?: string | number | Date;
  /** Minutes after which data is considered delayed (default 30) */
  staleMinutes?: number;
  /** Minutes after which data is considered critically stale (default 120 / 2h) */
  criticalMinutes?: number;
  /** Custom data source label (e.g. 'PHC Tablet Sync', 'National Telemetry') */
  source?: string;
  /** Compact representation for tight header bars and map legends */
  compact?: boolean;
  /** Whether to allow manual refresh trigger */
  onRefresh?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function DataFreshnessLabel({
  timestamp,
  staleMinutes = 30,
  criticalMinutes = 120,
  source = 'PHC Field Telemetry',
  compact = false,
  onRefresh,
  className = '',
  style,
}: DataFreshnessLabelProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update counter every 30 seconds so freshness label stays accurate live
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute timestamp date
  const syncDate = timestamp ? new Date(timestamp) : new Date(now - 7 * 60 * 1000);
  const diffMs = Math.max(0, now - syncDate.getTime());
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Status classification per Masterplan §59
  const isCriticalStale = diffMins >= criticalMinutes;
  const isDelayed = !isCriticalStale && diffMins >= staleMinutes;
  const isFresh = !isCriticalStale && !isDelayed;

  // Format relative time label
  let relativeText = 'just now';
  if (diffMins >= 1 && diffMins < 60) {
    relativeText = `${diffMins}m ago`;
  } else if (diffHours >= 1 && diffDays < 1) {
    relativeText = `${diffHours}h ${diffMins % 60}m ago`;
  } else if (diffDays >= 1) {
    relativeText = `${diffDays}d ago`;
  }

  // Visual tokens
  const statusColor = isCriticalStale
    ? '#dc2626'
    : isDelayed
    ? '#d97706'
    : '#059669';

  const statusBg = isCriticalStale
    ? '#fef2f2'
    : isDelayed
    ? '#fffbeb'
    : '#ecfdf5';

  const statusBorder = isCriticalStale
    ? '#fecaca'
    : isDelayed
    ? '#fde68a'
    : '#a7f3d0';

  const formattedExact = syncDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`data-freshness-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        ...style,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="data-freshness-badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: compact ? '4px' : '6px',
          padding: compact ? '2px 6px' : '3px 8px',
          borderRadius: '4px',
          backgroundColor: statusBg,
          border: `1px solid ${statusBorder}`,
          color: statusColor,
          fontSize: compact ? '10px' : '11px',
          fontWeight: 500,
          cursor: 'help',
          transition: 'all 0.15s ease',
          lineHeight: 1.2,
        }}
      >
        {/* Pulsing or static status indicator dot */}
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            width: 6,
            height: 6,
          }}
        >
          {isCriticalStale ? (
            <span
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: statusColor,
                animation: 'ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            />
          ) : null}
          <span
            style={{
              position: 'relative',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: statusColor,
            }}
          />
        </span>

        {/* Text */}
        <span>
          {compact ? (
            <span>{relativeText}</span>
          ) : (
            <span>
              Last updated: <strong>{relativeText}</strong>
              {isCriticalStale && (
                <span style={{ marginLeft: 4, fontWeight: 700 }}>[STALE]</span>
              )}
            </span>
          )}
        </span>

        {/* Refresh icon if handler provided */}
        {onRefresh && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: statusColor,
              display: 'flex',
              padding: 0,
              marginLeft: 2,
            }}
            title="Trigger sync check"
            aria-label="Refresh data sync"
          >
            <RefreshCw size={10} />
          </button>
        )}
      </div>

      {/* Popover / Tooltip with Masterplan §59 advisory */}
      {showTooltip && (
        <div
          className="data-freshness-tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: 0,
            zIndex: 9999,
            width: '260px',
            padding: '10px 12px',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '4px',
            }}
          >
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              {isCriticalStale ? (
                <AlertTriangle size={12} color="#dc2626" />
              ) : isDelayed ? (
                <Clock size={12} color="#d97706" />
              ) : (
                <CheckCircle2 size={12} color="#059669" />
              )}
              <span>
                {isCriticalStale
                  ? 'Stale Sync Lag'
                  : isDelayed
                  ? 'Sync Delay'
                  : 'Live Synced'}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>{formattedExact}</span>
          </div>

          <div style={{ color: '#475569', lineHeight: 1.4, marginBottom: 6 }}>
            <div>
              <strong>Source:</strong> {source}
            </div>
            <div>
              <strong>Sync Latency:</strong> {relativeText}
            </div>
          </div>

          <div
            style={{
              fontSize: '10px',
              color: isCriticalStale ? '#b91c1c' : '#64748b',
              backgroundColor: isCriticalStale ? '#fef2f2' : '#f8fafc',
              padding: '4px 6px',
              borderRadius: '4px',
              border: `1px solid ${isCriticalStale ? '#fecaca' : '#e2e8f0'}`,
              lineHeight: 1.3,
            }}
          >
            <strong>Masterplan §59 Notice:</strong> PHC data syncs asynchronously via offline-first queues. Verify field connectivity before dispatching resources based on high latency data.
          </div>
        </div>
      )}
    </div>
  );
}
