import type { Generated } from 'kysely'

// ============================================
// Offline Marketplace Tables
// ============================================

/** Livestock type for marketplace listings */
export type MarketplaceLivestockType =
  | 'poultry'
  | 'fish'
  | 'cattle'
  | 'goats'
  | 'sheep'
  | 'bees'

/** Privacy fuzzing level for listings */
export type FuzzingLevel = 'low' | 'medium' | 'high'

/** Listing status */
export type ListingStatus = 'active' | 'paused' | 'sold' | 'expired'

/** Contact request status */
export type ContactRequestStatus = 'pending' | 'approved' | 'denied'

/**
 * Marketplace listings for livestock sales
 */
export interface MarketplaceListingTable {
  id: Generated<string>
  sellerId: string
  // Livestock info
  livestockType: MarketplaceLivestockType
  species: string
  quantity: number
  minPrice: string // DECIMAL(19,2)
  maxPrice: string // DECIMAL(19,2)
  currency: string
  // Location (exact, fuzzing applied at display time)
  latitude: string // DECIMAL(10,8)
  longitude: string // DECIMAL(11,8)
  country: string
  region: string
  locality: string
  formattedAddress: string
  // Content
  description: string | null
  photoUrls: Array<string> | null
  // Settings
  fuzzingLevel: FuzzingLevel
  contactPreference: 'app' | 'phone' | 'both'
  // Batch link (optional) - NULL if linked batch was deleted
  batchId: string | null
  // Status and expiration
  status: ListingStatus
  expiresAt: Date
  // Analytics
  viewCount: Generated<number>
  contactCount: Generated<number>
  // Timestamps
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  deletedAt: Date | null
}

/**
 * Contact requests from buyers to sellers
 */
export interface ListingContactRequestTable {
  id: Generated<string>
  listingId: string
  buyerId: string
  // Request details
  message: string
  contactMethod: 'app' | 'phone' | 'email'
  phoneNumber: string | null
  email: string | null
  // Response
  status: ContactRequestStatus
  responseMessage: string | null
  respondedAt: Date | null
  // Timestamps
  createdAt: Generated<Date>
}

/**
 * Listing view tracking for analytics
 */
export interface ListingViewTable {
  id: Generated<string>
  listingId: string
  viewerId: string | null
  viewerIp: string | null
  viewedAt: Generated<Date>
}
