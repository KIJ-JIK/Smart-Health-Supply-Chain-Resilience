import { db } from './index';
import { SystemConfig } from '../types';

export function getCurrentPhcId(): string {
  if (typeof window !== 'undefined') {
    const auth = localStorage.getItem('phc-portal-auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        if (parsed?.state?.selectedFacility?.id) {
          return parsed.state.selectedFacility.id;
        }
      } catch (e) {}
    }
    const stored = localStorage.getItem('current_phc_id');
    if (stored) return stored;
  }
  return 'c0000003-0000-0000-0000-000000000001';
}

export const CURRENT_PHC_ID = 'c0000003-0000-0000-0000-000000000001';
export const CURRENT_DEVICE_ID = 'd0000001-0000-0000-0000-000000000001';

/**
 * Initializes baseline configuration parameters.
 * Real operational dataset is hydrated directly from PostgreSQL upon facility selection & login.
 */
export async function initializeDatabase() {
  const configCount = await db.system_config.count();
  if (configCount === 0) {
    const configs: SystemConfig[] = [
      { key: 'near_expiry_days', value: 45, updated_at: new Date().toISOString() },
      { key: 'oxygen_critical_threshold', value: 5, updated_at: new Date().toISOString() },
      { key: 'bed_occupancy_critical_threshold', value: 80, updated_at: new Date().toISOString() },
      { key: 'auto_sync_interval_seconds', value: 30, updated_at: new Date().toISOString() },
      { key: 'last_successful_sync_time', value: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    await db.system_config.bulkPut(configs);
  }
}
