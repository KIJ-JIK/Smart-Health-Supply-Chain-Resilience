import React, { useState, useEffect } from 'react';
import {
  SendHorizontal,
  Plus,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  Clock,
  ShieldCheck,
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
import { getCurrentPhcId } from '../../db/seedData';
import { PhcBackendService } from '../../services/phcBackendService';

export const RequestsView: React.FC = () => {
  const { currentStaff, selectedFacility } = usePhcAuthStore();
  const currentPhcId = selectedFacility?.id || currentStaff?.facilityId || getCurrentPhcId();
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
  const [isReceivingId, setIsReceivingId] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<string>('all');

  // Real-time live background polling from Railway backend to sync request status changes immediately
  useEffect(() => {
    let isMounted = true;
    const pollBackendRequests = async () => {
      try {
        const backendUrl = PhcBackendService.getBaseUrl();
        const res = await fetch(`${backendUrl}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetPhcRequests($scope: ScopeInput) {
                resourceRequests(scope: $scope) {
                  id
                  phcId
                  requestType
                  itemRef
                  itemName
                  quantity
                  priority
                  reason
                  source
                  status
                  notes
                  carrier
                  trackingNumber
                  createdAt
                  decidedAt
                  decidedBy
                  dispatchedAt
                  deliveredAt
                }
              }
            `,
            variables: { scope: { level: 'PHC', phcId: currentPhcId } },
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const serverReqs = json.data?.resourceRequests || [];
          if (serverReqs.length > 0 && isMounted) {
            for (const sr of serverReqs) {
              const existing = await db.resource_requests.get(sr.id);
              await db.resource_requests.put({
                ...(existing || {}),
                id: sr.id,
                phc_id: sr.phcId || currentPhcId,
                request_type: sr.requestType || 'medicine',
                item_ref: sr.itemRef,
                item_name: sr.itemName,
                quantity: sr.quantity,
                priority: sr.priority,
                reason: sr.reason,
                source: sr.source,
                status: sr.status,
                notes: sr.notes,
                carrier: sr.carrier,
                tracking_number: sr.trackingNumber,
                created_at: sr.createdAt,
                decided_at: sr.decidedAt,
                decided_by: sr.decidedBy,
                dispatched_at: sr.dispatchedAt,
                delivered_at: sr.deliveredAt,
              });
            }
          }
        }
      } catch (_) {}
    };

    pollBackendRequests();
    const interval = setInterval(pollBackendRequests, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentPhcId]);

  const handleConfirmReceipt = async (req: ResourceRequest) => {
    setIsReceivingId(req.id);
    try {
      const now = new Date().toISOString();

      // 1. Update local Dexie status
      await db.resource_requests.update(req.id, {
        status: 'delivered',
        delivered_at: now,
      });

      // 2. Add stock to inventory_batches if medicine
      if (req.request_type === 'medicine' && req.item_ref) {
        await db.inventory_batches.add({
          id: generateUUID(),
          phc_id: currentPhcId,
          medicine_id: req.item_ref,
          batch_no: `BATCH-TRANSFER-${Date.now().toString().slice(-4)}`,
          received_qty: Number(req.quantity),
          remaining_qty: Number(req.quantity),
          expiry_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
          received_at: now,
          status: 'active',
          created_at: now,
          updated_at: now,
        });
      }

      // 3. Enqueue mutation
      await enqueue('request_delivered', {
        requestId: req.id,
        phcId: currentPhcId,
        deliveredAt: now,
        notes: 'Delivery received and verified by facility pharmacist',
      });

      // 4. Directly notify backend GraphQL
      try {
        const backendUrl = PhcBackendService.getBaseUrl();
        await fetch(`${backendUrl}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `mutation DeliverReq($id: ID!) { deliverResourceRequest(requestId: $id, notes: "Goods verified & received at PHC") { id status } }`,
            variables: { id: req.id },
          }),
        });
      } catch (_) {}

      addToast(`Goods receipt verified! ${req.quantity} units added to inventory.`, 'success');
    } catch (err) {
      addToast('Failed to confirm receipt', 'error');
    } finally {
      setIsReceivingId(null);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    let itemName = customItemName;
    if (reqType === 'medicine' && selectedItemRef) {
      const med = medicines.find((m) => m.id === selectedItemRef);
      if (med) itemName = med.name;
    }

    const reqId = generateUUID();
    const payload = {
      id: reqId,
      phc_id: currentPhcId,
      district_id: selectedFacility?.district_id || selectedFacility?.district || currentStaff?.district,
      state_id: selectedFacility?.state_id || selectedFacility?.state || currentStaff?.state,
      request_type: reqType,
      item_ref: selectedItemRef || undefined,
      item_name: itemName || `${reqType.toUpperCase()} Supply Request`,
      quantity: Number(quantity),
      priority,
      reason,
      source: 'manual',
      status: 'pending',
      notes: notes.trim(),
    };

    try {
      // 1. Enqueue to local Dexie IndexedDB
      const entry = await enqueue('resource_request', payload, reqId);

      // 2. Immediate direct submission to Railway Backend
      try {
        const backendUrl = PhcBackendService.getBaseUrl();
        const res = await fetch(`${backendUrl}/api/v1/phc/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          // Mark mutation as SYNCED in Dexie queue
          await db.mutation_queue.update(entry.id, {
            sync_status: 'synced',
            last_error: null,
          });
        }
      } catch (networkErr) {
        console.warn('Direct backend push offline, queued for background sync engine:', networkErr);
      }

      addToast('Supply request broadcast to National & District Command Center!', 'success');
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
        {['all', 'pending', 'approved', 'dispatched', 'in_transit', 'delivered', 'rejected'].map((f) => (
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

                {/* Logistics Metadata strip */}
                {(req.carrier || req.tracking_number || (req as any).carrier || (req as any).trackingNumber) && (
                  <div className="p-3 bg-blue-50 dark:bg-[#0e2238] border border-blue-200 dark:border-blue-900/50 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold">
                      <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Carrier: {req.carrier || (req as any).carrier}</span>
                      <span className="text-blue-400 dark:text-blue-600">•</span>
                      <span>Waybill / Plate: {req.tracking_number || (req as any).trackingNumber}</span>
                    </div>
                    {req.dispatched_at && (
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Dispatched: {formatDateTime(req.dispatched_at)}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions: Confirm Delivery for PHC */}
                {(req.status === 'dispatched' || req.status === 'in_transit') && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Consignment en-route. Confirm physical goods receipt upon unloading.</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleConfirmReceipt(req)}
                      disabled={isReceivingId === req.id}
                      leftIcon={<PackageCheck className="w-3.5 h-3.5" />}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isReceivingId === req.id ? 'Updating Stock...' : 'Confirm Goods Receipt'}
                    </Button>
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
