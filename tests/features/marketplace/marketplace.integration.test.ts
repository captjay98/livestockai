/**
 * Integration tests for Offline Marketplace Properties
 * Tests properties 14, 19, 20, 24, 25
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { getTestDb, seedTestUser, truncateAllTables } from '../../helpers/db-integration'
import type {ContactRequestInsert, ListingInsert} from '~/features/marketplace/repository';
import {
  
  
  getListings,
  hasExistingContactRequest,
  insertContactRequest,
  insertListing,
  recordListingView
} from '~/features/marketplace/repository'

// Helper to create test listing
async function createTestListing(sellerId: string, overrides: Partial<ListingInsert> = {}): Promise<string> {
  const db = getTestDb()
  const listing: ListingInsert = {
    sellerId,
    livestockType: 'poultry',
    species: 'broiler',
    quantity: 100,
    minPrice: '10.00',
    maxPrice: '15.00',
    currency: 'USD',
    latitude: '9.0579',
    longitude: '7.4951',
    country: 'Nigeria',
    region: 'Kaduna',
    locality: 'Kaduna',
    formattedAddress: 'Kaduna, Nigeria',
    description: 'Test listing',
    photoUrls: null,
    fuzzingLevel: 'low',
    contactPreference: 'app',
    batchId: null,
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    ...overrides,
  }
  return insertListing(db, listing)
}

describe('Marketplace Integration Tests', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  describe('Property 14: Pagination Boundaries', () => {
    it('should return correct subset with page/pageSize params', async () => {
      const db = getTestDb()
      const seller = await seedTestUser({ email: 'seller@test.com' })

      // Create 5 test listings
      const listingIds = []
      for (let i = 0; i < 5; i++) {
        const id = await createTestListing(seller.userId, {
          species: `broiler-${i}`,
          quantity: 100 + i,
        })
        listingIds.push(id)
      }

      // Test first page (2 items)
      const page1 = await getListings(db, {}, { page: 1, pageSize: 2 })
      expect(page1.data).toHaveLength(2)
      expect(page1.total).toBe(5)

      // Test second page (2 items)
      const page2 = await getListings(db, {}, { page: 2, pageSize: 2 })
      expect(page2.data).toHaveLength(2)
      expect(page2.total).toBe(5)

      // Test third page (1 item)
      const page3 = await getListings(db, {}, { page: 3, pageSize: 2 })
      expect(page3.data).toHaveLength(1)
      expect(page3.total).toBe(5)

      // Test beyond available pages
      const page4 = await getListings(db, {}, { page: 4, pageSize: 2 })
      expect(page4.data).toHaveLength(0)
      expect(page4.total).toBe(5)

      // Verify no overlap between pages
      const page1Ids = page1.data.map(l => l.id)
      const page2Ids = page2.data.map(l => l.id)
      const page3Ids = page3.data.map(l => l.id)
      
      expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids))
      expect(page1Ids).not.toEqual(expect.arrayContaining(page3Ids))
      expect(page2Ids).not.toEqual(expect.arrayContaining(page3Ids))
    })
  })

  describe('Property 19: View Count Increment', () => {
    it('should increment viewCount when recordListingView is called', async () => {
      const db = getTestDb()
      const seller = await seedTestUser({ email: 'seller@test.com' })
      const viewer = await seedTestUser({ email: 'viewer@test.com' })

      const listingId = await createTestListing(seller.userId)

      // Get initial view count
      const initialListing = await db
        .selectFrom('marketplace_listings')
        .select('viewCount')
        .where('id', '=', listingId)
        .executeTakeFirstOrThrow()
      expect(initialListing.viewCount).toBe(0)

      // Record a view
      const success = await recordListingView(db, listingId, viewer.userId, '192.168.1.1')
      expect(success).toBe(true)

      // Verify view count incremented
      const updatedListing = await db
        .selectFrom('marketplace_listings')
        .select('viewCount')
        .where('id', '=', listingId)
        .executeTakeFirstOrThrow()
      expect(updatedListing.viewCount).toBe(1)

      // Record another view from different user
      const viewer2 = await seedTestUser({ email: 'viewer2@test.com' })
      await recordListingView(db, listingId, viewer2.userId, '192.168.1.2')

      // Verify view count incremented again
      const finalListing = await db
        .selectFrom('marketplace_listings')
        .select('viewCount')
        .where('id', '=', listingId)
        .executeTakeFirstOrThrow()
      expect(finalListing.viewCount).toBe(2)
    })
  })

  describe('Property 20: Contact Count Increment', () => {
    it('should increment contactCount when contact request is created', async () => {
      const db = getTestDb()
      const seller = await seedTestUser({ email: 'seller@test.com' })
      const buyer = await seedTestUser({ email: 'buyer@test.com' })

      const listingId = await createTestListing(seller.userId)

      // Get initial contact count
      const initialListing = await db
        .selectFrom('marketplace_listings')
        .select('contactCount')
        .where('id', '=', listingId)
        .executeTakeFirstOrThrow()
      expect(initialListing.contactCount).toBe(0)

      // Create contact request
      const contactRequest: ContactRequestInsert = {
        listingId,
        buyerId: buyer.userId,
        message: 'Interested in your livestock',
        contactMethod: 'app',
      }

      await insertContactRequest(db, contactRequest)

      // Verify contact count incremented
      const updatedListing = await db
        .selectFrom('marketplace_listings')
        .select('contactCount')
        .where('id', '=', listingId)
        .executeTakeFirstOrThrow()
      expect(updatedListing.contactCount).toBe(1)
    })
  })

  describe('Property 24: Duplicate Contact Request Rejection', () => {
    it('should prevent same buyer from requesting twice for same listing', async () => {
      const db = getTestDb()
      const seller = await seedTestUser({ email: 'seller@test.com' })
      const buyer = await seedTestUser({ email: 'buyer@test.com' })

      const listingId = await createTestListing(seller.userId)

      const contactRequest: ContactRequestInsert = {
        listingId,
        buyerId: buyer.userId,
        message: 'Interested in your livestock',
        contactMethod: 'app',
      }

      // First request should succeed
      const firstRequestId = await insertContactRequest(db, contactRequest)
      expect(firstRequestId).toBeDefined()

      // Check that request exists
      const exists = await hasExistingContactRequest(db, listingId, buyer.userId)
      expect(exists).toBe(true)

      // Second request should return existing ID (not create duplicate)
      const secondRequestId = await insertContactRequest(db, contactRequest)
      expect(secondRequestId).toBe(firstRequestId)

      // Verify only one request exists in database
      const requests = await db
        .selectFrom('listing_contact_requests')
        .selectAll()
        .where('listingId', '=', listingId)
        .where('buyerId', '=', buyer.userId)
        .execute()
      expect(requests).toHaveLength(1)
    })
  })

  describe('Property 25: View Deduplication', () => {
    it('should prevent same viewer from incrementing view count twice per day', async () => {
      const db = getTestDb()
      const seller = await seedTestUser({ email: 'seller@test.com' })
      const viewer = await seedTestUser({ email: 'viewer@test.com' })

      const listingId = await createTestListing(seller.userId)

      // First view should succeed
      const firstView = await recordListingView(db, listingId, viewer.userId, '192.168.1.1')
      expect(firstView).toBe(true)

      // Verify view count is 1
      let listing = await db
        .selectFrom('marketplace_listings')
        .select('viewCount')
        .where('id', '=', listingId)
        .executeTakeFirstOrThrow()
      expect(listing.viewCount).toBe(1)

      // Second view from same user should fail (duplicate)
      const secondView = await recordListingView(db, listingId, viewer.userId, '192.168.1.1')
      expect(secondView).toBe(false)

      // Verify view count is still 1
      listing = await db
        .selectFrom('marketplace_listings')
        .select('viewCount')
        .where('id', '=', listingId)
        .executeTakeFirstOrThrow()
      expect(listing.viewCount).toBe(1)

      // Verify only one view record exists
      const viewRecords = await db
        .selectFrom('listing_views')
        .selectAll()
        .where('listingId', '=', listingId)
        .where('viewerId', '=', viewer.userId)
        .execute()
      expect(viewRecords).toHaveLength(1)

      // Different viewer should still be able to view
      const viewer2 = await seedTestUser({ email: 'viewer2@test.com' })
      const thirdView = await recordListingView(db, listingId, viewer2.userId, '192.168.1.2')
      expect(thirdView).toBe(true)

      // Verify view count is now 2
      listing = await db
        .selectFrom('marketplace_listings')
        .select('viewCount')
        .where('id', '=', listingId)
        .executeTakeFirstOrThrow()
      expect(listing.viewCount).toBe(2)
    })
  })
})