import Redis from 'ioredis';

// In-memory fallback map for test environments or when Redis is offline
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

let redisClient: Redis | null = null;

try {
  if (process.env.ENABLE_REDIS === 'true' || process.env.REDIS_URL || process.env.REDIS_HOST) {
    redisClient = process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL)
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT || 6379),
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });
    redisClient.on('error', () => {
      // Suppress connection noise in local/offline test mode
    });
  }
} catch {
  redisClient = null;
}

export class CacheService {
  static async get(key: string): Promise<string | null> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        return await redisClient.get(key);
      } catch {
        // Fall back to in-memory
      }
    }
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  static async set(key: string, value: string, ttlSeconds: number = 60): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fall back to in-memory
      }
    }
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  static async del(key: string): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.del(key);
      } catch {}
    }
    memoryCache.delete(key);
  }

  static clear(): void {
    memoryCache.clear();
  }
}
