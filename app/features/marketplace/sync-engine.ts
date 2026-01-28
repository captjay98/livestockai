/**
 * Marketplace Sync Engine
 * Leverages existing offline-writes-v1 infrastructure
 */

import { del, get, keys, set } from 'idb-keyval'

/** Data shape for creating a listing (matches createListingSchema) */
export interface CreateListingData {
  livestockType: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
  species: string
  quantity: number
  minPrice: number
  maxPrice: number
  currency?: string
  location: {
    latitude: number
    longitude: number
    country: string
    region: string
    locality: string
    formattedAddress: string
  }
  description?: string
  photoUrls?: Array<string>
  fuzzingLevel?: 'low' | 'medium' | 'high'
  contactPreference?: 'app' | 'phone' | 'both'
  batchId?: string
}

/** Data shape for updating a listing */
export interface UpdateListingData {
  listingId: string
  status?: 'active' | 'paused' | 'sold'
  quantity?: number
  minPrice?: number
  maxPrice?: number
  description?: string
}

/** Data shape for deleting a listing */
export interface DeleteListingData {
  listingId: string
}

/** Data shape for creating a contact request */
export interface CreateContactRequestData {
  listingId: string
  message: string
  contactMethod: 'app' | 'phone' | 'email'
  phoneNumber?: string
  email?: string
}

export interface PendingItem {
  id: string
  type: 'listing' | 'contact_request'
  action: 'create' | 'update' | 'delete'
  data: CreateListingData | UpdateListingData | DeleteListingData | CreateContactRequestData
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
export async function getPendingItems(): Promise<Array<PendingItem>> {
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
 * Sync item with server using dynamic imports
 */
function syncItem(item: PendingItem): Promise<void> {
  switch (item.type) {
    case 'listing':
      return syncListingItem(item)
    case 'contact_request':
      return syncContactRequestItem(item)
    default:
      throw new Error(`Unknown sync item type: ${item.type}`)
  }
}

async function syncListingItem(item: PendingItem): Promise<void> {
  const { createListingFn, updateListingFn, deleteListingFn } = await import('./server')
  
  switch (item.action) {
    case 'create':
      await createListingFn({ data: item.data as CreateListingData })
      break
    case 'update':
      await updateListingFn({ data: item.data as UpdateListingData })
      break
    case 'delete':
      await deleteListingFn({ data: item.data as DeleteListingData })
      break
    default:
      throw new Error(`Unknown listing action: ${item.action}`)
  }
}

async function syncContactRequestItem(item: PendingItem): Promise<void> {
  const { createContactRequestFn } = await import('./server')
  
  switch (item.action) {
    case 'create':
      await createContactRequestFn({ data: item.data as CreateContactRequestData })
      break
    default:
      throw new Error(`Unknown contact request action: ${item.action}`)
  }
}