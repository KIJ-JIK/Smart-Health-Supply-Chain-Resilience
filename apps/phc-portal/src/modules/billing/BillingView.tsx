import React, { useState, useMemo } from 'react';
import {
  ReceiptText,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Sparkles,
  User,
  ShoppingBag,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useMutationQueue, generateUUID } from '../../hooks/useMutationQueue';
import { useUIStore } from '../../stores/uiStore';
import { Medicine, BillingTransaction, DispensedItem } from '../../types';
import { calculateFEFOAllocation, FEFOAllocationResult } from '../../utils/fefo';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/date';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { usePhcAuthStore } from '../../stores/authStore';

interface CartItem {
  medicine: Medicine;
  quantity: number;
  allocation: FEFOAllocationResult;
}

export const BillingView: React.FC = () => {
  const medicines = useLiveQuery(() => db.medicines.toArray()) || [];
  const batches = useLiveQuery(() => db.inventory_batches.toArray()) || [];
  const staffMembers = useLiveQuery(() => db.staff_registry.where('active').equals(1).toArray()) || [];
  const recentTransactions = useLiveQuery(() => db.billing_transactions.reverse().sortBy('client_timestamp')) || [];
  const allDispensed = useLiveQuery(() => db.dispensed_items.toArray()) || [];

  const { enqueue } = useMutationQueue();
  const { addToast } = useUIStore();
  const { currentStaff } = usePhcAuthStore();

  const [patientRef, setPatientRef] = useState('Walk-in');
  const [selectedStaffId, setSelectedStaffId] = useState(currentStaff?.id || '');

  React.useEffect(() => {
    if (!selectedStaffId && staffMembers.length > 0) {
      setSelectedStaffId(staffMembers[0].id);
    }
  }, [staffMembers, selectedStaffId]);

  const [cart, setCart] = useState<CartItem[]>([]);

  // Item Picker State
  const [selectedMedId, setSelectedMedId] = useState('');
  const [inputQty, setInputQty] = useState<number>(10);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastCompletedTxn, setLastCompletedTxn] = useState<BillingTransaction | null>(null);
  const [lastDispensedLines, setLastDispensedLines] = useState<DispensedItem[]>([]);

  // Current selected medicine & FEFO preview
  const selectedMed = medicines.find((m) => m.id === selectedMedId);
  const currentMedBatches = useMemo(() => {
    if (!selectedMedId) return [];
    return batches.filter((b) => b.medicine_id === selectedMedId);
  }, [selectedMedId, batches]);

  const fefoPreview = useMemo(() => {
    if (!selectedMedId || inputQty <= 0) return null;
    return calculateFEFOAllocation(currentMedBatches, inputQty);
  }, [selectedMedId, inputQty, currentMedBatches]);

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedMed || !fefoPreview) return;

    if (!fefoPreview.success) {
      addToast(`Insufficient stock! Available: ${fefoPreview.totalAvailable} ${selectedMed.unit}`, 'warning');
      return;
    }

    const existingIndex = cart.findIndex((c) => c.medicine.id === selectedMed.id);
    if (existingIndex >= 0) {
      const newQty = cart[existingIndex].quantity + inputQty;
      const newAlloc = calculateFEFOAllocation(currentMedBatches, newQty);
      if (!newAlloc.success) {
        addToast(`Cannot add more. Total available: ${newAlloc.totalAvailable} ${selectedMed.unit}`, 'warning');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        medicine: selectedMed,
        quantity: newQty,
        allocation: newAlloc,
      };
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          medicine: selectedMed,
          quantity: inputQty,
          allocation: fefoPreview,
        },
      ]);
    }

    setSelectedMedId('');
    setInputQty(10);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * (item.medicine.unit_price || 0), 0);
  }, [cart]);

  const handleConfirmCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty. Please select medicines to dispense.', 'warning');
      return;
    }

    const clientTxnId = generateUUID();
    const staff = staffMembers.find((s) => s.id === selectedStaffId);
    const staffName = staff ? staff.name : 'Pharmacist';

    const itemsPayload: any[] = [];
    const receiptItems: DispensedItem[] = [];

    cart.forEach((cartItem) => {
      cartItem.allocation.allocations.forEach((alloc) => {
        const line = {
          batch_id: alloc.batch.id,
          batch_no: alloc.batch.batch_no,
          medicine_id: cartItem.medicine.id,
          medicine_name: cartItem.medicine.name,
          quantity: alloc.allocatedQty,
          unit_price: cartItem.medicine.unit_price || 0,
        };
        itemsPayload.push(line);
        receiptItems.push({
          id: generateUUID(),
          billing_transaction_id: clientTxnId,
          ...line,
        });
      });
    });

    const txnPayload = {
      client_txn_id: clientTxnId,
      patient_ref: patientRef.trim() || 'Walk-in',
      dispensed_by_staff_id: selectedStaffId,
      dispensed_by_staff_name: staffName,
      total_amount: cartTotalAmount,
      items: itemsPayload,
    };

    try {
      await enqueue('billing_transaction', txnPayload, clientTxnId);

      const completedTxn: BillingTransaction = {
        id: clientTxnId,
        phc_id: 'phc-varanasi-rampur-001',
        client_txn_id: clientTxnId,
        patient_ref: txnPayload.patient_ref,
        dispensed_by_staff_id: selectedStaffId,
        dispensed_by_staff_name: staffName,
        total_amount: cartTotalAmount,
        client_timestamp: new Date().toISOString(),
        status: 'pending_sync',
        sync_status: 'pending',
      };

      setLastCompletedTxn(completedTxn);
      setLastDispensedLines(receiptItems);
      setIsReceiptModalOpen(true);

      setCart([]);
      setPatientRef('Walk-in');
      addToast('Dispensing completed & enqueued offline!', 'success');
    } catch (err) {
      addToast('Error processing dispensing transaction', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold shadow-sm">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">FEFO Billing & Dispensing Engine</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated nearest-expiry batch selection, optimistic local ledger write, and sync queue
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>FEFO Auto-Allocation Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Dispensing Desk & Medicine Selector */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Reference & Staff Selector */}
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">1. Dispensing Session Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Reference (Anonymous / OPD Slip No)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Walk-in / OPD-2026-99"
                    value={patientRef}
                    onChange={(e) => setPatientRef(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Strict privacy: No patient-identifiable personal data stored per architecture rules.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dispensing Pharmacist / Staff
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100"
                >
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Medicine Picker & FEFO Batch Allocation Preview */}
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">2. Select Medicine & Quantity</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Medicine *</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-[#0d1929] font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- Choose Medicine to Dispense --</option>
                  {medicines.map((m) => {
                    const avail = batches
                      .filter((b) => b.medicine_id === m.id)
                      .reduce((acc, b) => acc + b.remaining_qty, 0);
                    return (
                      <option key={m.id} value={m.id} disabled={avail === 0}>
                        {m.name} ({m.category}) — {avail} {m.unit} in stock
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={inputQty}
                  onChange={(e) => setInputQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-[#1e2d3d] bg-white dark:bg-[#0d1929] text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 font-bold"
                />
              </div>
            </div>

            {/* Live FEFO Auto-Selection Preview */}
            {selectedMed && fefoPreview && (
              <div className="p-4 bg-slate-50 dark:bg-[#0d1929]/70 rounded-xl border border-slate-200 dark:border-[#1e2d3d] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    Auto-Selected FEFO Batches (Nearest Expiry First):
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Total Available: {fefoPreview.totalAvailable} {selectedMed.unit}
                  </span>
                </div>

                {fefoPreview.allocations.length === 0 ? (
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    No active unexpired batches available for this medicine!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {fefoPreview.allocations.map((alloc) => (
                      <div
                        key={alloc.batch.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1e2d3d] text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{alloc.batch.batch_no}</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            (Expires: {formatDate(alloc.batch.expiry_date)})
                          </span>
                        </div>
                        <div className="font-bold text-emerald-700 dark:text-emerald-400">
                          Take {alloc.allocatedQty} {selectedMed.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={!fefoPreview.success}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add to Dispense Bill
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1/3: Active Cart & Checkout Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2d3d] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Dispense Queue</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-full">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No medicines added to bill yet. Select a medicine and click "Add to Dispense Bill".
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-[#0d1929]/70 rounded-xl border border-slate-200 dark:border-[#1e2d3d] space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.medicine.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.quantity} {item.medicine.unit} @ ₹{item.medicine.unit_price}/unit
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono pl-1 border-l-2 border-primary-400">
                      {item.allocation.allocations.map((a) => (
                        <div key={a.batch.id}>
                          • {a.batch.batch_no}: {a.allocatedQty} {item.medicine.unit}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-slate-200 dark:border-[#1e2d3d] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal Value:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">₹{cartTotalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Patient Fee (Govt PHC):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0.00 (Free)</span>
                  </div>

                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleConfirmCheckout}
                    className="w-full mt-2"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Confirm Dispensing & Issue Bill
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Dispensing History & Sync Status */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-[#1e2d3d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Dispensing Transactions</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{recentTransactions.length} recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-[#0d1929] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-[#1e2d3d]">
              <tr>
                <th className="px-5 py-3.5">Txn Time</th>
                <th className="px-4 py-3.5">Patient Ref</th>
                <th className="px-4 py-3.5">Dispensed Items</th>
                <th className="px-4 py-3.5">Dispensed By</th>
                <th className="px-4 py-3.5">Sync Status</th>
                <th className="px-4 py-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d3d] text-slate-700 dark:text-slate-300">
              {recentTransactions.map((txn) => {
                const itemsForTxn = allDispensed.filter((d) => d.billing_transaction_id === txn.id);

                return (
                  <tr key={txn.id} className="hover:bg-slate-50/80 dark:hover:bg-[#0d1929]/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                      {formatDateTime(txn.client_timestamp)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {txn.patient_ref}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        {itemsForTxn.map((i) => (
                          <div key={i.id} className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                            • {i.medicine_name || i.medicine_id}: <span className="font-bold">{i.quantity} units</span> ({i.batch_no})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {txn.dispensed_by_staff_name || 'Pharmacist'}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={txn.sync_status || 'pending'} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setLastCompletedTxn(txn);
                          setLastDispensedLines(itemsForTxn);
                          setIsReceiptModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors"
                      >
                        View Bill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable / Viewable Dispensing Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Dispensing Receipt & Medication Slip"
        subtitle="Primary Health Centre - Govt. of Uttar Pradesh"
      >
        {lastCompletedTxn && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-[#0d1929] rounded-xl border border-slate-200 dark:border-[#1e2d3d] space-y-2 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500 dark:text-slate-400">Receipt ID / Idempotency Key:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">{lastCompletedTxn.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date & Time:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDateTime(lastCompletedTxn.client_timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Patient Ref:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{lastCompletedTxn.patient_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Dispensed By:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{lastCompletedTxn.dispensed_by_staff_name}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-[#1e2d3d]">
                <span className="text-slate-500 dark:text-slate-400">Sync State:</span>
                <StatusBadge status={lastCompletedTxn.sync_status || 'pending'} size="sm" />
              </div>
            </div>

            <div className="border border-slate-200 dark:border-[#1e2d3d] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-[#0d1929] text-slate-600 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Medicine</th>
                    <th className="p-2.5">Batch</th>
                    <th className="p-2.5 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1e2d3d]">
                  {lastDispensedLines.map((line) => (
                    <tr key={line.id}>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{line.medicine_name}</td>
                      <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">{line.batch_no}</td>
                      <td className="p-2.5 text-right font-black text-slate-900 dark:text-slate-100">{line.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                ✓ Free Medication under National Health Mission
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
