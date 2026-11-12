interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_PREFIX = "sp_store_cache_v1:";
const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getBrowserCache<T>(key: string): T | null {
  const fullKey = `${CACHE_PREFIX}${key}`;
  const now = Date.now();

  const memEntry = memoryCache.get(fullKey) as CacheEntry<T> | undefined;
  if (memEntry) {
    if (memEntry.expiresAt > now) {
      return memEntry.value;
    }
    memoryCache.delete(fullKey);
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(fullKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed && parsed.expiresAt > now) {
      memoryCache.set(fullKey, parsed);
      return parsed.value;
    }
    window.sessionStorage.removeItem(fullKey);
  } catch {
    // Ignore storage parse or security errors
  }

  return null;
}

export function setBrowserCache<T>(key: string, value: T, ttlMs: number): void {
  const fullKey = `${CACHE_PREFIX}${key}`;
  const entry: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + ttlMs,
  };
  memoryCache.set(fullKey, entry);

  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(fullKey, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function invalidateBrowserCache(prefix: string = ""): void {
  const targetPrefix = `${CACHE_PREFIX}${prefix}`;
  for (const k of memoryCache.keys()) {
    if (k.startsWith(targetPrefix)) {
      memoryCache.delete(k);
    }
  }

  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(targetPrefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
}
