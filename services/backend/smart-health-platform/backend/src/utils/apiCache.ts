/**
 * In-Memory Stale-While-Revalidate (SWR) API & Query Cache
 * Drastically cuts database load and latency for read-heavy governance and PHC dashboards.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  swrUntil: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Wraps an async database query with in-memory SWR caching.
 * @param key Cache key (e.g. 'nationalOverview', 'stateOverview:mh')
 * @param ttlMs Fresh duration in milliseconds (default: 15,000ms / 15 seconds)
 * @param fetchFn The actual database query function to call on miss or background refresh
 * @param swrMs Window during which stale data can be served while background refreshing (default: 45,000ms)
 */
export async function withCache<T>(
  key: string,
  ttlMs: number = 15_000,
  fetchFn: () => Promise<T>,
  swrMs: number = 45_000
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);

  if (hit) {
    // 1. Fresh hit: instant return (< 1ms)
    if (now < hit.expiresAt) {
      return hit.data;
    }

    // 2. Stale-While-Revalidate: return stale immediately, refresh in background
    if (now < hit.swrUntil) {
      fetchFn()
        .then((fresh) => {
          cache.set(key, {
            data: fresh,
            expiresAt: Date.now() + ttlMs,
            swrUntil: Date.now() + swrMs,
          });
        })
        .catch((err) => {
          console.warn(`[API Cache] Background refresh failed for ${key}:`, err?.message);
        });
      return hit.data;
    }
  }

  // 3. Cache miss: execute query, cache, and return
  const data = await fetchFn();
  cache.set(key, {
    data,
    expiresAt: now + ttlMs,
    swrUntil: now + swrMs,
  });
  return data;
}

/**
 * Invalidate cached items matching a prefix (e.g. 'overview', 'stateOverview') or everything.
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) {
      cache.delete(k);
    }
  }
}
