import { useState, useCallback, useEffect, useRef } from 'react';
import { db } from '../db';
import { CURRENT_DEVICE_ID, getCurrentPhcId } from '../db/seedData';
import { useMutationQueue } from './useMutationQueue';
import {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
  SyncPullDelta,
} from '../types';

import { PhcBackendService } from '../services/phcBackendService';

export function useSyncEngine(isOnline: boolean) {
  const { markStatus } = useMutationQueue();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState(PhcBackendService.getBaseUrl());

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
      } else if (entity_type === 'resource_requests' || entity_type === 'request_status_change') {
        const existing = await db.resource_requests.get(payload.id || entity_id);
        await db.resource_requests.put({
          ...(existing || {}),
          ...payload,
          id: payload.id || entity_id,
        });
      } else if (entity_type === 'alerts' || entity_type === 'alert') {
        if (operation !== 'delete') {
          const alertId = payload.id || entity_id;
          await db.alerts.put({
            id: alertId,
            ...payload,
          });
        }
      } else if (entity_type === 'phc_facilities') {
        await db.phc_facilities.update(entity_id, payload);
      }
    });
  };

  /**
   * Helper to ensure an authoritative backend JWT token is active
   */
  const getAuthToken = async (currentPhc: string, forceFresh = false): Promise<string> => {
    if (!forceFresh) {
      try {
        for (const key of ['phc_auth_token', 'phc-portal-auth-v2', 'phc-portal-auth']) {
          const item = localStorage.getItem(key);
          if (!item) continue;
          if (key === 'phc_auth_token' && !item.startsWith('offline-jwt-')) {
            return item;
          }
          try {
            const parsed = JSON.parse(item);
            if (parsed?.state?.token && !parsed.state.token.startsWith('offline-jwt-')) {
              return parsed.state.token;
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    // Auto-login to obtain signed JWT from backend
    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `phc-officer-${currentPhc.slice(-6)}`,
          role: 'phc_user',
          phcId: currentPhc,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const token = data.accessToken || data.token;
        if (token) {
          try {
            localStorage.setItem('phc_auth_token', token);
          } catch (_) {}
          return token;
        }
      }
    } catch (e) {
      console.warn('[useSyncEngine] Failed to auto-acquire backend token:', e);
    }
    return '';
  };

  /**
   * Execute Push step against backend contract POST /sync/push
   */
  const executePush = async (mutations: any[]): Promise<SyncPushResponse> => {
    const currentPhc = getCurrentPhcId();
    const reqBody: SyncPushRequest = {
      device_id: CURRENT_DEVICE_ID,
      phc_id: currentPhc,
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

    let authToken = await getAuthToken(currentPhc);

    let resp = await fetch(`${backendUrl}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        'X-User-Role': 'phc_user',
        'X-PHC-ID': currentPhc,
        'X-Device-ID': CURRENT_DEVICE_ID,
      },
      body: JSON.stringify(reqBody),
    });

    // If 401 Unauthorized, refresh token and retry once
    if (resp.status === 401) {
      authToken = await getAuthToken(currentPhc, true);
      resp = await fetch(`${backendUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'X-User-Role': 'phc_user',
          'X-PHC-ID': currentPhc,
          'X-Device-ID': CURRENT_DEVICE_ID,
        },
        body: JSON.stringify(reqBody),
      });
    }

    if (!resp.ok) {
      throw new Error(`Sync Push HTTP Error: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
  };

  /**
   * Execute Pull step against backend contract GET /sync/pull
   */
  const executePull = async (sinceSeq: number): Promise<SyncPullResponse> => {
    const currentPhc = getCurrentPhcId();
    let authToken = await getAuthToken(currentPhc);

    let resp = await fetch(
      `${backendUrl}/sync/pull?since=${sinceSeq}&device_id=${CURRENT_DEVICE_ID}&limit=100`,
      {
        headers: {
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'X-User-Role': 'phc_user',
          'X-PHC-ID': currentPhc,
          'X-Device-ID': CURRENT_DEVICE_ID,
        },
      }
    );

    if (resp.status === 401) {
      authToken = await getAuthToken(currentPhc, true);
      resp = await fetch(
        `${backendUrl}/sync/pull?since=${sinceSeq}&device_id=${CURRENT_DEVICE_ID}&limit=100`,
        {
          headers: {
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            'X-User-Role': 'phc_user',
            'X-PHC-ID': currentPhc,
            'X-Device-ID': CURRENT_DEVICE_ID,
          },
        }
      );
    }

    if (!resp.ok) {
      throw new Error(`Sync Pull HTTP Error: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
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
  }, [isOnline, isSyncing, backendUrl, markStatus]);

  // Auto-sync when connectivity is regained or when any mutation is enqueued
  useEffect(() => {
    if (isOnline) {
      triggerSync();
    }

    const handleMutationEnqueued = () => {
      if (isOnline) {
        setTimeout(() => {
          triggerSync();
        }, 50);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('phc:mutation-enqueued', handleMutationEnqueued);
    }

    // Periodic heartbeat sync every 3s when online for real-time responsiveness
    const heartbeat = setInterval(() => {
      if (isOnline) {
        triggerSync();
      }
    }, 3000);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('phc:mutation-enqueued', handleMutationEnqueued);
      }
      clearInterval(heartbeat);
    };
  }, [isOnline, triggerSync]);

  return {
    isSyncing,
    lastSyncTime,
    lastSuccessfulSync,
    syncError,
    triggerSync,
    useLiveServer: true,
    setUseLiveServer: (_: boolean) => {},
    backendUrl,
    setBackendUrl,
  };
}
