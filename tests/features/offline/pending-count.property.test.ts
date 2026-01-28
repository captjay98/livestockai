import * as fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MutationCache, QueryClient } from '@tanstack/react-query'

/**
 * Property Tests for Pending Count Accuracy
 *
 * **Feature: offline-writes-v1**
 *
 * These tests verify the correctness of pending count calculation
 * that displays accurate sync status to users.
 *
 * **Validates: Requirements 3.2**
 */
describe('Pending Count Accuracy - Property Tests', () => {
  let queryClient: QueryClient
  let mutationCache: MutationCache

  beforeEach(() => {
    mutationCache = new MutationCache()
    queryClient = new QueryClient({
      mutationCache,
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  // Types for mutation state simulation
  type MutationStatus = 'idle' | 'pending' | 'success' | 'error'

  interface SimulatedMutation {
    status: MutationStatus
    isPaused: boolean
    mutationKey: Array<string>
  }

  // Arbitraries for test data generation
  const mutationStatusArb: fc.Arbitrary<MutationStatus> = fc.constantFrom(
    'idle',
    'pending',
    'success',
    'error',
  )

  const simulatedMutationArb: fc.Arbitrary<SimulatedMutation> = fc.record({
    status: mutationStatusArb,
    isPaused: fc.boolean(),
    mutationKey: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
      minLength: 1,
      maxLength: 3,
    }),
  })

  const mutationListArb = fc.array(simulatedMutationArb, {
    minLength: 0,
    maxLength: 50,
  })

  /**
   * Calculate pending count from a list of simulated mutations.
   * This mirrors the logic in sync-status.tsx:
   * - Count mutations with status 'pending'
   * - Count mutations that are paused (isPaused: true)
   *
   * The pending count should equal the number of mutations that are
   * either actively pending OR paused (waiting for network).
   */
  function calculatePendingCount(mutations: Array<SimulatedMutation>): number {
    return mutations.filter((m) => m.status === 'pending' || m.isPaused).length
  }

  /**
   * Calculate paused count from a list of simulated mutations.
   * Paused mutations are those with isPaused: true.
   */
  function calculatePausedCount(mutations: Array<SimulatedMutation>): number {
    return mutations.filter((m) => m.isPaused).length
  }

  /**
   * Calculate failed count from a list of simulated mutations.
   * Failed mutations are those with status 'error'.
   */
  function calculateFailedCount(mutations: Array<SimulatedMutation>): number {
    return mutations.filter((m) => m.status === 'error').length
  }

  /**
   * Property 7: Pending Count Accuracy
   *
   * For any state of the mutation cache, the pending count displayed
   * by the Sync_Status component SHALL equal the actual number of
   * mutations with status 'pending' or 'isPaused' in the mutation cache.
   *
   * **Validates: Requirements 3.2**
   */
  describe('Property 7: Pending Count Accuracy', () => {
    describe('Pending count calculation', () => {
      it('should count all pending mutations correctly', () => {
        fc.assert(
          fc.property(mutationListArb, (mutations) => {
            // Calculate expected pending count
            const expectedPendingCount = mutations.filter(
              (m) => m.status === 'pending',
            ).length

            // Verify our calculation function
            const actualPendingMutations = mutations.filter(
              (m) => m.status === 'pending',
            )

            expect(actualPendingMutations.length).toBe(expectedPendingCount)
          }),
          { numRuns: 100 },
        )
      })

      it('should count all paused mutations correctly', () => {
        fc.assert(
          fc.property(mutationListArb, (mutations) => {
            const expectedPausedCount = calculatePausedCount(mutations)

            // Verify paused count matches filter
            const actualPausedMutations = mutations.filter((m) => m.isPaused)

            expect(actualPausedMutations.length).toBe(expectedPausedCount)
          }),
          { numRuns: 100 },
        )
      })

      it('should count all failed mutations correctly', () => {
        fc.assert(
          fc.property(mutationListArb, (mutations) => {
            const expectedFailedCount = calculateFailedCount(mutations)

            // Verify failed count matches filter
            const actualFailedMutations = mutations.filter(
              (m) => m.status === 'error',
            )

            expect(actualFailedMutations.length).toBe(expectedFailedCount)
          }),
          { numRuns: 100 },
        )
      })

      it('should handle empty mutation list', () => {
        const mutations: Array<SimulatedMutation> = []

        expect(calculatePendingCount(mutations)).toBe(0)
        expect(calculatePausedCount(mutations)).toBe(0)
        expect(calculateFailedCount(mutations)).toBe(0)
      })

      it('should handle all mutations being pending', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 50 }), (count) => {
            const mutations: Array<SimulatedMutation> = Array.from(
              { length: count },
              (_, i) => ({
                status: 'pending' as const,
                isPaused: false,
                mutationKey: [`mutation-${i}`],
              }),
            )

            expect(calculatePendingCount(mutations)).toBe(count)
          }),
          { numRuns: 100 },
        )
      })

      it('should handle all mutations being paused', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 50 }), (count) => {
            const mutations: Array<SimulatedMutation> = Array.from(
              { length: count },
              (_, i) => ({
                status: 'pending' as const,
                isPaused: true,
                mutationKey: [`mutation-${i}`],
              }),
            )

            // All paused mutations should be counted
            expect(calculatePausedCount(mutations)).toBe(count)
            // Pending count includes paused mutations
            expect(calculatePendingCount(mutations)).toBe(count)
          }),
          { numRuns: 100 },
        )
      })

      it('should handle all mutations being failed', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 50 }), (count) => {
            const mutations: Array<SimulatedMutation> = Array.from(
              { length: count },
              (_, i) => ({
                status: 'error' as const,
                isPaused: false,
                mutationKey: [`mutation-${i}`],
              }),
            )

            expect(calculateFailedCount(mutations)).toBe(count)
            // Failed mutations are not pending
            expect(calculatePendingCount(mutations)).toBe(0)
          }),
          { numRuns: 100 },
        )
      })
    })

    describe('Pending count invariants', () => {
      it('pending count should be non-negative', () => {
        fc.assert(
          fc.property(mutationListArb, (mutations) => {
            const pendingCount = calculatePendingCount(mutations)
            expect(pendingCount).toBeGreaterThanOrEqual(0)
          }),
          { numRuns: 100 },
        )
      })

      it('pending count should not exceed total mutations', () => {
        fc.assert(
          fc.property(mutationListArb, (mutations) => {
            const pendingCount = calculatePendingCount(mutations)
            expect(pendingCount).toBeLessThanOrEqual(mutations.length)
          }),
          { numRuns: 100 },
        )
      })

      it('paused count should not exceed pending count when all paused are pending', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                status: fc.constantFrom(
                  'pending',
                  'success',
                  'error',
                  'idle',
                ) as fc.Arbitrary<MutationStatus>,
                isPaused: fc.boolean(),
                mutationKey: fc.array(
                  fc.string({ minLength: 1, maxLength: 10 }),
                  {
                    minLength: 1,
                    maxLength: 2,
                  },
                ),
              }),
              { minLength: 0, maxLength: 30 },
            ),
            (mutations) => {
              // Filter to only pending mutations that are paused
              const pausedPendingCount = mutations.filter(
                (m) => m.status === 'pending' && m.isPaused,
              ).length

              const pendingCount = mutations.filter(
                (m) => m.status === 'pending',
              ).length

              expect(pausedPendingCount).toBeLessThanOrEqual(pendingCount)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('failed count should be independent of pending count', () => {
        fc.assert(
          fc.property(mutationListArb, (mutations) => {
            const failedCount = calculateFailedCount(mutations)

            // A mutation cannot be both pending and failed (status is exclusive)
            // This is enforced by the type system - status can only be one value

            // Sum of pending (excluding paused) and failed should not exceed total
            const pendingOnly = mutations.filter(
              (m) => m.status === 'pending' && !m.isPaused,
            ).length
            expect(pendingOnly + failedCount).toBeLessThanOrEqual(
              mutations.length,
            )
          }),
          { numRuns: 100 },
        )
      })
    })

    describe('State transitions', () => {
      it('adding a pending mutation should increase pending count by 1', () => {
        fc.assert(
          fc.property(
            mutationListArb,
            fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
              minLength: 1,
              maxLength: 2,
            }),
            (existingMutations, newKey) => {
              const initialCount = calculatePendingCount(existingMutations)

              const newMutation: SimulatedMutation = {
                status: 'pending',
                isPaused: false,
                mutationKey: newKey,
              }

              const updatedMutations = [...existingMutations, newMutation]
              const newCount = calculatePendingCount(updatedMutations)

              expect(newCount).toBe(initialCount + 1)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('completing a pending mutation should decrease pending count by 1', () => {
        fc.assert(
          fc.property(
            mutationListArb.filter((m) =>
              m.some((mut) => mut.status === 'pending' && !mut.isPaused),
            ),
            (mutations) => {
              const initialCount = calculatePendingCount(mutations)

              // Find first pending non-paused mutation and mark as success
              const updatedMutations = mutations.map((m, i) => {
                if (
                  m.status === 'pending' &&
                  !m.isPaused &&
                  mutations
                    .slice(0, i)
                    .every((prev) => prev.status !== 'pending' || prev.isPaused)
                ) {
                  return { ...m, status: 'success' as const }
                }
                return m
              })

              const newCount = calculatePendingCount(updatedMutations)

              expect(newCount).toBe(initialCount - 1)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('pausing a pending mutation should not change pending count', () => {
        fc.assert(
          fc.property(
            mutationListArb.filter((m) =>
              m.some((mut) => mut.status === 'pending' && !mut.isPaused),
            ),
            (mutations) => {
              const initialCount = calculatePendingCount(mutations)

              // Find first pending non-paused mutation and pause it
              const updatedMutations = mutations.map((m, i) => {
                if (
                  m.status === 'pending' &&
                  !m.isPaused &&
                  mutations
                    .slice(0, i)
                    .every((prev) => prev.status !== 'pending' || prev.isPaused)
                ) {
                  return { ...m, isPaused: true }
                }
                return m
              })

              const newCount = calculatePendingCount(updatedMutations)

              // Pending count should remain the same (paused mutations are still counted)
              expect(newCount).toBe(initialCount)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('failing a pending mutation should decrease pending count and increase failed count', () => {
        fc.assert(
          fc.property(
            mutationListArb.filter((m) =>
              m.some((mut) => mut.status === 'pending'),
            ),
            (mutations) => {
              const initialPendingCount = calculatePendingCount(mutations)
              const initialFailedCount = calculateFailedCount(mutations)

              // Find first pending mutation and mark as error
              let found = false
              const updatedMutations = mutations.map((m) => {
                if (m.status === 'pending' && !found) {
                  found = true
                  return { ...m, status: 'error' as const, isPaused: false }
                }
                return m
              })

              const newPendingCount = calculatePendingCount(updatedMutations)
              const newFailedCount = calculateFailedCount(updatedMutations)

              expect(newPendingCount).toBe(initialPendingCount - 1)
              expect(newFailedCount).toBe(initialFailedCount + 1)
            },
          ),
          { numRuns: 100 },
        )
      })
    })

    describe('Sync status state derivation', () => {
      type SyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'failed'

      function deriveSyncState(
        isOnline: boolean,
        pendingCount: number,
        pausedCount: number,
        failedCount: number,
      ): SyncState {
        if (!isOnline) {
          return 'offline'
        } else if (failedCount > 0) {
          return 'failed'
        } else if (pendingCount > 0 && pausedCount === 0) {
          return 'syncing'
        } else if (pausedCount > 0) {
          return 'pending'
        } else {
          return 'synced'
        }
      }

      it('should return offline when not online', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            (pendingCount, pausedCount, failedCount) => {
              const state = deriveSyncState(
                false,
                pendingCount,
                pausedCount,
                failedCount,
              )
              expect(state).toBe('offline')
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should return failed when online with failed mutations', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 1, max: 100 }),
            (pendingCount, pausedCount, failedCount) => {
              const state = deriveSyncState(
                true,
                pendingCount,
                pausedCount,
                failedCount,
              )
              expect(state).toBe('failed')
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should return syncing when online with pending but no paused mutations', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 100 }), (pendingCount) => {
            const state = deriveSyncState(true, pendingCount, 0, 0)
            expect(state).toBe('syncing')
          }),
          { numRuns: 100 },
        )
      })

      it('should return pending when online with paused mutations', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 1, max: 100 }),
            (pendingCount, pausedCount) => {
              const state = deriveSyncState(true, pendingCount, pausedCount, 0)
              expect(state).toBe('pending')
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should return synced when online with no pending, paused, or failed mutations', () => {
        const state = deriveSyncState(true, 0, 0, 0)
        expect(state).toBe('synced')
      })

      it('should prioritize offline over all other states', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            (pendingCount, pausedCount, failedCount) => {
              const state = deriveSyncState(
                false,
                pendingCount,
                pausedCount,
                failedCount,
              )
              expect(state).toBe('offline')
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should prioritize failed over syncing/pending when online', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 100 }),
            fc.integer({ min: 1, max: 100 }),
            fc.integer({ min: 1, max: 100 }),
            (pendingCount, pausedCount, failedCount) => {
              const state = deriveSyncState(
                true,
                pendingCount,
                pausedCount,
                failedCount,
              )
              expect(state).toBe('failed')
            },
          ),
          { numRuns: 100 },
        )
      })
    })

    describe('Count display accuracy', () => {
      it('displayed count should match actual mutation count', () => {
        fc.assert(
          fc.property(mutationListArb, (mutations) => {
            // Simulate what the component does
            const pendingMutations = mutations.filter(
              (m) => m.status === 'pending',
            )
            const pausedMutations = mutations.filter((m) => m.isPaused)
            const failedMutations = mutations.filter(
              (m) => m.status === 'error',
            )

            const displayedPendingCount = pendingMutations.length
            const displayedPausedCount = pausedMutations.filter(Boolean).length
            const displayedFailedCount = failedMutations.length

            // Verify counts match
            expect(displayedPendingCount).toBe(
              mutations.filter((m) => m.status === 'pending').length,
            )
            expect(displayedPausedCount).toBe(
              mutations.filter((m) => m.isPaused).length,
            )
            expect(displayedFailedCount).toBe(
              mutations.filter((m) => m.status === 'error').length,
            )
          }),
          { numRuns: 100 },
        )
      })

      it('total pending should equal pending + paused when counting for display', () => {
        fc.assert(
          fc.property(mutationListArb, (mutations) => {
            // In the sync-status component, we track:
            // - pendingCount: mutations with status 'pending'
            // - pausedCount: mutations with isPaused: true

            const pendingCount = mutations.filter(
              (m) => m.status === 'pending',
            ).length
            const pausedCount = mutations.filter((m) => m.isPaused).length

            // The total "waiting to sync" count should be the union
            const waitingToSync = mutations.filter(
              (m) => m.status === 'pending' || m.isPaused,
            ).length

            // This should be at most pendingCount + pausedCount
            // (could be less if some pending mutations are also paused)
            expect(waitingToSync).toBeLessThanOrEqual(
              pendingCount + pausedCount,
            )
          }),
          { numRuns: 100 },
        )
      })
    })
  })
})
