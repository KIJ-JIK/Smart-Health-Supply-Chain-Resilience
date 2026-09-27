'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ForecastsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ForecastsError({ error, reset }: ForecastsErrorProps) {
  useEffect(() => {
    // Log the error to console or telemetry service
    console.error('[Forecasts Error Boundary caught error]:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '48px 24px',
        background: '#ffffff',
        borderRadius: 12,
        border: '1px solid #fee2e2',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.06)',
        margin: '24px 0',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <AlertTriangle size={28} color="#dc2626" />
      </div>

      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#991b1b',
          margin: '0 0 8px',
        }}
      >
        AI Forecasts Engine Temporarily Unavailable
      </h2>

      <p
        style={{
          fontSize: 13,
          color: '#64748b',
          maxWidth: 520,
          margin: '0 0 20px',
          lineHeight: 1.6,
        }}
      >
        A client-side error occurred while rendering the predictive model trajectories.
        The data pipeline may be synchronizing or encountered an unexpected payload format.
        <br />
        <code
          style={{
            display: 'inline-block',
            marginTop: 8,
            fontSize: 12,
            color: '#dc2626',
            background: '#fef2f2',
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #fecaca',
            fontFamily: 'monospace',
            wordBreak: 'break-word',
            maxWidth: '100%',
          }}
        >
          {error?.message || 'Unknown render exception'}
        </code>
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => reset()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#2563eb',
            color: '#ffffff',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8')}
          onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#2563eb')}
        >
          <RotateCcw size={14} /> Try Again
        </button>

        <button
          onClick={() => window.location.reload()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#f1f5f9',
            color: '#334155',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0')}
          onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9')}
        >
          <RefreshCw size={14} /> Reload Forecasts
        </button>
      </div>
    </div>
  );
}
