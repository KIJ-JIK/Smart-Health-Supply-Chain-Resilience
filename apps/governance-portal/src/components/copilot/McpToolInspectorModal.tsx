'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Database,
  Activity,
  CheckCircle2,
  AlertCircle,
  Play,
  Terminal,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useChatHistoryStore } from '@/store/chatHistoryStore';
import { useLanguageStore } from '@/store/languageStore';

interface McpTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export function McpToolInspectorModal() {
  const { isMcpModalOpen, setMcpModalOpen } = useChatHistoryStore();
  const { language } = useLanguageStore();

  const [tools, setTools] = useState<McpTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  useEffect(() => {
    if (isMcpModalOpen) {
      fetch('/api/v1/mcp/tools')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.tools)) {
            setTools(data.tools);
            if (data.tools.length > 0 && !selectedTool) {
              setSelectedTool(data.tools[0]);
            }
          }
        })
        .catch(() => {});
    }
  }, [isMcpModalOpen]);

  if (!isMcpModalOpen) return null;

  const handleRunTool = async () => {
    if (!selectedTool) return;
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const res = await fetch('/api/v1/mcp/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: selectedTool.name,
          args: toolArgs,
        }),
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch (err: any) {
      setExecutionResult({ status: 'error', error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={() => setMcpModalOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 880,
          maxHeight: '90vh',
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #0F172A, #1E293B)',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60A5FA',
                border: '1px solid rgba(96, 165, 250, 0.3)',
              }}
            >
              <Cpu size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {language === 'hi' ? 'मॉडल संदर्भ प्रोटोकॉल (MCP) टूल्स' : 'Model Context Protocol (MCP) Server'}
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                {language === 'hi' ? 'लाइव हेल्थ इंटेलिजेंस और आरएलएस डेटाबेस टूल्स' : 'Standardized Agentic Health Data & Telemetry Tools'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMcpModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body - Dual Pane */}
        <div style={{ display: 'flex', flex: 1, minHeight: 460, overflow: 'hidden' }}>
          {/* Left: Tool List */}
          <div
            style={{
              width: 300,
              borderRight: '1px solid var(--color-border)',
              background: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              {language === 'hi' ? 'उपलब्ध MCP टूल्स' : 'Registered MCP Tools'} ({tools.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tools.map((t) => {
                const isSel = selectedTool?.name === t.name;
                return (
                  <button
                    key={t.name}
                    onClick={() => {
                      setSelectedTool(t);
                      setToolArgs({});
                      setExecutionResult(null);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: isSel ? '1px solid #3B82F6' : '1px solid #E2E8F0',
                      background: isSel ? '#EFF6FF' : 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Terminal size={15} style={{ color: isSel ? '#2563EB' : '#64748B', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isSel ? '#1E40AF' : '#1E293B', fontFamily: 'monospace' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Tool Details & Test Runner */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 20 }}>
            {selectedTool ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                      {selectedTool.name}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                      MCP v2024-11-05
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    {selectedTool.description}
                  </p>
                </div>

                {/* Parameters Form */}
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 10 }}>
                    {language === 'hi' ? 'टूल पैरामीटर्स' : 'Tool Arguments (Parameters)'}
                  </div>
                  {Object.keys(selectedTool.parameters.properties).length === 0 ? (
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>No arguments required for this tool.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {Object.entries(selectedTool.parameters.properties).map(([paramName, paramDef]) => (
                        <div key={paramName} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: 'monospace' }}>
                            {paramName} {selectedTool.parameters.required.includes(paramName) && <span style={{ color: '#EF4444' }}>*</span>}
                          </label>
                          <input
                            type="text"
                            value={toolArgs[paramName] || ''}
                            onChange={(e) => setToolArgs({ ...toolArgs, [paramName]: e.target.value })}
                            placeholder={paramDef.description}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 6,
                              border: '1px solid #CBD5E1',
                              fontSize: 12.5,
                              fontFamily: 'monospace',
                              background: 'white',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleRunTool}
                    disabled={isRunning}
                    style={{
                      marginTop: 14,
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: isRunning ? '#94A3B8' : '#2563EB',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Play size={14} />
                    {isRunning ? (language === 'hi' ? 'निष्पादित हो रहा है...' : 'Executing MCP Tool...') : (language === 'hi' ? 'टूल चलाएं (Run Tool)' : 'Execute MCP Tool')}
                  </button>
                </div>

                {/* Output Console */}
                {executionResult && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{language === 'hi' ? 'निष्पादन परिणाम (Telemetry Result)' : 'Tool Output Payload'}</span>
                      {executionResult.executionTimeMs && (
                        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                          Latency: {executionResult.executionTimeMs}ms
                        </span>
                      )}
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: 12,
                        background: '#0F172A',
                        color: '#38BDF8',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontFamily: 'monospace',
                        overflowX: 'auto',
                        maxHeight: 220,
                        lineHeight: 1.45,
                      }}
                    >
                      {JSON.stringify(executionResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ margin: 'auto', color: '#94A3B8', fontSize: 13 }}>
                Select an MCP tool from the left list to inspect its schema and run execution tests.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
