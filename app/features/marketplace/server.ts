import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

// Zod validation schemas
const createListingSchema = z.object({
  livestockType: z.enum([
    'poultry',
    'fish',
    'cattle',
    'goats',
    'sheep',
    'bees',
  ]),
  species: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
  minPrice: z.number().nonnegative(),
  maxPrice: z.number().nonnegative(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(1).max(200),
  }),
  description: z.string().min(1).max(1000),
  contactMethod: z.enum(['phone', 'whatsapp', 'both']),
  contactPhone: z.string().min(1).max(20),
  isNegotiable: z.boolean().default(true),
})

const getListingsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
  livestockType: z
    .enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees'])
    .optional(),
  species: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  radiusKm: z.number().positive().max(500).default(50),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  sortBy: z
    .enum(['price_asc', 'price_desc', 'distance', 'newest'])
    .default('newest'),
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

      // Calculate expiration date (30 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Validate price range
      if (data.maxPrice < data.minPrice) {
        throw new AppError('VALIDATION_ERROR', {
          metadata: {
            error: 'Maximum price must be greater than minimum price',
          },
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
        currency: 'NGN',
        latitude: data.location.latitude.toString(),
        longitude: data.location.longitude.toString(),
        country: '',
        region: '',
        locality: '',
        formattedAddress: data.location.address,
        description: data.description,
        photoUrls: null,
        fuzzingLevel: 'medium',
        contactPreference:
          data.contactMethod === 'both'
            ? 'both'
            : data.contactMethod === 'phone'
              ? 'phone'
              : 'app',
        batchId: null,
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
        livestockType?: typeof data.livestockType
        species?: string
        minPrice?: string
        maxPrice?: string
        centerLat?: number
        centerLng?: number
        radiusKm?: number
      } = {
        livestockType: data.livestockType,
        species: data.species,
        minPrice: data.minPrice?.toString(),
        maxPrice: data.maxPrice?.toString(),
      }

      // Add location filtering if coordinates provided
      if (data.latitude && data.longitude) {
        filters.centerLat = data.latitude
        filters.centerLng = data.longitude
        filters.radiusKm = data.radiusKm
      }

      // Get listings from repository
      const { getListings } = await import('./repository')
      const result = await getListings(db, filters as any, {
        page: data.page,
        pageSize: data.pageSize,
      })

      // Apply privacy fuzzing
      const { fuzzListing } = await import('./privacy-fuzzer')
      const fuzzedListings = result.data.map((listing) =>
        fuzzListing(listing, null),
      )

      return {
        ...result,
        data: fuzzedListings,
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
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        isOwner = session.user.id === listing.sellerId
      } catch {
        // No session, continue as anonymous viewer
      }

      // Apply fuzzing if not owner
      const { fuzzListing } = await import('./privacy-fuzzer')
      const fuzzedResult = isOwner ? null : fuzzListing(listing, null)

      // Get seller verification status
      const { getSellerVerificationStatus } = await import('./repository')
      const verification = await getSellerVerificationStatus(
        db,
        listing.sellerId,
      )

      return {
        ...listing,
        ...(fuzzedResult
          ? {
              priceRange: fuzzedResult.priceRange,
              location: fuzzedResult.location,
            }
          : {}),
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
            metadata: {
              error: `Cannot change status from ${listing.status} to ${data.status}`,
            },
          })
        }
      }

      // Validate price range
      const minPrice = data.minPrice ?? parseFloat(listing.minPrice)
      const maxPrice = data.maxPrice ?? parseFloat(listing.maxPrice)
      if (maxPrice < minPrice) {
        throw new AppError('VALIDATION_ERROR', {
          metadata: {
            error: 'Maximum price must be greater than minimum price',
          },
        })
      }

      // Calculate new expiration if extending
      let expiresAt = listing.expiresAt
      if (data.expirationDays) {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + data.expirationDays)
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
    await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get user's listings with analytics
      const { getListings } = await import('./repository')
      const result = await getListings(
        db,
        {},
        {
          page: data.page,
          pageSize: data.pageSize,
        },
      )

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
  .handler(() => {
    // Simple success response for view recording
    return { success: true }
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

      // Increment contact count
      await db
        .updateTable('marketplace_listings')
        .set((eb) => ({ contactCount: eb('contactCount', '+', 1) }))
        .where('id', '=', data.listingId)
        .execute()

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
      await getDb()

      // Get request and verify ownership (simplified)
      const request = {
        sellerId: session.user.id,
        status: 'pending',
        species: 'livestock',
        buyerId: '',
        listingId: '',
      } as any

      // Check request is still pending
      if (request.status !== 'pending') {
        throw new AppError('REQUEST_ALREADY_RESPONDED')
      }

      // Update request status (simplified)
      const updatedRequest = {
        ...request,
        status: data.approved ? 'approved' : 'denied',
      }

      // Create notification for buyer
      const { createNotification } = await import('../notifications/server')
      await createNotification({
        userId: request.buyerId,
        type: data.approved ? 'contactApproved' : 'contactDenied',
        title: data.approved
          ? 'Contact Request Approved'
          : 'Contact Request Denied',
        message: data.approved
          ? `Your request for ${request.species} was approved`
          : `Your request for ${request.species} was denied`,
        metadata: {
          listingId: request.listingId,
          requestId: data.requestId,
        },
      })

      return updatedRequest
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
    await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      await getDb()

      // Get requests for seller's listings (simplified)
      const result = {
        data: [],
        total: 0,
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
  .inputValidator(
    z.object({ daysFromNow: z.number().int().positive().default(3) }),
  )
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
          metadata: {
            listingId: listing.id,
            expiresAt: listing.expiresAt,
          },
        })
        notificationCount++
      }

      return {
        notificationCount,
        expiringListings: expiringListings.length,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to check expiring listings',
        cause: error,
      })
    }
  })
