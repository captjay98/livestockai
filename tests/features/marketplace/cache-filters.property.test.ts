import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fc from 'fast-check'
import { get } from 'idb-keyval'
import type { FuzzedListing } from '~/features/marketplace/privacy-fuzzer'

// Import after mock setup
import { getCachedListings } from '~/features/marketplace/listing-cache'

// Mock idb-keyval BEFORE importing modules that use it
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}))

describe('Cache Filter Property Tests', () => {
  // Create a FuzzedListing arbitrary that matches the actual type
  const fuzzedListingArb = fc.record({
    id: fc.uuid(),
    sellerId: fc.uuid(),
    livestockType: fc.constantFrom(
      'poultry',
      'fish',
      'cattle',
      'goats',
      'sheep',
      'bees',
    ),
    species: fc.string({ minLength: 1 }),
    quantity: fc.integer({ min: 1, max: 1000 }),
    priceRange: fc
      .integer({ min: 100, max: 10000 })
      .chain((min) =>
        fc
          .integer({ min, max: min + 5000 })
          .map(
            (max) => `₦${min.toLocaleString()}-${max.toLocaleString()}/unit`,
          ),
      ),
    location: fc.constantFrom(
      'Lagos, Lagos',
      'Kano, Kano',
      'Nairobi, Kenya',
      'Accra, Ghana',
    ),
    description: fc.oneof(fc.string(), fc.constant(null)),
    photoUrls: fc.oneof(fc.array(fc.string()), fc.constant(null)),
    contactPreference: fc.constantFrom('app', 'phone', 'both'),
    status: fc.constantFrom('active', 'paused', 'sold', 'expired'),
    viewCount: fc.integer({ min: 0 }),
    createdAt: fc.date({
      min: new Date('2020-01-01'),
      max: new Date('2030-01-01'),
    }),
  }) as unknown as fc.Arbitrary<FuzzedListing>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Property 8: Location Filter (the actual implementation uses location string matching)
  it('Property 8: Location Filter Returns Matching Locations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fuzzedListingArb, { minLength: 5, maxLength: 20 }),
        fc.constantFrom('Lagos', 'Kano', 'Nairobi'),
        async (listings, filterLocation) => {
          vi.mocked(get).mockResolvedValue(listings)

          const result = await getCachedListings({
            location: filterLocation,
          })

          result.forEach((listing) => {
            expect(listing.location).toContain(filterLocation)
          })
        },
      ),
      { numRuns: 50 },
    )
  })

  // Property 9: Price Range Filter - Min Price
  it('Property 9: Min Price Filter Returns Listings >= Min', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fuzzedListingArb, { minLength: 5, maxLength: 20 }),
        fc.integer({ min: 100, max: 5000 }),
        async (listings, minPrice) => {
          vi.mocked(get).mockResolvedValue(listings)

          const result = await getCachedListings({ minPrice })

          result.forEach((listing) => {
            // Extract min price from priceRange like '₦1,000-2,000/unit'
            const priceStr = listing.priceRange
              .split('-')[0]
              .replace(/[^\d.]/g, '')
            const price = parseFloat(priceStr)
            expect(price).toBeGreaterThanOrEqual(minPrice)
          })
        },
      ),
      { numRuns: 50 },
    )
  })

  // Property 10: Price Range Filter - Max Price
  it('Property 10: Max Price Filter Returns Listings <= Max', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fuzzedListingArb, { minLength: 5, maxLength: 20 }),
        fc.integer({ min: 5000, max: 15000 }),
        async (listings, maxPrice) => {
          vi.mocked(get).mockResolvedValue(listings)

          const result = await getCachedListings({ maxPrice })

          result.forEach((listing) => {
            // Extract max price from priceRange like '₦1,000-2,000/unit'
            const priceStr = listing.priceRange
              .split('-')[1]
              .split('/')[0]
              .replace(/[^\d.]/g, '')
            const price = parseFloat(priceStr)
            expect(price).toBeLessThanOrEqual(maxPrice)
          })
        },
      ),
      { numRuns: 50 },
    )
  })

  // Property 11: Combined Filters
  it('Property 11: Combined Filters Work Together', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fuzzedListingArb, { minLength: 5, maxLength: 20 }),
        fc.integer({ min: 100, max: 3000 }),
        fc.integer({ min: 5000, max: 15000 }),
        async (listings, minPrice, maxPrice) => {
          vi.mocked(get).mockResolvedValue(listings)

          const result = await getCachedListings({ minPrice, maxPrice })

          result.forEach((listing) => {
            const minPriceStr = listing.priceRange
              .split('-')[0]
              .replace(/[^\d.]/g, '')
            const maxPriceStr = listing.priceRange
              .split('-')[1]
              .split('/')[0]
              .replace(/[^\d.]/g, '')
            expect(parseFloat(minPriceStr)).toBeGreaterThanOrEqual(minPrice)
            expect(parseFloat(maxPriceStr)).toBeLessThanOrEqual(maxPrice)
          })
        },
      ),
      { numRuns: 50 },
    )
  })

  // Property 14: Empty Cache Returns Empty Array
  it('Property 14: Empty Cache Returns Empty Array', async () => {
    vi.mocked(get).mockResolvedValue(null)

    const result = await getCachedListings()
    expect(result).toEqual([])
  })
})
