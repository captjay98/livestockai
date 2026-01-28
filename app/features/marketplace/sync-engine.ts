/**
 * Marketplace Sync Engine
 * Leverages existing offline-writes-v1 infrastructure
 */

import { set, get, keys, del } from 'idb-keyval'

export interface PendingItem {
  id: string
  type: 'listing' | 'contact_request'
  action: 'create' | 'update' | 'delete'
  data: any
  createdAt: Date
  retryCount: number
}

export interface SyncMetadata {
  lastSyncTime: Date | null
  pendingCount: number
}

const PENDING_PREFIX = 'marketplace-pending-'
const SYNC_METADATA_KEY = 'marketplace-sync-metadata'
const MAX_RETRIES = 3
const CACHE_STALE_HOURS = 24

/**
 * Queue item for sync when online
 */
export async function queueForSync(item: PendingItem): Promise<void> {
  await set(`${PENDING_PREFIX}${item.id}`, item)
}

/**
 * Get all pending marketplace items
 */
export async function getPendingItems(): Promise<PendingItem[]> {
  const allKeys = await keys()
  const pendingKeys = allKeys.filter(key => 
    typeof key === 'string' && key.startsWith(PENDING_PREFIX)
  )
  
  const items = await Promise.all(
    pendingKeys.map(key => get(key))
  )
  
  return items.filter(Boolean)
}

/**
 * Resolve conflict using last-write-wins
 */
export function resolveConflict<T extends { updatedAt: Date }>(local: T, remote: T): T {
  return local.updatedAt > remote.updatedAt ? local : remote
}

/**
 * Check if cache is stale (>24 hours)
 */
export function isCacheStale(lastSyncTime: Date | null): boolean {
  if (!lastSyncTime) return true
  
  const hoursAgo = (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60)
  return hoursAgo > CACHE_STALE_HOURS
}

/**
 * Sync pending items with exponential backoff
 */
export async function syncPendingItems(): Promise<{ synced: number; failed: number }> {
  const pendingItems = await getPendingItems()
  let synced = 0
  let failed = 0

  for (const item of pendingItems) {
    try {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, item.retryCount) * 1000
      if (item.retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      // Attempt sync (placeholder - actual API calls would go here)
      await syncItem(item)
      
      // Remove from queue on success
      await del(`${PENDING_PREFIX}${item.id}`)
      synced++
    } catch (error) {
      if (item.retryCount < MAX_RETRIES) {
        // Increment retry count and re-queue
        await set(`${PENDING_PREFIX}${item.id}`, {
          ...item,
          retryCount: item.retryCount + 1
        })
      } else {
        // Max retries exceeded
        await del(`${PENDING_PREFIX}${item.id}`)
      }
      failed++
    }
  }

  // Update sync metadata
  await set(SYNC_METADATA_KEY, {
    lastSyncTime: new Date(),
    pendingCount: pendingItems.length - synced
  })

  return { synced, failed }
}

/**
 * Placeholder for actual API sync
 */
async function syncItem(item: PendingItem): Promise<void> {
  // TODO: Implement actual API calls based on item.type and item.action
  // This would use the existing server functions pattern
  throw new Error('Sync not implemented')
}