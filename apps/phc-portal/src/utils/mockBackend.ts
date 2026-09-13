import {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
  SyncMutationResult,
  SyncPullDelta,
} from '../types';

let currentServerSeq = 100;
const processedMutationIds = new Set<string>();

// Mock server state
export const mockBackendServer = {
  // Configurable conflict simulation mode
  simulateOversoldConflict: false,

  async handlePush(req: SyncPushRequest): Promise<SyncPushResponse> {
    // Artificial latency simulation
    await new Promise((res) => setTimeout(res, 400));

    const results: SyncMutationResult[] = [];

    for (const m of req.mutations) {
      if (processedMutationIds.has(m.id)) {
        // Idempotency: duplicate submission
        results.push({
          mutation_id: m.id,
          status: 'duplicate',
          server_entity_id: m.id,
        });
        continue;
      }

      // Check if simulated conflict is enabled for billing
      if (
        this.simulateOversoldConflict &&
        m.entity_type === 'billing_transaction'
      ) {
        const reqQty = m.payload?.items?.[0]?.quantity || 10;
        const availQty = Math.max(1, Math.floor(reqQty / 2));
        results.push({
          mutation_id: m.id,
          status: 'conflict',
          error_code: 'STOCK_OVERSOLD',
          conflict: {
            conflict_type: 'stock_oversold',
            server_state: {
              medicine_id: m.payload?.items?.[0]?.medicine_id,
              batch_id: m.payload?.items?.[0]?.batch_id,
              server_remaining_qty: availQty,
            },
            message: `Concurrent checkout reduced available batch stock to ${availQty}. Requested: ${reqQty}.`,
            available_qty: availQty,
            requested_qty: reqQty,
          },
        });
        continue;
      }

      // Normal accepted
      processedMutationIds.add(m.id);
      currentServerSeq++;
      results.push({
        mutation_id: m.id,
        status: 'accepted',
        server_entity_id: m.id,
      });
    }

    return {
      server_seq: currentServerSeq,
      results,
    };
  },

  async handlePull(sinceSeq: number, deviceId: string): Promise<SyncPullResponse> {
    await new Promise((res) => setTimeout(res, 300));

    const deltas: SyncPullDelta[] = [];

    // Periodic mock server deltas if sinceSeq is behind
    if (sinceSeq < currentServerSeq) {
      // Return authoritative updates (e.g. request status updates from CMO)
      deltas.push({
        server_seq: currentServerSeq,
        entity_type: 'system_config',
        operation: 'update',
        entity_id: 'min_stock_threshold_pct',
        payload: { key: 'min_stock_threshold_pct', value: 20 },
        server_timestamp: new Date().toISOString(),
      });
    }

    return {
      server_seq: currentServerSeq,
      has_more: false,
      deltas,
    };
  },
};
