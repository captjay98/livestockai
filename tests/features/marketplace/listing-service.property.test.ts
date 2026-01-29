import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateExpirationDate,
  generateListingFromBatch,
  isListingExpired,
  shouldNotifyExpiration,
  validateListingInput,
  validateStatusTransition,
} from '~/features/marketplace/listing-service'

describe('listing-service property tests', () => {
  it('Property 1: Required Fields Validation', () => {
    // Valid listing with proper location structure - filter out whitespace-only strings
    const nonEmptyString = fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0)
    const validListing = fc.record({
      livestockType: fc.constantFrom(
        'poultry',
        'fish',
        'cattle',
        'goats',
        'sheep',
      ),
      species: nonEmptyString,
      quantity: fc.integer({ min: 1, max: 1000 }),
      minPrice: fc.double({ min: 0.01, max: 1000, noNaN: true }),
      maxPrice: fc.double({ min: 0.01, max: 1000, noNaN: true }),
      location: fc.record({
        state: nonEmptyString,
        lga: nonEmptyString,
        address: fc
          .string({ minLength: 1, maxLength: 200 })
          .filter((s) => s.trim().length > 0),
      }),
    })

    fc.assert(
      fc.property(validListing, (listing) => {
        // Ensure maxPrice >= minPrice
        const adjustedListing = {
          ...listing,
          maxPrice: Math.max(listing.minPrice, listing.maxPrice),
        }
        const result = validateListingInput(adjustedListing as any)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      }),
      { numRuns: 100 },
    )
  })

  it('Property 2: Expiration Date Calculation', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
        fc.constantFrom(7, 14, 30, 60),
        (createdAt, period) => {
          const expirationDate = calculateExpirationDate(createdAt, period)
          const expectedDate = new Date(createdAt)
          expectedDate.setDate(expectedDate.getDate() + period)
          expect(expirationDate.getTime()).toBe(expectedDate.getTime())
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 16: Expiration Status Transition', () => {
    const now = new Date()

    fc.assert(
      fc.property(
        fc.date({
          min: new Date('2020-01-01'),
          max: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          noInvalidDate: true,
        }),
        (pastDate) => {
          expect(isListingExpired(pastDate, now)).toBe(true)
        },
      ),
      { numRuns: 100 },
    )

    fc.assert(
      fc.property(
        fc.date({
          min: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          max: new Date('2030-01-01'),
          noInvalidDate: true,
        }),
        (futureDate) => {
          expect(isListingExpired(futureDate, now)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 17: Expiration Warning Detection', () => {
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    fc.assert(
      fc.property(
        fc.date({
          min: new Date(now.getTime() + 60 * 1000),
          max: threeDaysFromNow,
          noInvalidDate: true,
        }),
        (dateWithin3Days) => {
          expect(shouldNotifyExpiration(dateWithin3Days, now)).toBe(true)
        },
      ),
      { numRuns: 100 },
    )

    fc.assert(
      fc.property(
        fc.date({
          min: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000),
          max: new Date('2030-01-01'),
          noInvalidDate: true,
        }),
        (dateBeyond3Days) => {
          expect(shouldNotifyExpiration(dateBeyond3Days, now)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 18: Batch Pre-fill Generation', () => {
    const batchArbitrary = fc.record({
      species: fc.string({ minLength: 1 }),
      currentQuantity: fc.integer({ min: 1, max: 1000 }),
      livestockType: fc.constantFrom(
        'poultry',
        'fish',
        'cattle',
        'goats',
        'sheep',
      ),
    })

    fc.assert(
      fc.property(batchArbitrary, (batch) => {
        const listing = generateListingFromBatch(batch)
        expect(listing.species).toBe(batch.species)
        expect(listing.quantity).toBe(batch.currentQuantity)
        expect(listing.livestockType).toBe(batch.livestockType)
      }),
      { numRuns: 100 },
    )
  })

  it('Property 23: Listing Status Transitions', () => {
    const validTransitions = [
      ['active', 'paused'],
      ['active', 'sold'],
      ['active', 'expired'],
      ['paused', 'active'],
      ['paused', 'sold'],
      ['expired', 'active'],
    ] as const

    const invalidTransitions = [
      ['sold', 'active'],
      ['sold', 'paused'],
      ['sold', 'expired'],
      ['expired', 'paused'],
    ] as const

    fc.assert(
      fc.property(fc.constantFrom(...validTransitions), ([from, to]) => {
        expect(validateStatusTransition(from, to)).toBe(true)
      }),
      { numRuns: 100 },
    )

    fc.assert(
      fc.property(fc.constantFrom(...invalidTransitions), ([from, to]) => {
        expect(validateStatusTransition(from, to)).toBe(false)
      }),
      { numRuns: 100 },
    )
  })
})
