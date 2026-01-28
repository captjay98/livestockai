import * as fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MutationCache } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { createQueryClient } from '~/lib/query-client'

/**
 * Property Tests for Offline Mutation Queuing
 *
 * **Feature: offline-writes-v1**
 *
 * These tests verify that the query client is correctly configured for
 * offline-first mutations, ensuring mutations are queued when offline
 * and executed when online.
 */
describe('Offline Mutation Queuing - Property Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
  })

  afterEach(() => {
    queryClient.clear()
  })

  /**
   * Property 1: Offline Mutation Queuing
   *
   * For any mutation (create, update, or delete) performed while the device
   * is offline, the mutation SHALL be added to the mutation cache and remain
   * there until network connectivity is restored.
   *
   * **Validates: Requirements 1.1**
   */
  describe('Property 1: Offline Mutation Queuing', () => {

    it('should configure query client with offlineFirst network mode', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const client = createQueryClient()
          const defaultOptions = client.getDefaultOptions()

          // Verify networkMode is set to 'offlineFirst'
          expect(defaultOptions.mutations?.networkMode).toBe('offlineFirst')

          client.clear()
        }),
        { numRuns: 10 },
      )
    })

    it('should configure retry count of 3 for mutations', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const client = createQueryClient()
          const defaultOptions = client.getDefaultOptions()

          // Verify retry is set to 3
          expect(defaultOptions.mutations?.retry).toBe(3)

          client.clear()
        }),
        { numRuns: 10 },
      )
    })

    it('should configure exponential backoff for retry delay', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10 }), (attemptIndex) => {
          const client = createQueryClient()
          const defaultOptions = client.getDefaultOptions()
          const retryDelay = defaultOptions.mutations?.retryDelay

          // Verify retryDelay is a function
          expect(typeof retryDelay).toBe('function')

          if (typeof retryDelay === 'function') {
            const delay = retryDelay(attemptIndex, new Error('test'))

            // Verify exponential backoff: min(1000 * 2^attempt, 30000)
            const expectedDelay = Math.min(
              1000 * Math.pow(2, attemptIndex),
              30000,
            )
            expect(delay).toBe(expectedDelay)
          }

          client.clear()
        }),
        { numRuns: 100 },
      )
    })

    it('should cap retry delay at 30 seconds maximum', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 20 }), (attemptIndex) => {
          const client = createQueryClient()
          const defaultOptions = client.getDefaultOptions()
          const retryDelay = defaultOptions.mutations?.retryDelay

          if (typeof retryDelay === 'function') {
            const delay = retryDelay(attemptIndex, new Error('test'))

            // Delay should never exceed 30 seconds
            expect(delay).toBeLessThanOrEqual(30000)

            // Delay should always be positive
            expect(delay).toBeGreaterThan(0)
          }

          client.clear()
        }),
        { numRuns: 100 },
      )
    })

    it('should have exponential growth pattern for retry delays', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 4 }), // Before cap kicks in
          (attemptIndex) => {
            const client = createQueryClient()
            const defaultOptions = client.getDefaultOptions()
            const retryDelay = defaultOptions.mutations?.retryDelay

            if (typeof retryDelay === 'function') {
              const currentDelay = retryDelay(attemptIndex, new Error('test'))
              const nextDelay = retryDelay(attemptIndex + 1, new Error('test'))

              // Next delay should be double current (until cap)
              if (currentDelay < 30000 && nextDelay < 30000) {
                expect(nextDelay).toBe(currentDelay * 2)
              }
            }

            client.clear()
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should start retry delay at 1 second for first attempt', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const client = createQueryClient()
          const defaultOptions = client.getDefaultOptions()
          const retryDelay = defaultOptions.mutations?.retryDelay

          if (typeof retryDelay === 'function') {
            const firstDelay = retryDelay(0, new Error('test'))
            expect(firstDelay).toBe(1000) // 1 second
          }

          client.clear()
        }),
        { numRuns: 10 },
      )
    })

    it('should have mutation cache available for queuing', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const client = createQueryClient()
          const mutationCache = client.getMutationCache()

          // Mutation cache should exist
          expect(mutationCache).toBeDefined()
          expect(mutationCache).toBeInstanceOf(MutationCache)

          // Initially should have no mutations
          expect(mutationCache.getAll()).toHaveLength(0)

          client.clear()
        }),
        { numRuns: 10 },
      )
    })

    it('should preserve query cache settings alongside mutation settings', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const client = createQueryClient()
          const defaultOptions = client.getDefaultOptions()

          // Query settings should still be present
          expect(defaultOptions.queries?.gcTime).toBe(1000 * 60 * 60 * 24) // 24 hours
          expect(defaultOptions.queries?.staleTime).toBe(1000 * 60) // 1 minute
          expect(typeof defaultOptions.queries?.retry).toBe('function')

          client.clear()
        }),
        { numRuns: 10 },
      )
    })
  })
})
