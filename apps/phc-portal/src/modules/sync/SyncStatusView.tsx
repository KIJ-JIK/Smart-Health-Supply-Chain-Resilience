import React, { useState } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Clock,
  Server,
  Ban,
  Check,
} from 'lucide-react';
import { db } from '../../db';
import { useMutationQueue } from '../../hooks/useMutationQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSyncEngine } from '../../hooks/useSyncEngine';
import { useUIStore } from '../../stores/uiStore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDateTime } from '../../utils/date';
import { mockBackendServer } from '../../utils/mockBackend';
import { Button } from '../../components/common/Button';

export const SyncStatusView: React.FC = () => {
  const { isOnline, simulatedOffline, toggleSimulation } = useNetworkStatus();
  const { pendingMutations, allMutations, conflictMutations, markStatus, enqueue, clearSynced } = useMutationQueue();
  const { isSyncing, lastSuccessfulSync, triggerSync, useLiveServer, setUseLiveServer, backendUrl, setBackendUrl } = useSyncEngine(isOnline);
  const { addToast } = useUIStore();

  const [, setSelectedConflict] = useState<any | null>(null);
  const [simulateConflictActive, setSimulateConflictActive] = useState(mockBackendServer.simulateOversoldConflict);

  const toggleConflictSimulation = () => {
    mockBackendServer.simulateOversoldConflict = !simulateConflictActive;
    setSimulateConflictActive(mockBackendServer.simulateOversoldConflict);
    addToast(
      mockBackendServer.simulateOversoldConflict
        ? 'Simulation Enabled: Next billing checkout sync will trigger stock_oversold conflict!'
        : 'Conflict Simulation Disabled',
      'info'
    );
  };

  const handleConfirmPartialDispense = async (conflictEntry: any) => {
    try {
      const availQty = conflictEntry.conflict_detail?.available_qty || 1;
      const originalPayload = conflictEntry.payload;

      const adjustedPayload = {
        ...originalPayload,
        client_txn_id: conflictEntry.id + '-partial',
        items: originalPayload.items.map((i: any) => ({
          ...i,
          quantity: availQty,
        })),
        notes: `Partial fulfillment after conflict resolution. Original requested: ${conflictEntry.conflict_detail?.requested_qty}, fulfillable: ${availQty}`,
      };

      await markStatus(conflictEntry.id, 'synced', {
        last_error: 'Resolved via Partial Dispense adjustment',
      });

      await enqueue('billing_transaction', adjustedPayload);

      addToast(`Re-issued partial dispensing for ${availQty} units!`, 'success');
      setSelectedConflict(null);
    } catch (err) {
      addToast('Failed to resolve partial dispense', 'error');
    }
  };

  const handleCancelConflictLine = async (conflictEntry: any) => {
    try {
      await markStatus(conflictEntry.id, 'failed', {
        last_error: 'Line cancelled by dispensing staff due to server stockout',
      });

      const txnId = conflictEntry.payload?.client_txn_id || conflictEntry.id;
      await db.billing_transactions.update(txnId, {
        status: 'cancelled',
        sync_status: 'failed',
      });

      addToast('Conflicted dispensing transaction cancelled', 'info');
      setSelectedConflict(null);
    } catch (err) {
      addToast('Failed to cancel line', 'error');
    }
  };

  const pendingCount = pendingMutations.length;
  const conflictCount = conflictMutations.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold shadow-sm">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sync Engine & Conflict Reconciliation</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bidirectional POST /sync/push and GET /sync/pull state machine
              </p>
            </div>
          </div>
        </div>

        {/* Sync Action */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={triggerSync}
            disabled={!isOnline || isSyncing}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
          >
            {isSyncing ? 'Synchronizing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {/* Sync Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Network State</span>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} />
            <button
              onClick={toggleSimulation}
              className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline font-semibold"
            >
              Toggle
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {simulatedOffline ? 'Simulated Offline Mode Active' : 'Automatic Webhook Sync'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Pending Mutations</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{pendingCount} in Queue</div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Awaiting batch push to central server</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Conflicts Detected</span>
          <div className={`text-2xl font-bold mt-1 ${conflictCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {conflictCount} Item{conflictCount !== 1 ? 's' : ''}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Requires clinical reconciliation</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Last Successful Sync</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">
            {lastSuccessfulSync ? formatDateTime(lastSuccessfulSync) : 'Never (Offline Initial)'}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Watermark tracking active</p>
        </div>
      </div>

      {/* SECTION 1: Needs Reconciliation Panel */}
      {conflictCount > 0 && (
        <div className="bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-900 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-900/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">Needs Clinical Reconciliation</h3>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  Authoritative server state detected concurrent dispensing against oversold batch. Select an action below.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-full">
              {conflictCount} Conflicted Bill{conflictCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {conflictMutations.map((c) => {
              const detail = c.conflict_detail || {};
              const avail = detail.available_qty || 0;
              const requested = detail.requested_qty || c.payload?.items?.[0]?.quantity || 0;

              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-[#111827] rounded-xl border border-rose-200 dark:border-rose-900 p-4 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1e2d3d] pb-2.5">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Mutation ID: <span className="font-mono text-slate-600 dark:text-slate-400">{c.id}</span>
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Entity: {c.entity_type} • Local Seq: #{c.local_seq} • Logged: {formatDateTime(c.created_at)}
                      </div>
                    </div>
                    <StatusBadge status="CONFLICT" size="sm" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-[#0d1929]/70 p-3 rounded-lg border border-slate-200 dark:border-[#1e2d3d]">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block uppercase text-[10px]">Requested Locally</span>
                      <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {requested} Units requested by {c.payload?.patient_ref || 'Patient'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block uppercase text-[10px]">Server Authoritative Stock</span>
                      <div className="font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                        Only {avail} Units available (Batch oversold concurrently)
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">{detail.message}</p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1e2d3d]">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCancelConflictLine(c)}
                      leftIcon={<Ban className="w-3.5 h-3.5 text-rose-500" />}
                    >
                      Cancel This Line
                    </Button>

                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleConfirmPartialDispense(c)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Confirm Partial Dispense ({avail} units)
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Backend Sync Configuration & Simulator Controls */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2d3d] pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sync Endpoint Adapter & Simulator Settings</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">POST /sync/push • GET /sync/pull</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-[#0d1929]/70 rounded-xl border border-slate-200 dark:border-[#1e2d3d] space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Target Backend Mode</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="syncMode"
                  checked={!useLiveServer}
                  onChange={() => setUseLiveServer(false)}
                  className="text-primary-600"
                />
                <span>Simulated In-Browser Engine</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="syncMode"
                  checked={useLiveServer}
                  onChange={() => setUseLiveServer(true)}
                  className="text-primary-600"
                />
                <span>Live Backend HTTP Server</span>
              </label>
            </div>

            {useLiveServer && (
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Backend Base URL</label>
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg text-xs"
                />
              </div>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#0d1929]/70 rounded-xl border border-slate-200 dark:border-[#1e2d3d] space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Conflict Simulator</span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Inject <code className="text-rose-600 dark:text-rose-400 font-mono">STOCK_OVERSOLD</code> conflict response on next push
                </p>
              </div>
              <button
                onClick={toggleConflictSimulation}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                  simulateConflictActive
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 dark:bg-[#1e2d3d] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {simulateConflictActive ? 'Simulation ACTIVE' : 'Simulate Conflict'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Persistent Offline Mutation Queue Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-[#1e2d3d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Local Mutation Queue Ledger</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSynced}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-[#1e2d3d]"
            >
              Clear Synced
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{allMutations.length} total</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-[#0d1929] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-[#1e2d3d]">
              <tr>
                <th className="px-5 py-3.5">Seq & Idempotency Key</th>
                <th className="px-4 py-3.5">Entity Type</th>
                <th className="px-4 py-3.5">Sync Status</th>
                <th className="px-4 py-3.5">Created At</th>
                <th className="px-4 py-3.5">Payload Summary</th>
                <th className="px-4 py-3.5 text-right">Status Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d3d] text-slate-700 dark:text-slate-300">
              {allMutations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500">
                    Mutation queue is empty.
                  </td>
                </tr>
              ) : (
                allMutations.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-[#0d1929]/50 transition-colors font-mono">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">#{m.local_seq}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{m.id.substring(0, 18)}...</div>
                    </td>
                    <td className="px-4 py-3.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {m.entity_type}
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      <StatusBadge status={m.sync_status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 font-sans text-slate-600 dark:text-slate-400">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px] max-w-xs truncate">
                      {JSON.stringify(m.payload)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-sans">
                      {m.sync_status === 'conflict' ? (
                        <button
                          onClick={() => setSelectedConflict(m)}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          Reconcile Now
                        </button>
                      ) : m.last_error ? (
                        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{m.last_error}</span>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">OK</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
