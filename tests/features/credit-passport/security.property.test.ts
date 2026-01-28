import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

import {
  calculateExpirationDate,
  hashContent,
  isExpired,
} from '~/features/credit-passport/signature-service'

describe('Credit Passport Security Properties', () => {
  // Property 16: Hash determinism
  it('Property 16: hashContent produces deterministic results', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (content) => {
        const hash1 = await hashContent(content)
        const hash2 = await hashContent(content)
        expect(hash1).toBe(hash2)
        expect(hash1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex format
      }),
      { numRuns: 50 },
    )
  })

  // Property 18: Expiration calculation
  it('Property 18: expiration calculation properties', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.constantFrom(30, 60, 90),
        (startDate, validityDays) => {
          // Skip invalid dates (shouldn't happen but guard against it)
          fc.pre(!isNaN(startDate.getTime()))

          const expiration = calculateExpirationDate(startDate, validityDays)

          // Expiration should be after start date
          expect(expiration.getTime()).toBeGreaterThan(startDate.getTime())

          // Should be exactly validityDays later
          const daysDiff = Math.round(
            (expiration.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          )
          expect(daysDiff).toBe(validityDays)
        },
      ),
      { numRuns: 100 },
    )
  })

  // Additional test for isExpired
  it('isExpired correctly identifies expired dates', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day from now

    expect(isExpired(pastDate)).toBe(true)
    expect(isExpired(futureDate)).toBe(false)
  })
})
