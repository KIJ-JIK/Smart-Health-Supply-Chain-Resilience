import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  SendHorizontal,
} from 'lucide-react';
import { useMutationQueue, generateUUID } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export const AutoDraftModal: React.FC = () => {
  const {
    isAutoDraftModalOpen,
    setAutoDraftModalOpen,
    selectedDraftData,
    addToast,
  } = useUIStore();

  const { enqueue } = useMutationQueue();

  const [quantity, setQuantity] = useState<number>(100);
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'critical'>('urgent');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedDraftData) {
      setQuantity(selectedDraftData.suggested_qty || 100);
      setPriority(selectedDraftData.priority || 'urgent');
      setNotes(
        `Auto-drafted due to ${selectedDraftData.reason || 'consumption velocity risk'}. Current Stock: ${
          selectedDraftData.current_stock || 0
        } units.`
      );
    }
  }, [selectedDraftData]);

  if (!selectedDraftData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await enqueue('resource_request', {
        id: generateUUID(),
        request_type: 'medicine',
        item_ref: selectedDraftData.medicine_id,
        item_name: selectedDraftData.medicine_name,
        quantity: Number(quantity),
        priority,
        reason: 'auto_draft',
        source: 'auto_draft',
        status: 'pending',
        notes: notes.trim(),
      });

      addToast(
        `Requirement for ${selectedDraftData.medicine_name} (${quantity} units) submitted!`,
        'success'
      );
      setAutoDraftModalOpen(false);
    } catch (err) {
      addToast('Failed to submit requirement draft', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isAutoDraftModalOpen}
      onClose={() => setAutoDraftModalOpen(false)}
      title="Review Auto-Drafted Requirement Request"
      subtitle="AI Recommends. Authorized Human Decides (Human-in-the-Loop Principle)."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-200 dark:border-primary-900 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-primary-900 dark:text-primary-300 font-bold">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>Algorithm Recommended Requisition</span>
          </div>
          <p className="text-primary-800 dark:text-primary-400 text-[11px]">
            Calculated as: <code className="font-mono font-bold">Consumption Velocity (30d) + Safety Buffer (15%) − Remaining Stock</code>
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#0d1929]/70 rounded-xl border border-slate-200 dark:border-[#1e2d3d] text-xs space-y-1">
          <div className="text-slate-500 dark:text-slate-400">Medicine Target:</div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedDraftData.medicine_name}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Current Stock: <span className="font-bold text-rose-600 dark:text-rose-400">{selectedDraftData.current_stock} Units</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recommended Quantity (Editable) *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority *</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Justification</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-[#1e2d3d] flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAutoDraftModalOpen(false)}
          >
            Cancel Draft
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            leftIcon={<SendHorizontal className="w-3.5 h-3.5" />}
          >
            Approve & Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};
