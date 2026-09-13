import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useMutationQueue, generateUUID } from '../../hooks/useMutationQueue';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export const EmergencyModal: React.FC = () => {
  const { isEmergencyModalOpen, setEmergencyModalOpen, addToast } = useUIStore();
  const { enqueue } = useMutationQueue();

  const [emergencyType, setEmergencyType] = useState('Mass Casualty / Trauma');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('critical');
  const [description, setDescription] = useState('');
  const [affectedCount, setAffectedCount] = useState<number>(4);
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
        message: `${description} (${affectedCount} patients).`,
        source_module: 'emergency',
        payload: { emergency_type: emergencyType, affected_count: affectedCount },
      });
      addToast('CRITICAL EMERGENCY BROADCAST ENQUEUED!', 'success');
      setEmergencyModalOpen(false);
      setDescription('');
    } catch {
      addToast('Failed to submit emergency alert', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isEmergencyModalOpen}
      onClose={() => setEmergencyModalOpen(false)}
      title="🚨 Fast Emergency Incident Report"
      subtitle="Highest-priority broadcast to District CMO & State Health Command"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-300 font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-rose-600 dark:text-rose-400 fill-current shrink-0" />
          <span>Priority Alert will bypass batch latency and trigger central emergency alarm.</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Emergency Category *</label>
          <select
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
          >
            <option value="Mass Casualty / Trauma">Mass Casualty / Trauma</option>
            <option value="Disease Outbreak / Epidemic Surge">Disease Outbreak / Epidemic Surge</option>
            <option value="Oxygen Supply Failure">Oxygen Supply Failure</option>
            <option value="Power Grid & Cold Chain Failure">Power Grid & Cold Chain Failure</option>
            <option value="Natural Disaster / Flood">Natural Disaster / Flood</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Severity *</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-rose-300 dark:border-rose-700 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-black"
            >
              <option value="critical">CRITICAL (Red Alert)</option>
              <option value="high">HIGH (Immediate Support)</option>
              <option value="medium">MEDIUM</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Affected Count (No PII) *</label>
            <input
              type="number"
              min="1"
              value={affectedCount}
              onChange={(e) => setAffectedCount(Math.max(1, parseInt(e.target.value) || 1))}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Situation Description *</label>
          <textarea
            rows={3}
            placeholder="Details on requirements, trauma care status, ambulance needs..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEmergencyModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="md"
            loading={isSubmitting}
            leftIcon={<Zap className="w-4 h-4 fill-current" />}
          >
            {isSubmitting ? 'TRANSMITTING…' : 'TRANSMIT RED ALERT'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
