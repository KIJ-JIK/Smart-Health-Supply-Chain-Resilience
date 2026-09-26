import {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
} from '../types';

/**
 * Mock backend execution has been completely eliminated in accordance with live backend requirements.
 * All mutations and pull syncs must route strictly through live backend HTTP endpoints (/sync/push and /sync/pull).
 */
export const mockBackendServer = {
  simulateOversoldConflict: false,

  async handlePush(_req: SyncPushRequest): Promise<SyncPushResponse> {
    throw new Error('Mock backend push execution has been permanently disabled. Use live backend /sync/push.');
  },

  async handlePull(_sinceSeq: number, _deviceId: string): Promise<SyncPullResponse> {
    throw new Error('Mock backend pull execution has been permanently disabled. Use live backend /sync/pull.');
  },
};
