import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Edit2,
  Save,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useMutationQueue } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import { Equipment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/date';
import { Button } from '../../components/common/Button';

export const EquipmentView: React.FC = () => {
  const equipmentList = useLiveQuery(() => db.equipment.toArray()) || [];
  const { enqueue } = useMutationQueue();
  const { addToast } = useUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  const [eqType, setEqType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [workingQty, setWorkingQty] = useState(1);
  const [maintenanceStatus, setMaintenanceStatus] = useState<Equipment['maintenance_status']>('operational');
  const [lastServicedAt, setLastServicedAt] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');

  const openCreateModal = () => {
    setEditingItem(null);
    setEqType('');
    setQuantity(1);
    setWorkingQty(1);
    setMaintenanceStatus('operational');
    setLastServicedAt(new Date().toISOString().split('T')[0]);
    setNextServiceDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (eq: Equipment) => {
    setEditingItem(eq);
    setEqType(eq.equipment_type);
    setQuantity(eq.quantity);
    setWorkingQty(eq.working_qty);
    setMaintenanceStatus(eq.maintenance_status);
    setLastServicedAt(eq.last_serviced_at || '');
    setNextServiceDate(eq.next_service_date || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nonWorking = Math.max(0, quantity - workingQty);

    try {
      if (editingItem) {
        await enqueue('equipment_update', {
          id: editingItem.id,
          equipment_type: eqType,
          quantity: Number(quantity),
          working_qty: Number(workingQty),
          non_working_qty: nonWorking,
          maintenance_status: maintenanceStatus,
          last_serviced_at: lastServicedAt,
          next_service_date: nextServiceDate,
        });
        addToast('Equipment details updated and queued for sync!', 'success');
      } else {
        await enqueue('equipment_create', {
          equipment_type: eqType,
          quantity: Number(quantity),
          working_qty: Number(workingQty),
          non_working_qty: nonWorking,
          maintenance_status: maintenanceStatus,
          last_serviced_at: lastServicedAt,
          next_service_date: nextServiceDate,
        });
        addToast('New equipment added and queued for sync!', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      addToast('Failed to save equipment', 'error');
    }
  };

  const totalUnits = equipmentList.reduce((a, b) => a + b.quantity, 0);
  const workingUnits = equipmentList.reduce((a, b) => a + b.working_qty, 0);
  const nonWorkingUnits = totalUnits - workingUnits;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Equipment & Bio-Medical Assets</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track operational readiness, working vs non-working ratios, and service schedules
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Equipment
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Total Asset Types</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{equipmentList.length} Categories</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{totalUnits} total physical devices registered</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Operational Readiness</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{workingUnits} / {totalUnits}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {totalUnits > 0 ? Math.round((workingUnits / totalUnits) * 100) : 0}% functional uptime
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Maintenance Flags</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{nonWorkingUnits} Units</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Requiring biomedical repair or calibration</p>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-[#1e2d3d] flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Equipment Inventory & Working Ratios</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{equipmentList.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-[#0d1929] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-[#1e2d3d]">
              <tr>
                <th className="px-5 py-3">Equipment Type</th>
                <th className="px-4 py-3">Working Ratio</th>
                <th className="px-4 py-3">Maintenance Status</th>
                <th className="px-4 py-3">Last Serviced</th>
                <th className="px-4 py-3">Next Service Due</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d3d] text-slate-700 dark:text-slate-300">
              {equipmentList.map((eq) => {
                const ratioPct = eq.quantity > 0 ? Math.round((eq.working_qty / eq.quantity) * 100) : 0;
                return (
                  <tr key={eq.id} className="hover:bg-slate-50/80 dark:hover:bg-[#0d1929]/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {eq.equipment_type}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {eq.working_qty} / {eq.quantity}
                        </span>
                        <div className="w-20 bg-slate-200 dark:bg-[#1e2d3d] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              ratioPct === 100
                                ? 'bg-emerald-500'
                                : ratioPct >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${ratioPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">({ratioPct}%)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={eq.maintenance_status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {formatDate(eq.last_serviced_at)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {formatDate(eq.next_service_date)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => openEditModal(eq)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 font-semibold transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Equipment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Equipment Asset' : 'Add New Equipment'}
        subtitle="Enqueues an offline mutation to update biomedical asset records."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Equipment Type / Name</label>
            <input
              type="text"
              value={eqType}
              onChange={(e) => setEqType(e.target.value)}
              placeholder="e.g. ECG Machine 12-Channel"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Working Quantity</label>
              <input
                type="number"
                min="0"
                max={quantity}
                value={workingQty}
                onChange={(e) => setWorkingQty(Math.min(quantity, Math.max(0, parseInt(e.target.value) || 0)))}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Maintenance Status</label>
            <select
              value={maintenanceStatus}
              onChange={(e) => setMaintenanceStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100"
            >
              <option value="operational">Operational</option>
              <option value="maintenance">Under Maintenance / Calibration</option>
              <option value="broken">Broken / Out of Service</option>
              <option value="critical">Critical Breakdown</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Serviced Date</label>
              <input
                type="date"
                value={lastServicedAt}
                onChange={(e) => setLastServicedAt(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Next Service Due Date</label>
              <input
                type="date"
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#1e2d3d] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Equipment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
