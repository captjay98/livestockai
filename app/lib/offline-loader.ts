/**
 * Offline-aware loader utilities for TanStack Router
 *
 * These utilities wrap server function calls to handle offline scenarios gracefully.
 * When offline, they return cached data from IndexedDB instead of failing.
 */

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Check if we're in a browser environment and offline
 */
export function isOffline(): boolean {
  return isBrowser() && !navigator.onLine
}

/**
 * Cache key prefix for loader data
 */
const LOADER_CACHE_PREFIX = 'livestockai-loader-'

/**
 * Create a cache key for a loader
 */
function getCacheKey(
  loaderName: string,
  params?: Record<string, unknown>,
): string {
  const base = `${LOADER_CACHE_PREFIX}${loaderName}`
  if (!params || Object.keys(params).length === 0) {
    return base
  }
  // Create a stable key from params
  const paramStr = JSON.stringify(params, Object.keys(params).sort())
  return `${base}-${paramStr}`
}

/**
 * Safe wrapper for IndexedDB get - only runs in browser
 */
async function safeGet<T>(key: string): Promise<T | undefined> {
  if (!isBrowser()) return undefined
  try {
    const { get } = await import('idb-keyval')
    return await get(key)
  } catch {
    return undefined
  }
}

/**
 * Safe wrapper for IndexedDB set - only runs in browser
 */
async function safeSet<T>(key: string, value: T): Promise<void> {
  if (!isBrowser()) return
  try {
    const { set } = await import('idb-keyval')
    await set(key, value)
  } catch (e) {
    console.warn(`[OfflineLoader] Failed to cache:`, e)
  }
}

/**
 * Wrapper for route loaders that handles offline scenarios
 *
 * @param loaderName - Unique name for this loader (used for caching)
 * @param serverFn - The server function to call
 * @param params - Optional parameters to pass to the server function
 * @param defaultValue - Value to return if offline and no cache exists
 *
 * @example
 * ```typescript
 * // In your route file
 * loader: async () => {
 *   return offlineLoader('dashboard', getDashboardDataFn, {}, {
 *     stats: { inventory: { activeBatches: 0 } },
 *     hasFarms: false,
 *     farms: [],
 *   })
 * }
 * ```
 */
export async function offlineLoader<T>(
  loaderName: string,
  serverFn: (args: { data: Record<string, unknown> }) => Promise<T>,
  params: Record<string, unknown> = {},
  defaultValue: T,
): Promise<T> {
  const cacheKey = getCacheKey(loaderName, params)

  // If offline, try to return cached data
  if (isOffline()) {
    const cached = await safeGet<T>(cacheKey)
    if (cached) {
      console.log(`[OfflineLoader] Using cached data for ${loaderName}`)
      return cached
    }
    console.log(`[OfflineLoader] No cache for ${loaderName}, using default`)
    return defaultValue
  }

  // Online: fetch from server and cache the result
  try {
    const data = await serverFn({ data: params })

    // Cache the successful response (fire and forget)
    safeSet(cacheKey, data)

    return data
  } catch (error) {
    // If fetch fails (e.g., network error), try cache as fallback
    console.warn(`[OfflineLoader] Server call failed for ${loaderName}:`, error)

    const cached = await safeGet<T>(cacheKey)
    if (cached) {
      console.log(`[OfflineLoader] Using cached fallback for ${loaderName}`)
      return cached
    }

    // No cache available, throw original error
    throw error
  }
}

/**
 * Simple version for loaders that don't need params
 */
export async function offlineLoaderSimple<T>(
  loaderName: string,
  serverFn: () => Promise<T>,
  defaultValue: T,
): Promise<T> {
  const cacheKey = getCacheKey(loaderName)

  if (isOffline()) {
    const cached = await safeGet<T>(cacheKey)
    if (cached) {
      console.log(`[OfflineLoader] Using cached data for ${loaderName}`)
      return cached
    }
    console.log(`[OfflineLoader] No cache for ${loaderName}, using default`)
    return defaultValue
  }

  try {
    const data = await serverFn()

    // Cache the successful response (fire and forget)
    safeSet(cacheKey, data)

    return data
  } catch (error) {
    console.warn(`[OfflineLoader] Server call failed for ${loaderName}:`, error)

    const cached = await safeGet<T>(cacheKey)
    if (cached) {
      console.log(`[OfflineLoader] Using cached fallback for ${loaderName}`)
      return cached
    }

    throw error
  }
}
