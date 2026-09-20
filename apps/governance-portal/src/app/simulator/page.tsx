'use client';
import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWsSession } from '@/hooks/useWsSession';
import { ShieldAlert, Play, Square } from 'lucide-react';

type SimMsg = { text: string; role: 'system' | 'model'; timestamp: string };

const SCENARIOS = [
  { id: 'flood', label: 'Flash Flood — Supply Disruption', description: 'Simulates a district-wide supply chain break after severe flooding. Tests redistribution and emergency procurement.' },
  { id: 'outbreak', label: 'Multi-district Dengue Outbreak', description: 'Models exponential case growth and resource demand across 5 districts.' },
  { id: 'stockout', label: 'State-wide Medicine Stockout', description: 'Stress-tests redistribution and emergency procurement with complete stockout of 3 essential medicines.' },
  { id: 'pandemic', label: 'Pandemic Surge — ICU Overflow', description: 'Projects surge capacity needs and workforce reallocation under a 10× baseline case load.' },
];

export default function SimulatorPage() {
  const { user } = useAuthStore();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const { status, messages, send, close, reconnect } = useWsSession<string, SimMsg>(
    '/api/v1/governance/simulator/session',
    {
      enabled: sessionActive,
      autoReconnect: false,
      onMessage: (msg) => console.debug('[Simulator]', msg),
    },
  );

  if (!['national_admin', 'state_admin'].includes(user.role)) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        🔒 Crisis Simulator requires State Admin or above.
      </div>
    );
  }

  const startSession = () => {
    if (!selectedScenario) return;
    setSessionActive(true);
    setTimeout(() => {
      send('start_scenario', selectedScenario);
    }, 800);
  };

  const endSession = () => {
    close();
    setSessionActive(false);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Crisis Simulator</h1>
        <p className="page-subtitle">Interactive scenario planning powered by AI — decisions have no real-world effect</p>
      </div>

      <div className="grid-2">
        {/* Scenario selector */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">Select Scenario</span>
            </div>
            <div style={{ padding: '8px' }}>
              {SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  id={`scenario-${sc.id}`}
                  onClick={() => !sessionActive && setSelectedScenario(sc.id)}
                  role="radio"
                  aria-checked={selectedScenario === sc.id}
                  tabIndex={0}
                  style={{
                    padding: '12px',
                    margin: '4px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedScenario === sc.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: selectedScenario === sc.id ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    cursor: sessionActive ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-fast)',
                    opacity: sessionActive && selectedScenario !== sc.id ? 0.5 : 1,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: selectedScenario === sc.id ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                    {sc.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{sc.description}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
              {!sessionActive ? (
                <button
                  id="start-simulator-btn"
                  onClick={startSession}
                  disabled={!selectedScenario}
                  style={{
                    flex: 1, padding: '8px', background: selectedScenario ? 'var(--color-primary)' : 'var(--color-surface-2)',
                    color: selectedScenario ? 'white' : 'var(--color-text-muted)',
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: selectedScenario ? 'pointer' : 'not-allowed',
                    fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  aria-label="Start crisis simulation"
                >
                  <Play size={14} /> Start Simulation
                </button>
              ) : (
                <button
                  id="end-simulator-btn"
                  onClick={endSession}
                  style={{
                    flex: 1, padding: '8px', background: 'var(--color-critical)',
                    color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  aria-label="End crisis simulation"
                >
                  <Square size={14} /> End Session
                </button>
              )}
            </div>
          </div>

          {/* WS status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)', padding: '0 4px' }}>
            <span className={`sse-dot ${status}`} />
            WebSocket: {status}
          </div>
        </div>

        {/* Session transcript */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <span className="card-title">Session Transcript</span>
            {sessionActive && <span className="badge badge-critical">● Live</span>}
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 340,
              padding: '12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontFamily: 'monospace',
              fontSize: 12,
              background: '#f8fafc',
            }}
          >
            {!sessionActive && messages.length === 0 && (
              <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: 60 }}>
                Start a scenario to begin the simulation session.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ color: m.payload.role === 'model' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>
                  [{new Date(m.timestamp).toLocaleTimeString('en-IN')}]
                </span>{' '}
                {m.payload.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
