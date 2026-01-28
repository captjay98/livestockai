import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

// Zod validation schemas
const createListingSchema = z.object({
  livestockType: z.enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees']),
  species: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
  minPrice: z.number().nonnegative(),
  maxPrice: z.number().nonnegative(),
  currency: z.string().min(1).max(5).default('₦'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    country: z.string().min(1).max(100),
    region: z.string().min(1).max(100),
    locality: z.string().min(1).max(100),
    formattedAddress: z.string().min(1).max(200),
  }),
  description: z.string().max(1000).optional(),
  photoUrls: z.array(z.string().url()).max(5).optional(),
  fuzzingLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  contactPreference: z.enum(['app', 'phone', 'both']).default('app'),
  batchId: z.string().uuid().optional(),
})

const getListingsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
  livestockType: z.enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees']).optional(),
  species: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  radiusKm: z.number().positive().max(500).default(50),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'distance', 'newest']).default('newest'),
})

const getListingDetailSchema = z.object({
  listingId: z.string().uuid(),
  viewerLatitude: z.number().min(-90).max(90).optional(),
  viewerLongitude: z.number().min(-180).max(180).optional(),
})

/**
 * Create a new marketplace listing
 */
export const createListingFn = createServerFn({ method: 'POST' })
  .inputValidator(createListingSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Calculate expiration date using service
      const { calculateExpirationDate } = await import('./listing-service')
      const expiresAt = calculateExpirationDate(new Date(), 30)

      // Validate price range
      if (data.maxPrice < data.minPrice) {
        throw new AppError('VALIDATION_ERROR', {
          metadata: { error: 'Maximum price must be greater than minimum price' },
        })
      }

      // Insert using repository
      const { insertListing } = await import('./repository')
      const listingId = await insertListing(db, {
        sellerId: session.user.id,
        livestockType: data.livestockType,
        species: data.species,
        quantity: data.quantity,
        minPrice: data.minPrice.toString(),
        maxPrice: data.maxPrice.toString(),
        currency: data.currency,
        latitude: data.location.latitude.toString(),
        longitude: data.location.longitude.toString(),
        country: data.location.country,
        region: data.location.region,
        locality: data.location.locality,
        formattedAddress: data.location.formattedAddress,
        description: data.description ?? null,
        photoUrls: data.photoUrls ?? null,
        fuzzingLevel: data.fuzzingLevel,
        contactPreference: data.contactPreference,
        batchId: data.batchId ?? null,
        status: 'active',
        expiresAt,
      })

      return { id: listingId }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to create listing',
        cause: error,
      })
    }
  })

/**
 * Get marketplace listings with filters
 */
export const getListingsFn = createServerFn({ method: 'GET' })
  .inputValidator(getListingsSchema)
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Mark expired listings
      const { markExpiredListings } = await import('./repository')
      await markExpiredListings(db)

      // Build filters
      const filters: {
        livestockType?: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
        species?: string
        minPrice?: string
        maxPrice?: string
        boundingBox?: {
          minLat: number
          maxLat: number
          minLon: number
          maxLon: number
        }
      } = {
        livestockType: data.livestockType,
        species: data.species,
        minPrice: data.minPrice?.toString(),
        maxPrice: data.maxPrice?.toString(),
      }

      // Add location filtering if coordinates provided
      if (data.latitude && data.longitude) {
        // Simple bounding box calculation
        const radiusInDegrees = data.radiusKm / 111 // Rough conversion
        filters.boundingBox = {
          minLat: data.latitude - radiusInDegrees,
          maxLat: data.latitude + radiusInDegrees,
          minLon: data.longitude - radiusInDegrees,
          maxLon: data.longitude + radiusInDegrees,
        }
      }

      // Get listings from repository
      const { getListings, getListingsInBoundingBox } = await import('./repository')
      
      let result: { data: Array<any>; total: number }
      
      if (filters.boundingBox) {
        // Use bounding box query
        const listings = await getListingsInBoundingBox(db, filters.boundingBox, filters)
        result = {
          data: listings,
          total: listings.length,
        }
      } else {
        // Use regular filtered query
        result = await getListings(db, filters, {
          page: data.page,
          pageSize: data.pageSize,
        })
      }

      // Apply privacy fuzzing
      const { fuzzListing } = await import('./privacy-fuzzer')
      const fuzzedListings = result.data.map((listing) =>
        fuzzListing(listing, null, data.latitude && data.longitude ? { lat: data.latitude, lon: data.longitude } : undefined),
      )

      // Calculate pagination info
      const totalPages = Math.ceil(result.total / data.pageSize)

      return {
        data: fuzzedListings,
        totalPages,
        currentPage: data.page,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to get listings',
        cause: error,
      })
    }
  })

/**
 * Get single listing detail
 */
export const getListingDetailFn = createServerFn({ method: 'GET' })
  .inputValidator(getListingDetailSchema)
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get listing by ID
      const { getListingById } = await import('./repository')
      const listing = await getListingById(db, data.listingId)

      if (!listing) {
        throw new AppError('NOT_FOUND', {
          metadata: { listingId: data.listingId },
        })
      }

      // Check if viewer is owner (optional auth)
      let isOwner = false
      try {
        const { getOptionalSession } = await import('../auth/server-middleware')
        const session = await getOptionalSession()
        isOwner = session?.user.id === listing.sellerId
      } catch {
        // No session, continue as anonymous viewer
      }

      // Apply fuzzing if not owner
      let result = listing
      if (!isOwner) {
        const { fuzzListing } = await import('./privacy-fuzzer')
        result = fuzzListing(
          listing,
          null,
          data.viewerLatitude && data.viewerLongitude ? { lat: data.viewerLatitude, lon: data.viewerLongitude } : undefined,
        )
      }

      // Get seller verification status
      const { getSellerVerificationStatus } = await import('./repository')
      const verification = await getSellerVerificationStatus(db, listing.sellerId)

      return {
        ...result,
        isOwner,
        sellerVerification: verification,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to get listing detail',
        cause: error,
      })
    }
  })

const updateListingSchema = z.object({
  listingId: z.string().uuid(),
  quantity: z.number().int().positive().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  description: z.string().min(1).max(1000).optional(),
  status: z.enum(['active', 'paused', 'sold']).optional(),
  expirationDays: z.number().int().positive().max(30).optional(),
})

const deleteListingSchema = z.object({
  listingId: z.string().uuid(),
})

const getMyListingsSchema = z.object({
  status: z.enum(['active', 'paused', 'sold', 'expired', 'all']).default('all'),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
})

const recordListingViewSchema = z.object({
  listingId: z.string().uuid(),
})

/**
 * Update an existing listing
 */
export const updateListingFn = createServerFn({ method: 'POST' })
  .inputValidator(updateListingSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get listing and verify ownership
      const { getListingById } = await import('./repository')
      const listing = await getListingById(db, data.listingId)

      if (!listing) {
        throw new AppError('NOT_FOUND', {
          metadata: { listingId: data.listingId },
        })
      }

      if (listing.sellerId !== session.user.id) {
        throw new AppError('NOT_LISTING_OWNER')
      }

      // Validate status transition
      if (data.status) {
        const { validateStatusTransition } = await import('./listing-service')
        const isValid = validateStatusTransition(listing.status, data.status)
        if (!isValid) {
          throw new AppError('VALIDATION_ERROR', {
            metadata: { error: `Cannot change status from ${listing.status} to ${data.status}` },
          })
        }
      }

      // Validate price range
      const minPrice = data.minPrice ?? parseFloat(listing.minPrice)
      const maxPrice = data.maxPrice ?? parseFloat(listing.maxPrice)
      if (maxPrice < minPrice) {
        throw new AppError('VALIDATION_ERROR', {
          metadata: { error: 'Maximum price must be greater than minimum price' },
        })
      }

      // Calculate new expiration if extending
      let expiresAt = listing.expiresAt
      if (data.expirationDays) {
        const { calculateExpirationDate } = await import('./listing-service')
        expiresAt = calculateExpirationDate(new Date(), data.expirationDays)
      }

      // Update listing
      const { updateListing } = await import('./repository')
      const updatedListing = await updateListing(db, data.listingId, {
        quantity: data.quantity,
        minPrice: data.minPrice?.toString(),
        maxPrice: data.maxPrice?.toString(),
        description: data.description,
        status: data.status,
        expiresAt,
      })

      return updatedListing
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to update listing',
        cause: error,
      })
    }
  })

/**
 * Delete a listing
 */
export const deleteListingFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteListingSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get listing and verify ownership
      const { getListingById } = await import('./repository')
      const listing = await getListingById(db, data.listingId)

      if (!listing) {
        throw new AppError('NOT_FOUND', {
          metadata: { listingId: data.listingId },
        })
      }

      if (listing.sellerId !== session.user.id) {
        throw new AppError('NOT_LISTING_OWNER')
      }

      // Soft delete listing
      const { softDeleteListing } = await import('./repository')
      await softDeleteListing(db, data.listingId)

      // Notify pending contact requesters
      const { notifyContactRequestersOfDeletion } = await import('./repository')
      await notifyContactRequestersOfDeletion(db, data.listingId)

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to delete listing',
        cause: error,
      })
    }
  })

/**
 * Get current user's listings
 */
export const getMyListingsFn = createServerFn({ method: 'GET' })
  .inputValidator(getMyListingsSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get user's listings with analytics
      const { getListingsBySeller } = await import('./repository')
      const listings = await getListingsBySeller(db, session.user.id, data.status)
      
      const result = {
        data: listings,
        total: listings.length,
        page: data.page,
        pageSize: data.pageSize,
      }

      return result
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to get user listings',
        cause: error,
      })
    }
  })

/**
 * Record a listing view (public endpoint)
 */
export const recordListingViewFn = createServerFn({ method: 'POST' })
  .inputValidator(recordListingViewSchema)
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      
      const { recordListingView } = await import('./repository')
      const success = await recordListingView(db, data.listingId, null, null)
      return { success }
    } catch (error) {
      // Don't throw errors for view recording to avoid breaking user experience
      return { success: false }
    }
  })

// Contact request schemas
const createContactRequestSchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().min(10).max(1000),
  contactMethod: z.enum(['app', 'phone', 'email']),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
})

const respondToRequestSchema = z.object({
  requestId: z.string().uuid(),
  approved: z.boolean(),
  responseMessage: z.string().max(500).optional(),
})

const getContactRequestsSchema = z.object({
  status: z.enum(['pending', 'approved', 'denied', 'all']).default('pending'),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
})

/**
 * Create a contact request for a listing
 */
export const createContactRequestFn = createServerFn({ method: 'POST' })
  .inputValidator(createContactRequestSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Check listing exists and not expired
      const { getListingById } = await import('./repository')
      const listing = await getListingById(db, data.listingId)
      
      if (!listing || listing.status === 'expired') {
        throw new AppError('NOT_FOUND', {
          metadata: { listingId: data.listingId },
        })
      }

      // Check buyer is not the seller
      if (listing.sellerId === session.user.id) {
        throw new AppError('CONTACT_OWN_LISTING')
      }

      // Check no existing request
      const { hasExistingContactRequest } = await import('./repository')
      const existing = await hasExistingContactRequest(db, data.listingId, session.user.id)
      if (existing) {
        throw new AppError('DUPLICATE_CONTACT_REQUEST')
      }

      // Insert contact request
      const { insertContactRequest } = await import('./repository')
      const requestId = await insertContactRequest(db, {
        listingId: data.listingId,
        buyerId: session.user.id,
        message: data.message,
        contactMethod: data.contactMethod,
        phoneNumber: data.phoneNumber,
        email: data.email,
      })

      // Note: Contact count increment would need to be implemented in repository

      // Create notification for seller
      const { createNotification } = await import('../notifications/server')
      await createNotification({
        userId: listing.sellerId,
        type: 'contactRequest',
        title: 'New Contact Request',
        message: `Someone is interested in your ${listing.species} listing`,
        metadata: { listingId: data.listingId, requestId },
      })

      return { id: requestId }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to create contact request',
        cause: error,
      })
    }
  })

/**
 * Respond to a contact request
 */
export const respondToRequestFn = createServerFn({ method: 'POST' })
  .inputValidator(respondToRequestSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get request and verify ownership
      const { getContactRequestById } = await import('./repository')
      const request = await getContactRequestById(db, data.requestId)
      
      if (!request) {
        throw new AppError('NOT_LISTING_OWNER')
      }

      // Get listing to check ownership
      const { getListingById } = await import('./repository')
      const listing = await getListingById(db, request.listingId)
      
      if (!listing || listing.sellerId !== session.user.id) {
        throw new AppError('NOT_LISTING_OWNER')
      }

      // Check request is still pending
      if (request.status !== 'pending') {
        throw new AppError('REQUEST_ALREADY_RESPONDED')
      }

      // Update request status
      const { updateContactRequestStatus } = await import('./repository')
      await updateContactRequestStatus(db, data.requestId, data.approved ? 'approved' : 'denied', data.responseMessage)

      // Create notification for buyer
      const { createNotification } = await import('../notifications/server')
      await createNotification({
        userId: request.buyerId,
        type: data.approved ? 'contactApproved' : 'contactDenied',
        title: data.approved ? 'Contact Request Approved' : 'Contact Request Denied',
        message: data.approved 
          ? `Your request for ${listing.species} was approved`
          : `Your request for ${listing.species} was denied`,
        metadata: { listingId: request.listingId, requestId: data.requestId },
      })

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to respond to request',
        cause: error,
      })
    }
  })

/**
 * Get contact requests for seller's listings
 */
export const getContactRequestsFn = createServerFn({ method: 'GET' })
  .inputValidator(getContactRequestsSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get requests for seller's listings
      const { getContactRequestsForSeller } = await import('./repository')
      const requests = await getContactRequestsForSeller(db, session.user.id, data.status)
      
      const result = {
        data: requests,
        total: requests.length,
        page: data.page,
        pageSize: data.pageSize,
      }

      return result
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to get contact requests',
        cause: error,
      })
    }
  })

/**
 * Check for expiring listings and send notifications
 */
export const checkExpiringListingsFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ daysFromNow: z.number().int().positive().default(3) }))
  .handler(async ({ data }) => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get listings expiring in specified days
      const { getExpiringListings } = await import('./repository')
      const expiringListings = await getExpiringListings(db, data.daysFromNow)

      // Create notifications for each seller
      const { createNotification } = await import('../notifications/server')
      let notificationCount = 0

      for (const listing of expiringListings) {
        await createNotification({
          userId: listing.sellerId,
          type: 'listingExpiring',
          title: 'Listing Expiring Soon',
          message: `Your ${listing.species} listing expires in ${data.daysFromNow} day${data.daysFromNow === 1 ? '' : 's'}`,
          metadata: { listingId: listing.id, expiresAt: listing.expiresAt },
        })
        notificationCount++
      }

      return { notificationCount, expiringListings: expiringListings.length }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to check expiring listings',
        cause: error,
      })
    }
  })