/**
 * Pure business logic for marketplace listings.
 * All functions are side-effect-free and easily unit testable.
 */

import type { ListingStatus, MarketplaceLivestockType } from '~/lib/db/types'

/**
 * Input for creating a listing
 */
export interface CreateListingInput {
  livestockType: MarketplaceLivestockType
  species: string
  quantity: number
  minPrice: number
  maxPrice: number
  latitude: number
  longitude: number
  country: string
  region: string
  locality: string
  formattedAddress: string
  description?: string
  fuzzingLevel?: 'low' | 'medium' | 'high'
  contactPreference?: 'app' | 'phone' | 'both'
  expirationDays?: number
}

/**
 * Validate listing input - returns error message or null if valid
 */
export function validateListingInput(input: Partial<CreateListingInput>): string | null {
  if (!input.livestockType) return 'Livestock type is required'
  if (!input.species?.trim()) return 'Species is required'
  if (!input.quantity || input.quantity <= 0) return 'Quantity must be positive'
  if (input.minPrice === undefined || input.minPrice < 0) return 'Minimum price is required'
  if (input.maxPrice === undefined || input.maxPrice < 0) return 'Maximum price is required'
  if (input.minPrice > input.maxPrice) return 'Minimum price cannot exceed maximum price'
  if (input.latitude === undefined || input.latitude < -90 || input.latitude > 90) return 'Valid latitude is required'
  if (input.longitude === undefined || input.longitude < -180 || input.longitude > 180) return 'Valid longitude is required'
  if (!input.country?.trim()) return 'Country is required'
  if (!input.region?.trim()) return 'Region is required'
  if (!input.locality?.trim()) return 'Locality is required'
  return null
}

/**
 * Check if a listing is expired
 */
export function isListingExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Check if seller should be notified about expiration (3 days before)
 */
export function shouldNotifyExpiration(expiresAt: Date): boolean {
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  return expiresAt <= threeDaysFromNow && expiresAt > now
}

/**
 * Calculate expiration date for a listing
 *
 * @param startDate - Starting date
 * @param daysFromNow - Number of days from start date
 * @returns Expiration date
 */
export function calculateExpirationDate(startDate: Date, daysFromNow: number): Date {
  const expirationDate = new Date(startDate)
  expirationDate.setDate(expirationDate.getDate() + daysFromNow)
  return expirationDate
}

/**
 * Validate status transition for listings
 *
 * @param currentStatus - Current listing status
 * @param newStatus - Proposed new status
 * @returns True if transition is valid
 */
export function validateStatusTransition(
  currentStatus: ListingStatus,
  newStatus: ListingStatus,
): boolean {
  // Define valid transitions
  const validTransitions: Record<ListingStatus, Array<ListingStatus>> = {
    active: ['paused', 'sold'],
    paused: ['active', 'sold'],
    sold: [], // Cannot transition from sold
    expired: ['active'], // Can reactivate expired listings
  }

  return validTransitions[currentStatus].includes(newStatus)
}

/**
 * Calculate distance between two coordinates in kilometers
 *
 * @param lat1 - First latitude
 * @param lon1 - First longitude
 * @param lat2 - Second latitude
 * @param lon2 - Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}


/**
 * Pre-fill listing data from a batch
 * Used when creating a listing from existing inventory
 */
export interface BatchForListing {
  id: string
  livestockType: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
  species: string
  currentQuantity: number
}

export interface ListingPreFill {
  livestockType: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
  species: string
  quantity: number
  batchId: string
  suggestedMinPrice?: number
  suggestedMaxPrice?: number
}

/**
 * Generate listing pre-fill data from a batch
 *
 * @param batch - Batch to create listing from
 * @param marketPrice - Optional market price per unit for price suggestions
 * @returns Pre-filled listing data
 */
export function generateListingFromBatch(
  batch: BatchForListing,
  marketPrice?: number,
): ListingPreFill {
  const preFill: ListingPreFill = {
    livestockType: batch.livestockType,
    species: batch.species,
    quantity: batch.currentQuantity,
    batchId: batch.id,
  }

  // Add price suggestions if market price available
  if (marketPrice && marketPrice > 0) {
    // Suggest 90-110% of market price as range
    preFill.suggestedMinPrice = Math.round(marketPrice * 0.9)
    preFill.suggestedMaxPrice = Math.round(marketPrice * 1.1)
  }

  return preFill
}
