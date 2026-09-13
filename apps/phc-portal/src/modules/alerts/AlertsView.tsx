import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useUIStore } from '../../stores/uiStore';
import { Alert } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDateTime } from '../../utils/date';

export const AlertsView: React.FC = () => {
  const alerts = useLiveQuery(() => db.alerts.reverse().sortBy('created_at')) || [];
  const { setActiveTab, setInventorySubTab, addToast } = useUIStore();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const handleResolve = async (alertId: string) => {
    await db.alerts.update(alertId, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    });
    addToast('Alert marked resolved!', 'success');
  };

  const handleNavigateToSource = (alert: Alert) => {
    switch (alert.source_module) {
      case 'inventory':
        setActiveTab('inventory');
        setInventorySubTab(alert.alert_type === 'near_expiry' ? 'expiry' : 'current_stock');
        break;
      case 'beds':      setActiveTab('beds');      break;
      case 'oxygen':    setActiveTab('oxygen');    break;
      case 'staff':     setActiveTab('staff');     break;
      case 'equipment': setActiveTab('equipment'); break;
      case 'emergency': setActiveTab('emergency'); break;
      case 'requests':  setActiveTab('requests');  break;
      default:          setActiveTab('dashboard'); break;
    }
  };

  const filteredAlerts = alerts.filter((a) =>
    filterSeverity === 'all' ? true : a.severity === filterSeverity
  );

  const filterOptions = ['all', 'critical', 'high', 'medium', 'low'];

  const severityFilterColors: Record<string, string> = {
    all:      'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900',
    critical: 'bg-rose-600 text-white',
    high:     'bg-amber-500 text-white',
    medium:   'bg-sky-600 text-white',
    low:      'bg-emerald-600 text-white',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Operational Alerts & Flags</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Central notification stream linking directly to source modules
              </p>
            </div>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterOptions.map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                filterSeverity === sev
                  ? severityFilterColors[sev] || 'bg-slate-900 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="relative space-y-0">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 dark:text-slate-500">
            No alerts matching current filter.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline connector */}
            <div className="absolute left-5 top-6 bottom-6 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-3">
              {filteredAlerts.map((alert, idx) => (
                <div
                  key={alert.id}
                  className={`relative flex gap-4 animate-stagger-in`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Timeline dot */}
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 ${
                      alert.status === 'resolved'
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                        : alert.severity === 'critical'
                        ? 'bg-rose-100 dark:bg-rose-900/50 border-rose-300 dark:border-rose-700'
                        : alert.severity === 'high'
                        ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700'
                        : 'bg-sky-100 dark:bg-sky-900/50 border-sky-300 dark:border-sky-700'
                    }`}
                  >
                    {alert.status === 'resolved' ? (
                      <CheckCircle2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    ) : (
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          alert.severity === 'critical'
                            ? 'text-rose-600 dark:text-rose-400'
                            : alert.severity === 'high'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-sky-600 dark:text-sky-400'
                        }`}
                      />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className={`flex-1 bg-white dark:bg-slate-800 rounded-2xl border p-4 shadow-sm space-y-2.5 transition-all ${
                      alert.status === 'resolved'
                        ? 'border-slate-200 dark:border-slate-700 opacity-55'
                        : alert.severity === 'critical'
                        ? 'border-rose-200 dark:border-rose-800 ring-1 ring-rose-100 dark:ring-rose-900'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{alert.title}</h3>
                        <StatusBadge status={alert.severity} size="sm" />
                        {alert.status === 'resolved' && <StatusBadge status="SYNCED" size="sm" />}
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                        {formatDateTime(alert.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300">{alert.message}</p>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        Source: <span className="text-primary-700 dark:text-primary-400 font-bold">{alert.source_module}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {alert.status === 'open' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleNavigateToSource(alert)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/60 font-bold text-[11px] rounded-lg transition-colors"
                        >
                          <span>Open Module</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
