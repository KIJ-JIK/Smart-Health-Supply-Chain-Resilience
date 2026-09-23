import { useState, useCallback, useEffect, useRef } from 'react';
import { db } from '../db';
import { CURRENT_DEVICE_ID, CURRENT_PHC_ID } from '../db/seedData';
import { useMutationQueue } from './useMutationQueue';
import { mockBackendServer } from '../utils/mockBackend';
import {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
  SyncPullDelta,
} from '../types';

export function useSyncEngine(isOnline: boolean) {
  const { markStatus } = useMutationQueue();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<string | null>(null);
  const [useLiveServer, setUseLiveServer] = useState(true);
  const [backendUrl, setBackendUrl] = useState(import.meta.env?.VITE_BACKEND_URL || 'http://localhost:8000');

  const backoffDelayRef = useRef(1000); // Start at 1s
  const retryTimerRef = useRef<number | null>(null);

  // Load last watermark & timestamps
  useEffect(() => {
    db.system_config.get('last_sync_watermark').then((c) => {
      if (c && typeof c.value === 'number') {
        // watermark loaded
      }
    });
    db.system_config.get('last_successful_sync_time').then((c) => {
      if (c && typeof c.value === 'string') {
        setLastSuccessfulSync(c.value);
        setLastSyncTime(c.value);
      }
    });
  }, []);

  /**
   * Apply incoming pull deltas to local Dexie IndexedDB
   */
  const applyPullDelta = async (delta: SyncPullDelta) => {
    const { entity_type, operation, entity_id, payload } = delta;

    await db.transaction('rw', [
      db.system_config,
      db.resource_requests,
      db.alerts,
      db.phc_facilities,
      db.inventory_batches,
      db.equipment,
    ], async () => {
      if (entity_type === 'system_config') {
        await db.system_config.put({
          key: payload.key || entity_id,
          value: payload.value,
          description: payload.description || '',
          updated_at: new Date().toISOString(),
        });
      } else if (entity_type === 'resource_requests') {
        if (operation === 'update' || operation === 'create') {
          await db.resource_requests.put(payload);
        }
      } else if (entity_type === 'alerts') {
        if (operation === 'create' || operation === 'update') {
          await db.alerts.put(payload);
        }
      } else if (entity_type === 'phc_facilities') {
        await db.phc_facilities.update(entity_id, payload);
      }
    });
  };

  /**
   * Execute Push step against backend contract POST /sync/push
   */
  const executePush = async (mutations: any[]): Promise<SyncPushResponse> => {
    const reqBody: SyncPushRequest = {
      device_id: CURRENT_DEVICE_ID,
      phc_id: CURRENT_PHC_ID,
      client_clock: new Date().toISOString(),
      mutations: mutations.map((m) => ({
        id: m.id,
        entity_type: m.entity_type,
        operation: 'create',
        payload: m.payload,
        local_seq: m.local_seq,
        client_timestamp: m.created_at,
      })),
    };

    if (useLiveServer) {
      const resp = await fetch(`${backendUrl}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      if (!resp.ok) {
        throw new Error(`Sync Push HTTP Error: ${resp.status} ${resp.statusText}`);
      }
      return await resp.json();
    } else {
      return await mockBackendServer.handlePush(reqBody);
    }
  };

  /**
   * Execute Pull step against backend contract GET /sync/pull
   */
  const executePull = async (sinceSeq: number): Promise<SyncPullResponse> => {
    if (useLiveServer) {
      const resp = await fetch(
        `${backendUrl}/sync/pull?since=${sinceSeq}&device_id=${CURRENT_DEVICE_ID}&limit=100`
      );
      if (!resp.ok) {
        throw new Error(`Sync Pull HTTP Error: ${resp.status} ${resp.statusText}`);
      }
      return await resp.json();
    } else {
      return await mockBackendServer.handlePull(sinceSeq, CURRENT_DEVICE_ID);
    }
  };

  /**
   * Full Push & Pull Sync Loop
   */
  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);
    const syncStartTime = new Date().toISOString();
    setLastSyncTime(syncStartTime);

    try {
      // 1. Get pending mutations (cap at 200 items per batch)
      const pending = await db.mutation_queue
        .where('sync_status')
        .anyOf(['pending', 'failed'])
        .limit(200)
        .toArray();

      // Mark in_flight
      for (const item of pending) {
        await markStatus(item.id, 'in_flight');
      }

      if (pending.length > 0) {
        const pushResponse = await executePush(pending);

        // Process mutation results
        for (const res of pushResponse.results) {
          if (res.status === 'accepted' || res.status === 'duplicate') {
            await markStatus(res.mutation_id, 'synced');
          } else if (res.status === 'conflict') {
            await markStatus(res.mutation_id, 'conflict', {
              conflict_detail: res.conflict || {
                conflict_type: 'stock_oversold',
                message: 'Concurrent deduction conflict on server.',
              },
            });
          } else if (res.status === 'rejected') {
            await markStatus(res.mutation_id, 'failed', {
              last_error: res.error_code || 'Mutation rejected by server rules',
            });
          }
        }
      }

      // 2. Pull authoritative deltas
      const watermarkConfig = await db.system_config.get('last_sync_watermark');
      let currentWatermark = (watermarkConfig?.value as number) || 0;
      let hasMore = true;

      while (hasMore) {
        const pullResponse = await executePull(currentWatermark);
        for (const delta of pullResponse.deltas) {
          await applyPullDelta(delta);
        }

        currentWatermark = pullResponse.server_seq;
        hasMore = pullResponse.has_more;

        await db.system_config.put({
          key: 'last_sync_watermark',
          value: currentWatermark,
          updated_at: new Date().toISOString(),
        });
      }

      // Record success
      const successTime = new Date().toISOString();
      setLastSuccessfulSync(successTime);
      await db.system_config.put({
        key: 'last_successful_sync_time',
        value: successTime,
        updated_at: successTime,
      });

      // Reset exponential backoff on success
      backoffDelayRef.current = 1000;
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncError(err?.message || 'Sync failed due to network error');

      // Revert in_flight mutations back to failed for retry
      const inFlight = await db.mutation_queue
        .where('sync_status')
        .equals('in_flight')
        .toArray();
      for (const item of inFlight) {
        await markStatus(item.id, 'failed', {
          last_error: err?.message || 'Sync attempt network failure',
          retry_count: (item.retry_count || 0) + 1,
        });
      }

      // Exponential backoff with jitter (capped at 5 minutes = 300,000ms)
      const jitter = Math.random() * 500;
      const nextDelay = Math.min(300000, backoffDelayRef.current * 2 + jitter);
      backoffDelayRef.current = nextDelay;

      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = window.setTimeout(() => {
        if (isOnline) {
          triggerSync();
        }
      }, nextDelay);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, useLiveServer, backendUrl, markStatus]);

  // Auto-sync when connectivity is regained
  useEffect(() => {
    if (isOnline) {
      triggerSync();
    }
  }, [isOnline]);

  return {
    isSyncing,
    lastSyncTime,
    lastSuccessfulSync,
    syncError,
    triggerSync,
    useLiveServer,
    setUseLiveServer,
    backendUrl,
    setBackendUrl,
  };
}
