import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import type {
  AccessGrant,
  AccessRequest,
} from '~/features/extension/access-service'
import {
  calculateExpirationDate,
  canRevokeAccess,
  isAccessActive,
  isWithinEditWindow,
  validateAccessRequest,
} from '~/features/extension/access-service'

/**
 * Property-Based Tests for Extension Worker Mode - Access Service
 *
 * Feature: complete-extension-worker-mode
 * Validates: Requirements 5.4-5.6, 17.3
 */

describe('Access Service - Property-Based Tests', () => {
  /**
   * Property 3: Access Expiration Calculation
   *
   * For any positive duration in days, the calculated expiration date
   * should be exactly `duration` days in the future from the current date.
   *
   * Validates: Requirements 5.5, 17.3
   */
  describe('Property 3: Access expiration calculation', () => {
    it('should calculate expiration date exactly N days in the future', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 365 }), (durationDays) => {
          const now = new Date()
          const expiresAt = calculateExpirationDate(durationDays)

          // Calculate expected date
          const expected = new Date(now)
          expected.setDate(expected.getDate() + durationDays)

          // Allow 1 second tolerance for test execution time
          const diff = Math.abs(expiresAt.getTime() - expected.getTime())
          return diff < 1000
        }),
        { numRuns: 100 },
      )
    })

    it('should always return a future date for positive durations', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 365 }), (durationDays) => {
          const now = new Date()
          const expiresAt = calculateExpirationDate(durationDays)
          return expiresAt > now
        }),
        { numRuns: 100 },
      )
    })

    it('should maintain day-of-month consistency when possible', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 28 }), (durationDays) => {
          const now = new Date()
          const expiresAt = calculateExpirationDate(durationDays)

          // Calculate expected day
          const expectedDay = now.getDate() + durationDays
          const daysInMonth = new Date(
            expiresAt.getFullYear(),
            expiresAt.getMonth() + 1,
            0,
          ).getDate()

          // If we don't overflow the month, day should match
          if (expectedDay <= daysInMonth) {
            return expiresAt.getDate() === expectedDay
          }
          return true
        }),
        { numRuns: 100 },
      )
    })

    it('should be monotonically increasing with duration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 180 }),
          fc.integer({ min: 1, max: 180 }),
          (duration1, duration2) => {
            const date1 = calculateExpirationDate(duration1)
            const date2 = calculateExpirationDate(duration2)

            if (duration1 < duration2) {
              return date1 < date2
            }
            if (duration1 > duration2) {
              return date1 > date2
            }
            // Allow small time difference for equal durations
            return Math.abs(date1.getTime() - date2.getTime()) < 1000
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 4: Access Active Status
   *
   * For any access grant:
   * - If revokedAt is set, isAccessActive returns false
   * - If expiresAt is in the past, isAccessActive returns false
   * - Otherwise, isAccessActive returns true
   *
   * Validates: Requirements 5.4, 5.6, 17.3
   */
  describe('Property 4: Access active status', () => {
    const grantArbitrary = fc.record({
      id: fc.uuid(),
      farmId: fc.uuid(),
      grantedBy: fc.uuid(),
      grantedTo: fc.uuid(),
      createdAt: fc.date({ min: new Date('2020-01-01'), noInvalidDate: true }),
      expiresAt: fc.date({ min: new Date('2020-01-01'), noInvalidDate: true }),
      revokedAt: fc.option(
        fc.date({ min: new Date('2020-01-01'), noInvalidDate: true }),
        { nil: null },
      ),
    })

    it('should return false when grant is revoked', () => {
      fc.assert(
        fc.property(grantArbitrary, (grant) => {
          if (grant.revokedAt) {
            return !isAccessActive(grant)
          }
          return true
        }),
        { numRuns: 100 },
      )
    })

    it('should return false when grant is expired', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2023-01-01'),
            noInvalidDate: true,
          }),
          (id, farmId, grantedBy, grantedTo, pastDate) => {
            const grant: AccessGrant = {
              id,
              farmId,
              grantedBy,
              grantedTo,
              createdAt: pastDate,
              expiresAt: pastDate, // Expired
              revokedAt: null,
            }

            return !isAccessActive(grant)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return true when grant is not revoked and not expired', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 365 }),
          (id, farmId, grantedBy, grantedTo, daysInFuture) => {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + daysInFuture)

            const grant: AccessGrant = {
              id,
              farmId,
              grantedBy,
              grantedTo,
              createdAt: new Date(),
              expiresAt: futureDate,
              revokedAt: null,
            }

            return isAccessActive(grant)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should always return boolean', () => {
      fc.assert(
        fc.property(grantArbitrary, (grant) => {
          const result = isAccessActive(grant)
          return typeof result === 'boolean'
        }),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 5: Edit Window Calculation
   *
   * For any creation timestamp and window hours, isWithinEditWindow returns true
   * if and only if the current time minus creation time is less than or equal to
   * window hours in milliseconds.
   *
   * Validates: Requirements 9.9, 17.3
   */
  describe('Property 5: Edit window calculation', () => {
    it('should return true when within edit window', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 48 }),
          fc.integer({ min: 0, max: 23 }),
          (windowHours, hoursAgo) => {
            fc.pre(hoursAgo < windowHours)

            const createdAt = new Date()
            createdAt.setHours(createdAt.getHours() - hoursAgo)

            return isWithinEditWindow(createdAt, windowHours)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return false when outside edit window', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 48 }),
          fc.integer({ min: 1, max: 100 }),
          (windowHours, hoursAgo) => {
            fc.pre(hoursAgo > windowHours)

            const createdAt = new Date()
            createdAt.setHours(createdAt.getHours() - hoursAgo)

            return !isWithinEditWindow(createdAt, windowHours)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should handle boundary case at exact window limit', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 48 }), (windowHours) => {
          const createdAt = new Date()
          // Subtract window hours minus a small buffer to ensure we're within the window
          // This avoids millisecond timing issues at exact boundaries
          createdAt.setHours(createdAt.getHours() - windowHours)
          createdAt.setSeconds(createdAt.getSeconds() + 1) // 1 second buffer inside window

          // Should be within window
          return isWithinEditWindow(createdAt, windowHours)
        }),
        { numRuns: 100 },
      )
    })

    it('should always return boolean', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), noInvalidDate: true }),
          fc.integer({ min: 1, max: 168 }),
          (createdAt, windowHours) => {
            const result = isWithinEditWindow(createdAt, windowHours)
            return typeof result === 'boolean'
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should be monotonic with respect to window size', () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2023-01-01'),
            noInvalidDate: true,
          }),
          fc.integer({ min: 1, max: 100 }),
          (createdAt, windowHours) => {
            const withinSmaller = isWithinEditWindow(createdAt, windowHours)
            const withinLarger = isWithinEditWindow(createdAt, windowHours + 10)

            // If within smaller window, must be within larger window
            if (withinSmaller) {
              return withinLarger
            }
            return true
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 6: Access Request Validation
   *
   * For any user with an existing pending request for a farm,
   * attempting to create another request for the same farm should return an error.
   *
   * Validates: Requirements 5.4, 17.4
   */
  describe('Property 6: Access request validation', () => {
    const requestArbitrary = fc.record({
      id: fc.uuid(),
      farmId: fc.uuid(),
      requesterId: fc.uuid(),
      status: fc.constantFrom<'pending' | 'approved' | 'denied'>(
        'pending',
        'approved',
        'denied',
      ),
      createdAt: fc.date({ min: new Date('2020-01-01'), noInvalidDate: true }),
    })

    it('should return error when pending request exists', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.array(requestArbitrary, { minLength: 1, maxLength: 10 }),
          (requesterId, farmId, existingRequests) => {
            // Add a pending request for this user/farm
            const pendingRequest: AccessRequest = {
              id: fc.sample(fc.uuid(), 1)[0],
              farmId,
              requesterId,
              status: 'pending',
              createdAt: new Date(),
            }

            const requests = [...existingRequests, pendingRequest]
            const error = validateAccessRequest(requesterId, farmId, requests)

            return error !== null && error.includes('pending request')
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return null when no pending request exists', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.array(requestArbitrary, { maxLength: 10 }),
          (requesterId, farmId, existingRequests) => {
            // Filter out any pending requests for this user/farm
            const requests = existingRequests.filter(
              (req) =>
                !(
                  req.requesterId === requesterId &&
                  req.farmId === farmId &&
                  req.status === 'pending'
                ),
            )

            const error = validateAccessRequest(requesterId, farmId, requests)
            return error === null
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should allow request when previous requests are approved or denied', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom<'approved' | 'denied'>('approved', 'denied'),
          (requesterId, farmId, status) => {
            const existingRequest: AccessRequest = {
              id: fc.sample(fc.uuid(), 1)[0],
              farmId,
              requesterId,
              status,
              createdAt: new Date(),
            }

            const error = validateAccessRequest(requesterId, farmId, [
              existingRequest,
            ])
            return error === null
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return error for empty requester or farm ID', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', fc.sample(fc.uuid(), 1)[0]),
          fc.constantFrom('', fc.sample(fc.uuid(), 1)[0]),
          (requesterId, farmId) => {
            fc.pre(requesterId === '' || farmId === '')

            const error = validateAccessRequest(requesterId, farmId, [])
            return error !== null && error.includes('required')
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should always return string or null', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.array(requestArbitrary, { maxLength: 10 }),
          (requesterId, farmId, requests) => {
            const result = validateAccessRequest(requesterId, farmId, requests)
            return result === null || typeof result === 'string'
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Additional property: canRevokeAccess
   */
  describe('Additional: Can revoke access', () => {
    it('should return true only when user is grantor and grant not revoked', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.boolean(),
          (id, farmId, grantedBy, userId, isRevoked) => {
            const grant: AccessGrant = {
              id,
              farmId,
              grantedBy,
              grantedTo: fc.sample(fc.uuid(), 1)[0],
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 86400000),
              revokedAt: isRevoked ? new Date() : null,
            }

            const canRevoke = canRevokeAccess(grant, userId)

            if (userId === grantedBy && !isRevoked) {
              return canRevoke
            }
            return !canRevoke
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
