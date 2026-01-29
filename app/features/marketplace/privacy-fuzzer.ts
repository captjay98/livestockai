/**
 * Privacy fuzzing service for marketplace listings.
 * Pure functions for protecting seller privacy while maintaining utility.
 */

import type { FuzzingLevel } from '~/lib/db/types'
import type { ListingRecord } from './repository'

export interface FuzzedListing {
  id: string
  sellerId: string
  livestockType: string
  species: string
  quantity: number
  priceRange: string // Fuzzed price like '₦4,500-5,500/unit'
  location: string // Fuzzed location based on privacy level
  description: string | null
  photoUrls: Array<string> | null
  contactPreference: 'app' | 'phone' | 'both'
  status: string
  viewCount: number
  createdAt: Date
}

/**
 * Fuzz exact quantity into privacy-preserving ranges
 */
export function fuzzQuantity(exactQuantity: number): string {
  if (exactQuantity <= 10) return '1-10'
  if (exactQuantity <= 25) return '10-25'
  if (exactQuantity <= 50) return '25-50'
  if (exactQuantity <= 100) return '50-100'
  if (exactQuantity <= 250) return '100-250'
  if (exactQuantity <= 500) return '250-500'
  return '500+'
}

/**
 * Fuzz price range with buffer and formatting
 */
export function fuzzPrice(
  minPrice: number,
  maxPrice: number,
  currencySymbol: string,
): string {
  // Add ~10% buffer and round to significant figures
  const buffer = 0.1
  const fuzzedMin = Math.round((minPrice * (1 - buffer)) / 100) * 100
  const fuzzedMax = Math.round((maxPrice * (1 + buffer)) / 100) * 100

  return `${currencySymbol}${fuzzedMin.toLocaleString()}-${fuzzedMax.toLocaleString()}/unit`
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Fuzz location based on privacy level
 */
export function fuzzLocation(
  location: { locality: string; region: string; country: string },
  level: FuzzingLevel,
  viewerLocation?: { lat: number; lon: number },
  listingLocation?: { lat: number; lon: number },
): string {
  switch (level) {
    case 'low':
      return `${location.locality}, ${location.region}`
    case 'medium':
      return location.region
    case 'high':
      if (viewerLocation && listingLocation) {
        const distance = calculateDistance(
          viewerLocation.lat,
          viewerLocation.lon,
          listingLocation.lat,
          listingLocation.lon,
        )
        return `~${Math.round(distance)}km away`
      }
      return 'Location hidden'
  }
}

/**
 * Apply privacy fuzzing to a marketplace listing
 */
export function fuzzListing(
  listing: ListingRecord,
  viewerId: string | null,
  viewerLocation?: { lat: number; lon: number },
  currencySymbol = '₦',
): FuzzedListing {
  // No fuzzing for the seller viewing their own listing
  if (viewerId === listing.sellerId) {
    return {
      id: listing.id,
      sellerId: listing.sellerId,
      livestockType: listing.livestockType,
      species: listing.species,
      quantity: Number(listing.quantity) || 0,
      priceRange: `${currencySymbol}${Number(listing.minPrice).toLocaleString()}-${Number(listing.maxPrice).toLocaleString()}/unit`,
      location: `${listing.locality}, ${listing.region}`,
      description: listing.description,
      photoUrls: listing.photoUrls,
      contactPreference: listing.contactPreference,
      status: listing.status,
      viewCount: listing.viewCount,
      createdAt: listing.createdAt,
    }
  }

  // Apply fuzzing for other viewers
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    livestockType: listing.livestockType,
    species: listing.species,
    quantity: listing.quantity,
    priceRange: fuzzPrice(
      Number(listing.minPrice),
      Number(listing.maxPrice),
      currencySymbol,
    ),
    location: fuzzLocation(
      {
        locality: listing.locality,
        region: listing.region,
        country: listing.country,
      },
      listing.fuzzingLevel,
      viewerLocation,
      {
        lat: Number(listing.latitude),
        lon: Number(listing.longitude),
      },
    ),
    description: listing.description,
    photoUrls: listing.photoUrls,
    contactPreference: listing.contactPreference,
    status: listing.status,
    viewCount: listing.viewCount,
    createdAt: listing.createdAt,
  }
}
