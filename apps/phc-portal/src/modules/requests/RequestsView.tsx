import React, { useState } from 'react';
import {
  SendHorizontal,
  Plus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useMutationQueue, generateUUID } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import {
  ResourceRequest,
  ResourceRequestType,
  RequestPriority,
  RequestReason,
} from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDateTime } from '../../utils/date';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { usePhcAuthStore } from '../../stores/authStore';

export const RequestsView: React.FC = () => {
  const { currentStaff, selectedFacility } = usePhcAuthStore();
  const currentPhcId = selectedFacility?.id || currentStaff?.facilityId;
  const requests = useLiveQuery(
    () => db.resource_requests.filter((r) => !currentPhcId || r.phc_id === currentPhcId).reverse().sortBy('created_at'),
    [currentPhcId]
  ) || [];
  const medicines = useLiveQuery(() => db.medicines.toArray()) || [];
  const { enqueue } = useMutationQueue();
  const { addToast, isNewRequestModalOpen, setNewRequestModalOpen } = useUIStore();

  const [reqType, setReqType] = useState<ResourceRequestType>('medicine');
  const [selectedItemRef, setSelectedItemRef] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [priority, setPriority] = useState<RequestPriority>('routine');
  const [reason, setReason] = useState<RequestReason>('manual');
  const [notes, setNotes] = useState('');

  const [filterType, setFilterType] = useState<string>('all');

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    let itemName = customItemName;
    if (reqType === 'medicine' && selectedItemRef) {
      const med = medicines.find((m) => m.id === selectedItemRef);
      if (med) itemName = med.name;
    }

    try {
      await enqueue('resource_request', {
        id: generateUUID(),
        phc_id: currentPhcId,
        request_type: reqType,
        item_ref: selectedItemRef || undefined,
        item_name: itemName || `${reqType.toUpperCase()} Supply Request`,
        quantity: Number(quantity),
        priority,
        reason,
        source: 'manual',
        status: 'pending',
        notes: notes.trim(),
      });

      addToast('Supply request enqueued and routed to District CMO!', 'success');
      setNewRequestModalOpen(false);
      setCustomItemName('');
      setNotes('');
    } catch (err) {
      addToast('Failed to create supply request', 'error');
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterType === 'all') return true;
    return r.status === filterType;
  });

  const getStageIndex = (status: ResourceRequest['status']) => {
    switch (status) {
      case 'pending': return 1;
      case 'approved': return 2;
      case 'dispatched': return 3;
      case 'in_transit': return 4;
      case 'delivered': return 5;
      case 'rejected': return -1;
      default: return 1;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold shadow-sm">
              <SendHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Resource & Supply Requests</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create emergency/routine supply requisitions and track 5-stage logistics lifecycle
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setNewRequestModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Supply Request
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-[#111827] p-2.5 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm overflow-x-auto">
        {['all', 'pending', 'approved', 'in_transit', 'delivered', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filterType === f
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2d3d]'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Requests List & Lifecycle Tracker */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] p-8 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] text-center text-xs text-slate-400 dark:text-slate-500">
            No resource requests in this category.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const stage = getStageIndex(req.status);

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1e2d3d] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.item_name}</h3>
                      <StatusBadge status={req.priority} size="sm" />
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0d1929] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#1e2d3d]">
                        {req.request_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Requested: {formatDateTime(req.created_at)} • Source: {req.source} • Reason: {req.reason}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-slate-100">{req.quantity} Units Requested</div>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                </div>

                {/* 5-Stage Lifecycle Stepper */}
                {req.status === 'rejected' ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2 font-medium">
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Requisition rejected by District Authority. Reason: Quota limit or alternate depot assigned.</span>
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                      {[
                        { num: 1, label: 'Pending' },
                        { num: 2, label: 'Approved' },
                        { num: 3, label: 'Dispatched' },
                        { num: 4, label: 'In Transit' },
                        { num: 5, label: 'Delivered' },
                      ].map((s) => {
                        const isCompleted = stage >= s.num;
                        const isCurrent = stage === s.num;

                        return (
                          <div key={s.num} className="flex flex-col items-center gap-1.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 dark:bg-[#0d1929] text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-[#1e2d3d]'
                              } ${isCurrent ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-[#111827]' : ''}`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                            </div>
                            <span className={`font-semibold ${isCompleted ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {req.notes && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0d1929]/70 p-3 rounded-xl border border-slate-200 dark:border-[#1e2d3d]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Remarks:</span> {req.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Request */}
      <Modal
        isOpen={isNewRequestModalOpen}
        onClose={() => setNewRequestModalOpen(false)}
        title="Create Resource / Supply Request"
        subtitle="Enqueues request mutation to District Command Center"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Request Type *</label>
              <select
                value={reqType}
                onChange={(e) => setReqType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100"
              >
                <option value="medicine">Medicine</option>
                <option value="oxygen">Oxygen Cylinders</option>
                <option value="bed">Hospital Beds</option>
                <option value="equipment">Biomedical Equipment</option>
                <option value="staff">Staff Deployment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority Level *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical (Immediate Pipeline)</option>
              </select>
            </div>
          </div>

          {reqType === 'medicine' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Medicine *</label>
              <select
                value={selectedItemRef}
                onChange={(e) => setSelectedItemRef(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">-- Choose Medicine --</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.category})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item / Resource Name *</label>
              <input
                type="text"
                placeholder="e.g. D-Type Oxygen Cylinders / ECG Paper Rolls"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity Requested *</label>
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Trigger Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100"
              >
                <option value="manual">Manual PHC Request</option>
                <option value="threshold_breach">Stock Threshold Breach</option>
                <option value="auto_draft">Auto Consumption Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Clinical Justification / Notes</label>
            <textarea
              rows={3}
              placeholder="Provide reason for urgent requirement..."
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
              onClick={() => setNewRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<SendHorizontal className="w-3.5 h-3.5" />}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
