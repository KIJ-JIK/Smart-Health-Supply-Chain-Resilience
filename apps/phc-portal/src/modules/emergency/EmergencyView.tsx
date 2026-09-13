import React, { useState } from 'react';
import {
  Zap,
  AlertTriangle,
  Send,
  Clock,
  CheckCircle2,
  PhoneCall,
  ShieldAlert,
} from 'lucide-react';
import { useMutationQueue, generateUUID } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { formatDateTime } from '../../utils/date';

export const EmergencyView: React.FC = () => {
  const alerts = useLiveQuery(() => db.alerts.reverse().sortBy('created_at')) || [];
  const { enqueue } = useMutationQueue();
  const { addToast } = useUIStore();

  const [emergencyType, setEmergencyType] = useState('Mass Casualty / Road Accident');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('critical');
  const [description, setDescription] = useState('');
  const [requiredResources, setRequiredResources] = useState('Emergency Blood IV, Trauma Kit, Additional Doctors');
  const [affectedPatientsCount, setAffectedPatientsCount] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await enqueue('alert_report', {
        id: generateUUID(),
        alert_type: 'outbreak',
        severity,
        title: `EMERGENCY: ${emergencyType}`,
        message: `${description} (${affectedPatientsCount} affected). Required: ${requiredResources}`,
        source_module: 'emergency',
        payload: { emergency_type: emergencyType, affected_count: affectedPatientsCount, required_resources: requiredResources },
      });
      addToast('CRITICAL EMERGENCY ALERT BROADCASTED TO DISTRICT COMMAND CENTER!', 'success');
      setDescription('');
    } catch {
      addToast('Failed to broadcast emergency alert', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header — red gradient banner */}
      <div className="bg-gradient-to-r from-rose-700 to-rose-600 text-white p-5 rounded-2xl shadow-lg shadow-rose-300/30 dark:shadow-rose-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center animate-pulse-ring">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide">Emergency Crisis & Incident Center</h2>
              <p className="text-xs text-rose-100 mt-0.5">Immediate central alert escalation pipeline</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-white/15 border border-white/20 px-3 py-2 rounded-xl backdrop-blur-sm">
          <PhoneCall className="w-4 h-4" />
          <span>District CMO Hotline: 108 / 102</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Broadcast High-Priority Incident</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Offline queue sends priority alert to District Control Room on next connectivity trigger.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Incident Type *</label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="Mass Casualty / Road Accident">Mass Casualty / Road Accident</option>
                  <option value="Epidemic / Disease Outbreak Surge">Epidemic / Disease Outbreak Surge</option>
                  <option value="Oxygen Supply Failure">Oxygen Supply Failure</option>
                  <option value="Vaccine Cold Chain Power Breakdown">Vaccine Cold Chain Power Breakdown</option>
                  <option value="Flood / Natural Disaster">Flood / Natural Disaster</option>
                  <option value="Structural / Fire Hazard">Structural / Fire Hazard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Severity Level *</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-rose-300 dark:border-rose-700 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-black"
                >
                  <option value="critical">CRITICAL (Immediate Red Alert)</option>
                  <option value="high">HIGH (Urgent Response)</option>
                  <option value="medium">MEDIUM (Priority Support)</option>
                  <option value="low">LOW (Informational)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Affected Patients (No PII) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={affectedPatientsCount}
                  onChange={(e) => setAffectedPatientsCount(Math.max(0, parseInt(e.target.value) || 0))}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Required Emergency Resources</label>
                <input
                  type="text"
                  value={requiredResources}
                  onChange={(e) => setRequiredResources(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Incident Description & Clinical Triage Status *
              </label>
              <textarea
                rows={3}
                placeholder="Describe situation, required specialist doctors, blood units, ambulances..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="danger"
                size="lg"
                loading={isSubmitting}
                leftIcon={<Zap className="w-4 h-4 fill-current" />}
              >
                {isSubmitting ? 'BROADCASTING…' : 'BROADCAST CRITICAL ALERT'}
              </Button>
            </div>
          </form>
        </div>

        {/* Alert History */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
            Active Alerts & Flags
          </h3>
          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No active alerts</p>
            ) : alerts.map((a) => (
              <div
                key={a.id}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  a.severity === 'critical'
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{a.title}</h4>
                  <StatusBadge status={a.severity} size="sm" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{a.message}</p>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{formatDateTime(a.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
