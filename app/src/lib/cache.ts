// Simple in-memory cache for frequently accessed data
// Suitable for single-server VPS deployments

interface CacheEntry<T> {
  data: T
  expiry: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTTL = 60 * 1000 // 1 minute default

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs ?? this.defaultTTL)
    this.cache.set(key, { data, expiry })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  // Delete all keys matching a pattern
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  // Cleanup expired entries (call periodically)
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
const globalForCache = globalThis as unknown as {
  cache: SimpleCache | undefined
}

export const cache = globalForCache.cache ?? new SimpleCache()

if (process.env.NODE_ENV !== "production") {
  globalForCache.cache = cache
}

// Cache keys constants
export const CACHE_KEYS = {
  SETTINGS: "settings",
  LOCATIONS: "locations",
  VEHICLE_LIST: "vehicles:list",
  DASHBOARD_STATS: "dashboard:stats",
} as const

// TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
} as const

export default cache
