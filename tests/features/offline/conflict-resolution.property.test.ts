import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  createConflictError,
  extractConflictData,
  hasConflict,
  isConflictResponse,
  mergeForRetry,
  resolveConflict,
} from '~/lib/conflict-resolution'
import {
  extractConflictMetadata,
  isConflictError,
  isNotFoundError,
  shouldClientWin,
} from '~/lib/optimistic-utils'
import { AppError } from '~/lib/errors'

/**
 * Property Tests for Conflict Resolution
 *
 * **Feature: offline-writes-v1**
 *
 * These tests verify the correctness of conflict resolution utilities
 * that enable last-write-wins conflict resolution for offline mutations.
 */
describe('Conflict Resolution - Property Tests', () => {
  // Arbitraries for test data generation
  // Use integer timestamps to avoid NaN date issues
  const validTimestampArb = fc
    .integer({
      min: new Date('2020-01-01').getTime(),
      max: new Date('2030-12-31').getTime(),
    })
    .map((ts) => new Date(ts))

  const timestampArb = validTimestampArb

  const recordArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    quantity: fc.integer({ min: 0, max: 10000 }),
    updatedAt: timestampArb,
  })

  const updateDataArb = fc.record({
    name: fc
      .string({ minLength: 1, maxLength: 100 })
      .map((s) => s || undefined),
    quantity: fc.integer({ min: 0, max: 10000 }).map((n) => n || undefined),
  })

  /**
   * Property 8: Conflict Resolution
   *
   * For any record that exists on both client and server with different
   * `updatedAt` timestamps, when syncing, the record with the later
   * `updatedAt` timestamp SHALL be preserved (last-write-wins).
   *
   * **Validates: Requirements 8.1, 8.2**
   */
  describe('Property 8: Conflict Resolution', () => {
    describe('resolveConflict', () => {
      it('should return client-wins when client timestamp is newer', () => {
        fc.assert(
          fc.property(
            timestampArb,
            fc.integer({ min: 1, max: 1000000 }),
            (serverTime, offsetMs) => {
              // Client time is always newer
              const clientTime = new Date(serverTime.getTime() + offsetMs)

              const result = resolveConflict(serverTime, clientTime)
              expect(result).toBe('client-wins')
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should return server-wins when server timestamp is newer', () => {
        fc.assert(
          fc.property(
            timestampArb,
            fc.integer({ min: 1, max: 1000000 }),
            (clientTime, offsetMs) => {
              // Server time is always newer
              const serverTime = new Date(clientTime.getTime() + offsetMs)

              const result = resolveConflict(serverTime, clientTime)
              expect(result).toBe('server-wins')
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should return server-wins when timestamps are equal (conservative)', () => {
        fc.assert(
          fc.property(timestampArb, (timestamp) => {
            const result = resolveConflict(timestamp, timestamp)
            expect(result).toBe('server-wins')
          }),
          { numRuns: 100 },
        )
      })

      it('should handle string timestamps correctly', () => {
        fc.assert(
          fc.property(
            timestampArb,
            fc.integer({ min: 1, max: 1000000 }),
            (baseTime, offsetMs) => {
              const serverTime = baseTime.toISOString()
              const clientTime = new Date(
                baseTime.getTime() + offsetMs,
              ).toISOString()

              const result = resolveConflict(serverTime, clientTime)
              expect(result).toBe('client-wins')
            },
          ),
          { numRuns: 100 },
        )
      })
    })

    describe('hasConflict', () => {
      it('should detect conflict when server is newer than expected', () => {
        fc.assert(
          fc.property(
            timestampArb,
            fc.integer({ min: 1, max: 1000000 }),
            (clientExpected, offsetMs) => {
              // Server was updated after client's expected version
              const serverUpdatedAt = new Date(
                clientExpected.getTime() + offsetMs,
              )

              const result = hasConflict(serverUpdatedAt, clientExpected)
              expect(result).toBe(true)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should not detect conflict when server matches expected', () => {
        fc.assert(
          fc.property(timestampArb, (timestamp) => {
            const result = hasConflict(timestamp, timestamp)
            expect(result).toBe(false)
          }),
          { numRuns: 100 },
        )
      })

      it('should not detect conflict when server is older than expected', () => {
        fc.assert(
          fc.property(
            timestampArb,
            fc.integer({ min: 1, max: 1000000 }),
            (serverTime, offsetMs) => {
              // Client expected a newer version than server has
              const clientExpected = new Date(serverTime.getTime() + offsetMs)

              const result = hasConflict(serverTime, clientExpected)
              expect(result).toBe(false)
            },
          ),
          { numRuns: 100 },
        )
      })
    })

    describe('shouldClientWin', () => {
      it('should return true when client timestamp is newer', () => {
        fc.assert(
          fc.property(
            timestampArb,
            fc.integer({ min: 1, max: 1000000 }),
            (serverTime, offsetMs) => {
              const clientTime = new Date(serverTime.getTime() + offsetMs)

              const result = shouldClientWin(serverTime, clientTime)
              expect(result).toBe(true)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should return false when server timestamp is newer', () => {
        fc.assert(
          fc.property(
            timestampArb,
            fc.integer({ min: 1, max: 1000000 }),
            (clientTime, offsetMs) => {
              const serverTime = new Date(clientTime.getTime() + offsetMs)

              const result = shouldClientWin(serverTime, clientTime)
              expect(result).toBe(false)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should return false when timestamps are equal', () => {
        fc.assert(
          fc.property(timestampArb, (timestamp) => {
            const result = shouldClientWin(timestamp, timestamp)
            expect(result).toBe(false)
          }),
          { numRuns: 100 },
        )
      })
    })

    describe('createConflictError and extractConflictData', () => {
      it('should create error with both versions and correct resolution', () => {
        fc.assert(
          fc.property(recordArb, recordArb, (serverVersion, clientVersion) => {
            const error = createConflictError(serverVersion, clientVersion)

            expect(error).toBeInstanceOf(AppError)
            expect(error.reason).toBe('CONFLICT')
            expect(error.httpStatus).toBe(409)

            const conflictData = extractConflictData(error)
            expect(conflictData).not.toBeNull()
            expect(conflictData?.serverVersion).toEqual(serverVersion)
            expect(conflictData?.clientVersion).toEqual(clientVersion)

            // Resolution should match the timestamp comparison
            const expectedResolution = resolveConflict(
              serverVersion.updatedAt,
              clientVersion.updatedAt,
            )
            expect(conflictData?.resolution).toBe(expectedResolution)
          }),
          { numRuns: 100 },
        )
      })

      it('should return null for non-conflict errors', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(
              'BATCH_NOT_FOUND',
              'VALIDATION_ERROR',
              'DATABASE_ERROR',
              'ACCESS_DENIED',
            ),
            (reason) => {
              const error = new AppError(reason)
              const conflictData = extractConflictData(error)
              expect(conflictData).toBeNull()
            },
          ),
          { numRuns: 20 },
        )
      })
    })

    describe('mergeForRetry', () => {
      it('should preserve client updates over server values', () => {
        fc.assert(
          fc.property(
            recordArb,
            updateDataArb,
            (serverVersion, clientUpdates) => {
              const merged = mergeForRetry(serverVersion, clientUpdates)

              // Client updates should override server values
              if (clientUpdates.name !== undefined) {
                expect(merged.name).toBe(clientUpdates.name)
              }
              if (clientUpdates.quantity !== undefined) {
                expect(merged.quantity).toBe(clientUpdates.quantity)
              }

              // Server values should be preserved for non-updated fields
              expect(merged.id).toBe(serverVersion.id)
              expect(merged.updatedAt).toBe(serverVersion.updatedAt)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should preserve all server fields when no client updates', () => {
        fc.assert(
          fc.property(recordArb, (serverVersion) => {
            const merged = mergeForRetry(serverVersion, {})

            expect(merged).toEqual(serverVersion)
          }),
          { numRuns: 100 },
        )
      })
    })

    describe('isConflictResponse', () => {
      it('should return true for valid conflict responses', () => {
        fc.assert(
          fc.property(
            recordArb,
            recordArb,
            fc.constantFrom('server-wins', 'client-wins'),
            (serverVersion, clientVersion, resolution) => {
              const response = {
                reason: 'CONFLICT' as const,
                httpStatus: 409 as const,
                serverVersion,
                clientVersion,
                resolution,
              }

              expect(isConflictResponse(response)).toBe(true)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should return false for non-conflict responses', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(null),
              fc.constant(undefined),
              fc.string(),
              fc.integer(),
              fc.record({
                reason: fc.string().filter((s) => s !== 'CONFLICT'),
              }),
              fc.record({ httpStatus: fc.integer().filter((n) => n !== 409) }),
            ),
            (response) => {
              expect(isConflictResponse(response)).toBe(false)
            },
          ),
          { numRuns: 100 },
        )
      })
    })
  })

  /**
   * Error Detection Tests
   *
   * Tests for isConflictError and isNotFoundError utilities
   */
  describe('Error Detection', () => {
    describe('isConflictError', () => {
      it('should return true for AppError with CONFLICT reason', () => {
        const error = new AppError('CONFLICT')
        expect(isConflictError(error)).toBe(true)
      })

      it('should return false for other AppError reasons', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(
              'BATCH_NOT_FOUND',
              'VALIDATION_ERROR',
              'DATABASE_ERROR',
              'ACCESS_DENIED',
            ),
            (reason) => {
              const error = new AppError(reason)
              expect(isConflictError(error)).toBe(false)
            },
          ),
          { numRuns: 20 },
        )
      })

      it('should return false for non-Error values', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(null),
              fc.constant(undefined),
              fc.string(),
              fc.integer(),
              fc.record({}),
            ),
            (value) => {
              expect(isConflictError(value)).toBe(false)
            },
          ),
          { numRuns: 50 },
        )
      })
    })

    describe('isNotFoundError', () => {
      it('should return true for AppError with NOT_FOUND category', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(
              'BATCH_NOT_FOUND',
              'CUSTOMER_NOT_FOUND',
              'SUPPLIER_NOT_FOUND',
              'SALE_NOT_FOUND',
              'NOT_FOUND',
            ),
            (reason) => {
              const error = new AppError(reason)
              expect(isNotFoundError(error)).toBe(true)
            },
          ),
          { numRuns: 20 },
        )
      })

      it('should return false for non-404 errors', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(
              'CONFLICT',
              'VALIDATION_ERROR',
              'DATABASE_ERROR',
              'ACCESS_DENIED',
            ),
            (reason) => {
              const error = new AppError(reason)
              expect(isNotFoundError(error)).toBe(false)
            },
          ),
          { numRuns: 20 },
        )
      })
    })

    describe('extractConflictMetadata', () => {
      it('should extract metadata from conflict errors', () => {
        fc.assert(
          fc.property(recordArb, recordArb, (serverVersion, clientVersion) => {
            const error = createConflictError(serverVersion, clientVersion)
            const metadata = extractConflictMetadata(error)

            expect(metadata).not.toBeNull()
            expect(metadata?.serverVersion).toEqual(serverVersion)
            expect(metadata?.clientVersion).toEqual(clientVersion)
          }),
          { numRuns: 100 },
        )
      })

      it('should return null for errors without conflict metadata', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(
              'BATCH_NOT_FOUND',
              'VALIDATION_ERROR',
              'DATABASE_ERROR',
            ),
            (reason) => {
              const error = new AppError(reason)
              const metadata = extractConflictMetadata(error)
              expect(metadata).toBeNull()
            },
          ),
          { numRuns: 20 },
        )
      })
    })
  })

  /**
   * Last-Write-Wins Invariant
   *
   * The core property: given any two versions with different timestamps,
   * the version with the later timestamp should always win.
   */
  describe('Last-Write-Wins Invariant', () => {
    it('should always select the version with the later timestamp', () => {
      fc.assert(
        fc.property(recordArb, recordArb, (version1, version2) => {
          const resolution = resolveConflict(
            version1.updatedAt,
            version2.updatedAt,
          )

          const time1 = new Date(version1.updatedAt).getTime()
          const time2 = new Date(version2.updatedAt).getTime()

          if (time2 > time1) {
            expect(resolution).toBe('client-wins')
          } else {
            // Server wins when equal or newer
            expect(resolution).toBe('server-wins')
          }
        }),
        { numRuns: 100 },
      )
    })

    it('should be consistent across multiple comparisons', () => {
      fc.assert(
        fc.property(timestampArb, timestampArb, (time1, time2) => {
          // Compare in both directions
          const result1 = resolveConflict(time1, time2)
          const result2 = resolveConflict(time2, time1)

          // Results should be opposite (unless equal)
          const t1 = time1.getTime()
          const t2 = time2.getTime()

          if (t1 === t2) {
            // Both should be server-wins when equal
            expect(result1).toBe('server-wins')
            expect(result2).toBe('server-wins')
          } else if (t1 > t2) {
            // time1 is newer
            expect(result1).toBe('server-wins') // time1 is server, time2 is client
            expect(result2).toBe('client-wins') // time2 is server, time1 is client
          } else {
            // time2 is newer
            expect(result1).toBe('client-wins') // time1 is server, time2 is client
            expect(result2).toBe('server-wins') // time2 is server, time1 is client
          }
        }),
        { numRuns: 100 },
      )
    })
  })
})
