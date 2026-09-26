import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Globe2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  X,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';

interface RegionalAlert {
  country: string;
  alertType: string;
  severity: string;
  observation: string;
}

interface BricsAiBriefingData {
  threatLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  language: string;
  headline: string;
  executiveSummary: string;
  regionalAlerts: RegionalAlert[];
  federatedSurveillance: {
    activeRound: string;
    modelAccuracy: string;
    privacyBudgetHealth: string;
    consensusStatus: string;
  };
  multilateralRecommendations: string[];
  generatedAt: string;
  modelVersion: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🌐' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文 (Mandarin)', flag: '🇨🇳' },
];

interface BricsAiBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BricsAiBriefingModal: React.FC<BricsAiBriefingModalProps> = ({ isOpen, onClose }) => {
  const [selectedLang, setSelectedLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<BricsAiBriefingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async (langCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/brics/ai-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: langCode }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to generate briefing');
      }
      setBriefing(json.data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Google AI Briefing engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBriefing(selectedLang);
    }
  }, [isOpen, selectedLang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#0f1f38] border border-slate-200 dark:border-[#1e3a5f] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#0b1e36] text-white p-4.5 flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Sparkles className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Google Gemini Multilateral Intelligence Briefing
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40 uppercase font-semibold">
                  CROSS-BORDER GOOGLE AI
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Federated epidemiological surveillance &amp; cross-border medicine supply chain resilience across BRICS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selection Tabs */}
        <div className="bg-slate-100 dark:bg-[#152b4d] px-4 py-2 border-b border-slate-200 dark:border-[#1e3a5f] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mr-1">
              Select Language:
            </span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedLang === lang.code
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#0b1e36] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e3a5f]'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchBriefing(selectedLang)}
            disabled={loading}
            className="p-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded flex items-center gap-1 transition-colors"
            title="Refresh AI Briefing"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {loading && (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Google Gemini is synthesizing cross-border epidemiological intelligence...
              </div>
              <div className="text-slate-500 text-xs font-mono">
                Querying PostgreSQL federation rounds &amp; translating into {LANGUAGES.find((l) => l.code === selectedLang)?.label}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {briefing && !loading && (
            <div className="space-y-4 animate-fadeIn">
              {/* Top Threat Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-[#112240] dark:to-[#172d54] border border-slate-200 dark:border-[#1e3a5f] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                      Threat Level: {briefing.threatLevel}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Generated: {new Date(briefing.generatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {briefing.headline}
                  </h3>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Model:</div>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {briefing.modelVersion}
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#112240] border border-slate-200 dark:border-[#1e3a5f] shadow-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-[11px]">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Executive Epidemiological &amp; Supply Chain Assessment</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {briefing.executiveSummary}
                </p>
              </div>

              {/* Regional Alerts Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-[11px]">
                    Regional Surveillance &amp; Outbreak Signals
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Cross-border Sentinel Nodes</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {briefing.regionalAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-[#1e3a5f] bg-white dark:bg-[#112240] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{alert.country}</span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            alert.severity === 'HIGH'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : alert.severity === 'MODERATE'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                        {alert.alertType}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                        {alert.observation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Federated Surveillance State */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0b1e36] border border-slate-200 dark:border-[#1e3a5f]">
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Active Round</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {briefing.federatedSurveillance.activeRound}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Model Accuracy</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {briefing.federatedSurveillance.modelAccuracy}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Differential Privacy</div>
                  <div className="font-bold text-teal-600 dark:text-teal-400 text-xs">
                    {briefing.federatedSurveillance.privacyBudgetHealth}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Consensus Quorum</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                    {briefing.federatedSurveillance.consensusStatus}
                  </div>
                </div>
              </div>

              {/* Multilateral Recommendations */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Recommended Multilateral Action Protocols:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-xs">
                  {briefing.multilateralRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-100 dark:bg-[#0b1e36] border-t border-slate-200 dark:border-[#1e3a5f] flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Powered by Google Gemini Generative AI &amp; Differential Privacy Architecture
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Close Briefing
          </button>
        </div>
      </div>
    </div>
  );
};
