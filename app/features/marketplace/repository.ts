/**
 * Database operations for marketplace listings.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type {
  Database,
  FuzzingLevel,
  ListingStatus,
  MarketplaceLivestockType,
} from '~/lib/db/types'

/**
 * Data for inserting a new listing
 */
export interface ListingInsert {
  sellerId: string
  livestockType: MarketplaceLivestockType
  species: string
  quantity: number
  minPrice: string
  maxPrice: string
  currency: string
  latitude: string
  longitude: string
  country: string
  region: string
  locality: string
  formattedAddress: string
  description?: string | null
  photoUrls?: Array<string> | null
  fuzzingLevel: FuzzingLevel
  contactPreference: 'app' | 'phone' | 'both'
  batchId?: string | null
  status: ListingStatus
  expiresAt: Date
}

/**
 * Data for updating a listing
 */
export interface ListingUpdate {
  livestockType?: MarketplaceLivestockType
  species?: string
  quantity?: number
  minPrice?: string
  maxPrice?: string
  description?: string | null
  photoUrls?: Array<string> | null
  fuzzingLevel?: FuzzingLevel
  contactPreference?: 'app' | 'phone' | 'both'
  status?: ListingStatus
  expiresAt?: Date
}

/**
 * Filters for listing queries
 */
export interface ListingFilters {
  livestockType?: MarketplaceLivestockType
  species?: string
  minPrice?: string
  maxPrice?: string
  country?: string
  region?: string
}

/**
 * Complete listing record
 */
export interface ListingRecord {
  id: string
  sellerId: string
  livestockType: MarketplaceLivestockType
  species: string
  quantity: number
  minPrice: string
  maxPrice: string
  currency: string
  latitude: string
  longitude: string
  country: string
  region: string
  locality: string
  formattedAddress: string
  description: string | null
  photoUrls: Array<string> | null
  fuzzingLevel: FuzzingLevel
  contactPreference: 'app' | 'phone' | 'both'
  batchId: string | null
  status: ListingStatus
  expiresAt: Date
  viewCount: number
  contactCount: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

/**
 * Insert a new listing into the database
 */
export async function insertListing(
  db: Kysely<Database>,
  listing: ListingInsert,
): Promise<string> {
  const result = await db
    .insertInto('marketplace_listings')
    .values(listing)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a single listing by ID
 */
export async function getListingById(
  db: Kysely<Database>,
  listingId: string,
): Promise<ListingRecord | null> {
  const listing = await db
    .selectFrom('marketplace_listings')
    .select([
      'id',
      'sellerId',
      'livestockType',
      'species',
      'quantity',
      'minPrice',
      'maxPrice',
      'currency',
      'latitude',
      'longitude',
      'country',
      'region',
      'locality',
      'formattedAddress',
      'description',
      'photoUrls',
      'fuzzingLevel',
      'contactPreference',
      'batchId',
      'status',
      'expiresAt',
      'viewCount',
      'contactCount',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ])
    .where('id', '=', listingId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst()

  return listing as ListingRecord | null
}

/**
 * Get listings with filters and pagination
 */
export async function getListings(
  db: Kysely<Database>,
  filters: ListingFilters,
  pagination: { page: number; pageSize: number },
): Promise<{ data: Array<ListingRecord>; total: number }> {
  let query = db
    .selectFrom('marketplace_listings')
    .where('status', '=', 'active')
    .where('deletedAt', 'is', null)
    .where('expiresAt', '>', new Date())

  // Apply filters
  if (filters.livestockType) {
    query = query.where('livestockType', '=', filters.livestockType)
  }
  if (filters.species) {
    query = query.where('species', '=', filters.species)
  }
  if (filters.minPrice) {
    query = query.where('maxPrice', '>=', filters.minPrice)
  }
  if (filters.maxPrice) {
    query = query.where('minPrice', '<=', filters.maxPrice)
  }
  if (filters.country) {
    query = query.where('country', '=', filters.country)
  }
  if (filters.region) {
    query = query.where('region', '=', filters.region)
  }

  // Get total count
  const totalResult = await query
    .select((eb) => eb.fn.count('id').as('count'))
    .executeTakeFirstOrThrow()
  const total = Number(totalResult.count)

  // Get paginated data
  const data = await query
    .select([
      'id',
      'sellerId',
      'livestockType',
      'species',
      'quantity',
      'minPrice',
      'maxPrice',
      'currency',
      'latitude',
      'longitude',
      'country',
      'region',
      'locality',
      'formattedAddress',
      'description',
      'photoUrls',
      'fuzzingLevel',
      'contactPreference',
      'batchId',
      'status',
      'expiresAt',
      'viewCount',
      'contactCount',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ])
    .orderBy('createdAt', 'desc')
    .limit(pagination.pageSize)
    .offset((pagination.page - 1) * pagination.pageSize)
    .execute()

  return { data: data as Array<ListingRecord>, total }
}

/**
 * Get listings within a bounding box
 */
export async function getListingsInBoundingBox(
  db: Kysely<Database>,
  box: { minLat: number; maxLat: number; minLon: number; maxLon: number },
  filters?: ListingFilters,
): Promise<Array<ListingRecord>> {
  let query = db
    .selectFrom('marketplace_listings')
    .select([
      'id',
      'sellerId',
      'livestockType',
      'species',
      'quantity',
      'minPrice',
      'maxPrice',
      'currency',
      'latitude',
      'longitude',
      'country',
      'region',
      'locality',
      'formattedAddress',
      'description',
      'photoUrls',
      'fuzzingLevel',
      'contactPreference',
      'batchId',
      'status',
      'expiresAt',
      'viewCount',
      'contactCount',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ])
    .where('status', '=', 'active')
    .where('deletedAt', 'is', null)
    .where('expiresAt', '>', new Date())
    .where('latitude', '>=', box.minLat.toString())
    .where('latitude', '<=', box.maxLat.toString())
    .where('longitude', '>=', box.minLon.toString())
    .where('longitude', '<=', box.maxLon.toString())

  // Apply optional filters
  if (filters?.livestockType) {
    query = query.where('livestockType', '=', filters.livestockType)
  }
  if (filters?.species) {
    query = query.where('species', '=', filters.species)
  }
  if (filters?.minPrice) {
    query = query.where('maxPrice', '>=', filters.minPrice)
  }
  if (filters?.maxPrice) {
    query = query.where('minPrice', '<=', filters.maxPrice)
  }

  const listings = await query.execute()
  return listings as Array<ListingRecord>
}

/**
 * Get listings by seller
 */
export async function getListingsBySeller(
  db: Kysely<Database>,
  sellerId: string,
  status?: ListingStatus | 'all',
): Promise<Array<ListingRecord>> {
  let query = db
    .selectFrom('marketplace_listings')
    .select([
      'id',
      'sellerId',
      'livestockType',
      'species',
      'quantity',
      'minPrice',
      'maxPrice',
      'currency',
      'latitude',
      'longitude',
      'country',
      'region',
      'locality',
      'formattedAddress',
      'description',
      'photoUrls',
      'fuzzingLevel',
      'contactPreference',
      'batchId',
      'status',
      'expiresAt',
      'viewCount',
      'contactCount',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ])
    .where('sellerId', '=', sellerId)
    .where('deletedAt', 'is', null)

  if (status && status !== 'all') {
    query = query.where('status', '=', status)
  }

  const listings = await query.orderBy('createdAt', 'desc').execute()

  return listings as Array<ListingRecord>
}

/**
 * Update listing fields
 */
export async function updateListing(
  db: Kysely<Database>,
  listingId: string,
  updates: ListingUpdate,
): Promise<void> {
  await db
    .updateTable('marketplace_listings')
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where('id', '=', listingId)
    .execute()
}

/**
 * Soft delete a listing
 */
export async function softDeleteListing(
  db: Kysely<Database>,
  listingId: string,
): Promise<void> {
  await db
    .updateTable('marketplace_listings')
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where('id', '=', listingId)
    .execute()
}

/**
 * Mark expired listings as expired
 */
export async function markExpiredListings(
  db: Kysely<Database>,
): Promise<number> {
  const result = await db
    .updateTable('marketplace_listings')
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where('status', '=', 'active')
    .where('expiresAt', '<', new Date())
    .executeTakeFirst()

  return Number(result.numUpdatedRows || 0)
}

// ============================================
// Contact Request Operations
// ============================================

/**
 * Data for inserting a new contact request
 */
export interface ContactRequestInsert {
  listingId: string
  buyerId: string
  message: string
  contactMethod: 'app' | 'phone' | 'email'
  phoneNumber?: string | null
  email?: string | null
}

/**
 * Complete contact request record
 */
export interface ContactRequestRecord {
  id: string
  listingId: string
  buyerId: string
  message: string
  contactMethod: 'app' | 'phone' | 'email'
  phoneNumber: string | null
  email: string | null
  status: 'pending' | 'approved' | 'denied'
  responseMessage: string | null
  respondedAt: Date | null
  createdAt: Date
}

/**
 * Insert a new contact request
 */
export async function insertContactRequest(
  db: Kysely<Database>,
  request: ContactRequestInsert,
): Promise<string> {
  try {
    // Check if request already exists
    const existing = await db
      .selectFrom('listing_contact_requests')
      .select('id')
      .where('listingId', '=', request.listingId)
      .where('buyerId', '=', request.buyerId)
      .executeTakeFirst()

    if (existing) {
      return existing.id
    }

    // Insert the contact request
    const result = await db
      .insertInto('listing_contact_requests')
      .values({
        ...request,
        status: 'pending',
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    // Increment contact count on the listing (separate query, not transactional)
    await db
      .updateTable('marketplace_listings')
      .set((eb) => ({
        contactCount: eb('contactCount', '+', 1),
      }))
      .where('id', '=', request.listingId)
      .execute()

    return result.id
  } catch (error: any) {
    // Handle unique constraint violation (race condition)
    if (error?.code === '23505') {
      const existing = await db
        .selectFrom('listing_contact_requests')
        .select('id')
        .where('listingId', '=', request.listingId)
        .where('buyerId', '=', request.buyerId)
        .executeTakeFirst()
      if (existing) return existing.id
    }
    throw error
  }
}

/**
 * Check if contact request exists
 */
export async function hasExistingContactRequest(
  db: Kysely<Database>,
  listingId: string,
  buyerId: string,
): Promise<boolean> {
  const result = await db
    .selectFrom('listing_contact_requests')
    .select('id')
    .where('listingId', '=', listingId)
    .where('buyerId', '=', buyerId)
    .executeTakeFirst()
  return !!result
}

/**
 * Get contact request by ID
 */
export async function getContactRequestById(
  db: Kysely<Database>,
  requestId: string,
): Promise<ContactRequestRecord | null> {
  const request = await db
    .selectFrom('listing_contact_requests')
    .select([
      'id',
      'listingId',
      'buyerId',
      'message',
      'contactMethod',
      'phoneNumber',
      'email',
      'status',
      'responseMessage',
      'respondedAt',
      'createdAt',
    ])
    .where('id', '=', requestId)
    .executeTakeFirst()
  return request as ContactRequestRecord | null
}

/**
 * Get contact requests for seller
 */
export async function getContactRequestsForSeller(
  db: Kysely<Database>,
  sellerId: string,
  status?: 'pending' | 'approved' | 'denied' | 'all',
): Promise<Array<ContactRequestRecord>> {
  let query = db
    .selectFrom('listing_contact_requests')
    .innerJoin(
      'marketplace_listings',
      'marketplace_listings.id',
      'listing_contact_requests.listingId',
    )
    .selectAll('listing_contact_requests')
    .where('marketplace_listings.sellerId', '=', sellerId)

  if (status && status !== 'all') {
    query = query.where('listing_contact_requests.status', '=', status)
  }

  const requests = await query
    .orderBy('listing_contact_requests.createdAt', 'desc')
    .execute()

  return requests as Array<ContactRequestRecord>
}

/**
 * Get contact requests for buyer
 */
export async function getContactRequestsForBuyer(
  db: Kysely<Database>,
  buyerId: string,
): Promise<Array<ContactRequestRecord>> {
  const requests = await db
    .selectFrom('listing_contact_requests')
    .select([
      'id',
      'listingId',
      'buyerId',
      'message',
      'contactMethod',
      'phoneNumber',
      'email',
      'status',
      'responseMessage',
      'respondedAt',
      'createdAt',
    ])
    .where('buyerId', '=', buyerId)
    .orderBy('createdAt', 'desc')
    .execute()

  return requests as Array<ContactRequestRecord>
}

/**
 * Update contact request status
 */
export async function updateContactRequestStatus(
  db: Kysely<Database>,
  requestId: string,
  status: 'approved' | 'denied',
  responseMessage?: string,
): Promise<void> {
  await db
    .updateTable('listing_contact_requests')
    .set({
      status,
      responseMessage: responseMessage || null,
      respondedAt: new Date(),
    })
    .where('id', '=', requestId)
    .execute()
}

/**
 * Record a listing view
 * Returns true if view was recorded, false if duplicate (same viewer/IP within 24 hours)
 */
export async function recordListingView(
  db: Kysely<Database>,
  listingId: string,
  viewerId: string | null,
  viewerIp: string | null,
): Promise<boolean> {
  // Check for duplicate view within 24 hours
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  // Check by viewerId if provided
  if (viewerId) {
    const existingView = await db
      .selectFrom('listing_views')
      .select('id')
      .where('listingId', '=', listingId)
      .where('viewerId', '=', viewerId)
      .where('viewedAt', '>=', twentyFourHoursAgo)
      .executeTakeFirst()

    if (existingView) {
      return false
    }
  }

  // Check by IP if no viewerId but IP is provided
  if (!viewerId && viewerIp) {
    const existingView = await db
      .selectFrom('listing_views')
      .select('id')
      .where('listingId', '=', listingId)
      .where('viewerIp', '=', viewerIp)
      .where('viewedAt', '>=', twentyFourHoursAgo)
      .executeTakeFirst()

    if (existingView) {
      return false
    }
  }

  try {
    // Insert view record
    await db
      .insertInto('listing_views')
      .values({
        listingId,
        viewerId,
        viewerIp,
      })
      .execute()

    // Increment view count (separate query, not transactional)
    await db
      .updateTable('marketplace_listings')
      .set((eb) => ({
        viewCount: eb('viewCount', '+', 1),
      }))
      .where('id', '=', listingId)
      .execute()

    return true
  } catch (error) {
    // Handle any unexpected errors
    const { error: logError } = await import('~/lib/logger')
    await logError('Error recording listing view', error)
    return false
  }
}

/**
 * Get listing analytics
 */
export async function getListingAnalytics(
  db: Kysely<Database>,
  listingId: string,
): Promise<{
  viewCount: number
  contactCount: number
  conversionRate: number
}> {
  const result = await db
    .selectFrom('marketplace_listings')
    .select(['viewCount', 'contactCount'])
    .where('id', '=', listingId)
    .executeTakeFirstOrThrow()

  const conversionRate =
    result.viewCount > 0 ? result.contactCount / result.viewCount : 0

  return {
    viewCount: result.viewCount,
    contactCount: result.contactCount,
    conversionRate,
  }
}

/**
 * Get seller verification status
 */
export async function getSellerVerificationStatus(
  db: Kysely<Database>,
  sellerId: string,
): Promise<{ isVerified: boolean; verifiedAt: Date | null }> {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const report = await db
    .selectFrom('credit_reports')
    .select('createdAt')
    .where('userId', '=', sellerId)
    .where('createdAt', '>=', ninetyDaysAgo)
    .orderBy('createdAt', 'desc')
    .executeTakeFirst()

  return {
    isVerified: !!report,
    verifiedAt: report?.createdAt || null,
  }
}

/**
 * Notify contact requesters when a listing is deleted/sold
 */
export async function notifyContactRequestersOfDeletion(
  db: Kysely<Database>,
  listingId: string,
): Promise<void> {
  const { createNotification } = await import('../notifications/server')

  // Get all pending contact requests for this listing
  const requests = await db
    .selectFrom('listing_contact_requests')
    .innerJoin(
      'marketplace_listings',
      'marketplace_listings.id',
      'listing_contact_requests.listingId',
    )
    .select([
      'listing_contact_requests.buyerId',
      'marketplace_listings.species',
    ])
    .where('listing_contact_requests.listingId', '=', listingId)
    .where('listing_contact_requests.status', '=', 'pending')
    .execute()

  // Create notifications for each requester
  for (const request of requests) {
    await createNotification({
      userId: request.buyerId,
      type: 'listingSold',
      title: 'Listing No Longer Available',
      message: `The ${request.species} listing you requested contact for is no longer available`,
      metadata: { listingId },
    })
  }
}

/**
 * Get listings expiring within specified days
 */
export async function getExpiringListings(
  db: Kysely<Database>,
  daysFromNow: number,
): Promise<
  Array<{ id: string; sellerId: string; species: string; expiresAt: Date }>
> {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysFromNow)

  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  return await db
    .selectFrom('marketplace_listings')
    .select(['id', 'sellerId', 'species', 'expiresAt'])
    .where('status', '=', 'active')
    .where('expiresAt', '>=', startOfDay)
    .where('expiresAt', '<=', endOfDay)
    .execute()
}
