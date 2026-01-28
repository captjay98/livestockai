import { del, get, set } from 'idb-keyval'
import type { FuzzedListing } from './privacy-fuzzer'
import type { ListingFilters } from './repository'

const CACHE_KEY = 'marketplace-listings-cache'
const SYNC_KEY = 'marketplace-last-sync'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function getCachedListings(filters?: ListingFilters): Promise<Array<FuzzedListing>> {
  const cached = await get(CACHE_KEY)
  if (!cached) return []
  
  let listings = cached as Array<FuzzedListing>
  
  if (filters) {
    if (filters.livestockType) {
      listings = listings.filter(l => l.livestockType === filters.livestockType)
    }
    if (filters.minPrice !== undefined) {
      const minPriceNum = parseFloat(filters.minPrice)
      listings = listings.filter(l => parseFloat(l.minPrice) >= minPriceNum)
    }
    if (filters.maxPrice !== undefined) {
      const maxPriceNum = parseFloat(filters.maxPrice)
      listings = listings.filter(l => parseFloat(l.maxPrice) <= maxPriceNum)
    }
    if (filters.region) {
      listings = listings.filter(l => l.region.includes(filters.region!))
    }
  }
  
  return listings
}

export async function updateListingCache(listings: Array<FuzzedListing>): Promise<void> {
  await set(CACHE_KEY, listings)
  await setLastSyncTime(new Date())
}

export async function getLastSyncTime(): Promise<Date | null> {
  const timestamp = await get(SYNC_KEY)
  return timestamp ? new Date(timestamp) : null
}

export async function setLastSyncTime(time: Date): Promise<void> {
  await set(SYNC_KEY, time.toISOString())
}

export async function clearStaleCache(): Promise<void> {
  const lastSync = await getLastSyncTime()
  if (lastSync && Date.now() - lastSync.getTime() > CACHE_DURATION) {
    await del(CACHE_KEY)
    await del(SYNC_KEY)
  }
}