import { InventoryBatch } from '../types';
import { getDaysUntil } from './date';

export interface BatchAllocation {
  batch: InventoryBatch;
  allocatedQty: number;
}

export interface FEFOAllocationResult {
  success: boolean;
  allocations: BatchAllocation[];
  allocatedTotal: number;
  remainingRequested: number;
  totalAvailable: number;
  shortage: number;
}

/**
 * Perform First-Expiry-First-Out (FEFO) allocation against batches
 */
export function calculateFEFOAllocation(
  batches: InventoryBatch[],
  quantityRequested: number
): FEFOAllocationResult {
  // 1. Filter out expired or zero-stock batches and sort by earliest expiry date
  const validBatches = batches
    .filter((b) => b.remaining_qty > 0 && getDaysUntil(b.expiry_date) > 0)
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

  const totalAvailable = validBatches.reduce((acc, b) => acc + b.remaining_qty, 0);

  let remainingToFulfill = quantityRequested;
  const allocations: BatchAllocation[] = [];

  for (const batch of validBatches) {
    if (remainingToFulfill <= 0) break;

    const take = Math.min(batch.remaining_qty, remainingToFulfill);
    allocations.push({
      batch,
      allocatedQty: take,
    });
    remainingToFulfill -= take;
  }

  const allocatedTotal = quantityRequested - remainingToFulfill;

  return {
    success: remainingToFulfill === 0,
    allocations,
    allocatedTotal,
    remainingRequested: remainingToFulfill,
    totalAvailable,
    shortage: remainingToFulfill > 0 ? remainingToFulfill : 0,
  };
}

export type MedicineStockStatus =
  | 'NORMAL'
  | 'WARNING'
  | 'CRITICAL'
  | 'EXPIRED'
  | 'NEAR_EXPIRY';

/**
 * Determine medicine stock status based on thresholds and nearest expiry
 */
export function getMedicineStockStatus(
  currentQty: number,
  minThreshold: number,
  criticalThreshold: number,
  nearestExpiryDays?: number,
  nearExpiryConfigDays = 45
): MedicineStockStatus {
  if (nearestExpiryDays !== undefined && nearestExpiryDays <= 0) {
    return 'EXPIRED';
  }
  if (currentQty <= criticalThreshold) {
    return 'CRITICAL';
  }
  if (nearestExpiryDays !== undefined && nearestExpiryDays <= nearExpiryConfigDays) {
    return 'NEAR_EXPIRY';
  }
  if (currentQty <= minThreshold) {
    return 'WARNING';
  }
  return 'NORMAL';
}
