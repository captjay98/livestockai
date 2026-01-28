/**
 * Privacy fuzzing utilities for marketplace listings.
 * Applies location obfuscation based on fuzzing level.
 */

import type { FuzzingLevel } from '~/lib/db/types'
import type { ListingRecord } from './repository'

/**
 * Coordinates for location fuzzing
 */
export interface Coordinates {
  lat: number
  lon: number
}

/** Fuzzed listing with optional distance */
export type FuzzedListing = ListingRecord & { distance?: number; isOwner?: boolean }

/**
 * Fuzzing configuration by level
 */
const FUZZING_CONFIG: Record<FuzzingLevel, { radiusKm: number; precision: number }> = {
  low: { radiusKm: 1, precision: 4 }, // ~100m accuracy
  medium: { radiusKm: 5, precision: 3 }, // ~1km accuracy
  high: { radiusKm: 20, precision: 2 }, // ~10km accuracy
}

/**
 * Apply random offset to coordinates within specified radius
 *
 * @param lat - Original latitude
 * @param lon - Original longitude
 * @param radiusKm - Maximum offset radius in kilometers
 * @returns Fuzzed coordinates
 */
function applyLocationOffset(lat: number, lon: number, radiusKm: number): Coordinates {
  // Convert radius to degrees (rough approximation)
  const radiusDegrees = radiusKm / 111

  // Generate random angle and distance
  const angle = Math.random() * 2 * Math.PI
  const distance = Math.random() * radiusDegrees

  // Apply offset
  const deltaLat = distance * Math.cos(angle)
  const deltaLon = distance * Math.sin(angle) / Math.cos(lat * (Math.PI / 180))

  return {
    lat: lat + deltaLat,
    lon: lon + deltaLon,
  }
}

/**
 * Round coordinates to specified precision
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @param precision - Number of decimal places
 * @returns Rounded coordinates
 */
function roundCoordinates(lat: number, lon: number, precision: number): Coordinates {
  const factor = Math.pow(10, precision)
  return {
    lat: Math.round(lat * factor) / factor,
    lon: Math.round(lon * factor) / factor,
  }
}

/**
 * Apply privacy fuzzing to a listing
 *
 * @param listing - Original listing record
 * @param sellerId - ID of the seller (null for anonymous viewing)
 * @param viewerLocation - Optional viewer location for distance calculation
 * @returns Fuzzed listing with privacy protection applied
 */
export function fuzzListing(
  listing: ListingRecord,
  sellerId: string | null,
  viewerLocation?: Coordinates,
): ListingRecord & { distance?: number } {
  // If viewer is the seller, return original data
  if (sellerId === listing.sellerId) {
    return listing
  }

  const config = FUZZING_CONFIG[listing.fuzzingLevel]
  const originalLat = parseFloat(listing.latitude)
  const originalLon = parseFloat(listing.longitude)

  // Apply location fuzzing
  const offset = applyLocationOffset(originalLat, originalLon, config.radiusKm)
  const fuzzed = roundCoordinates(offset.lat, offset.lon, config.precision)

  // Calculate distance if viewer location provided
  let distance: number | undefined
  if (viewerLocation) {
    const R = 6371 // Earth's radius in km
    const dLat = (fuzzed.lat - viewerLocation.lat) * (Math.PI / 180)
    const dLon = (fuzzed.lon - viewerLocation.lon) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(viewerLocation.lat * (Math.PI / 180)) *
        Math.cos(fuzzed.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    distance = Math.round(R * c * 10) / 10 // Round to 1 decimal place
  }

  return {
    ...listing,
    latitude: fuzzed.lat.toString(),
    longitude: fuzzed.lon.toString(),
    // Generalize address based on fuzzing level
    formattedAddress: listing.fuzzingLevel === 'high' 
      ? `${listing.region}, ${listing.country}`
      : listing.fuzzingLevel === 'medium'
      ? `${listing.locality}, ${listing.region}`
      : listing.formattedAddress,
    distance,
  }
}

/**
 * Get fuzzing level description for UI
 *
 * @param level - Fuzzing level
 * @returns Human-readable description
 */
export function getFuzzingDescription(level: FuzzingLevel): string {
  switch (level) {
    case 'low':
      return 'Precise location (~100m accuracy)'
    case 'medium':
      return 'General area (~1km accuracy)'
    case 'high':
      return 'Regional location (~10km accuracy)'
  }
}

/**
 * Fuzz quantity based on fuzzing level
 * Returns a range string instead of exact number
 */
export function fuzzQuantity(quantity: number, level: FuzzingLevel): string {
  if (level === 'low') {
    // Show exact quantity
    return quantity.toString()
  }
  
  // Round to nearest bucket
  const buckets = level === 'medium' 
    ? [5, 10, 25, 50, 100, 250, 500, 1000]
    : [10, 50, 100, 500, 1000, 5000]
  
  for (let i = 0; i < buckets.length; i++) {
    if (quantity <= buckets[i]) {
      const lower = i === 0 ? 1 : buckets[i - 1] + 1
      return `${lower}-${buckets[i]}`
    }
  }
  return `${buckets[buckets.length - 1]}+`
}

/**
 * Fuzz price range based on fuzzing level
 * Returns a rounded range string
 */
export function fuzzPrice(minPrice: number, maxPrice: number, currencySymbol: string): string {
  const roundTo = (n: number, precision: number) => {
    const factor = Math.pow(10, precision)
    return Math.round(n / factor) * factor
  }
  
  // Round to nearest 100 for display
  const roundedMin = roundTo(minPrice, 2)
  const roundedMax = roundTo(maxPrice, 2)
  
  if (roundedMin === roundedMax) {
    return `${currencySymbol}${roundedMin.toLocaleString()}`
  }
  return `${currencySymbol}${roundedMin.toLocaleString()} - ${currencySymbol}${roundedMax.toLocaleString()}`
}

/**
 * Fuzz location to general area
 * Returns generalized location string based on level
 */
export function fuzzLocation(
  location: { locality: string; region: string; country: string },
  level: FuzzingLevel
): string {
  switch (level) {
    case 'low':
      return `${location.locality}, ${location.region}`
    case 'medium':
      return `${location.region}, ${location.country}`
    case 'high':
      return location.country
  }
}