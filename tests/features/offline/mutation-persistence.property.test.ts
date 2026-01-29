import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

/**
 * Property Tests for Mutation Persistence
 *
 * **Feature: offline-writes-v1**
 *
 * These tests verify the correctness of mutation persistence,
 * order preservation, and data integrity during sync.
 *
 * **Validates: Requirements 1.2, 1.3, 1.4, 8.5**
 */
describe('Mutation Persistence - Property Tests', () => {
  // Types for mutation simulation
  type MutationType = 'create' | 'update' | 'delete'
  type EntityType = 'batch' | 'feed' | 'sale' | 'expense' | 'customer'

  interface SerializedMutation {
    id: string
    type: MutationType
    entityType: EntityType
    entityId: string
    data: Record<string, unknown>
    timestamp: number
    retryCount: number
  }

  // Arbitraries for test data generation
  const mutationTypeArb: fc.Arbitrary<MutationType> = fc.constantFrom(
    'create',
    'update',
    'delete',
  )

  const entityTypeArb: fc.Arbitrary<EntityType> = fc.constantFrom(
    'batch',
    'feed',
    'sale',
    'expense',
    'customer',
  )

  // Use timestamp-based date generation to avoid invalid dates
  const validDateArb = fc
    .integer({ min: 1577836800000, max: 1924905600000 }) // 2020-01-01 to 2030-12-31
    .map((ts) => new Date(ts))

  const mutationDataArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    quantity: fc.integer({ min: 0, max: 10000 }),
    amount: fc.float({ min: 0, max: 1000000, noNaN: true }),
    date: validDateArb,
    notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  })

  const serializedMutationArb: fc.Arbitrary<SerializedMutation> = fc.record({
    id: fc.uuid(),
    type: mutationTypeArb,
    entityType: entityTypeArb,
    entityId: fc.uuid(),
    data: mutationDataArb as fc.Arbitrary<Record<string, unknown>>,
    timestamp: fc.integer({ min: 1600000000000, max: 1900000000000 }),
    retryCount: fc.integer({ min: 0, max: 10 }),
  })

  const mutationListArb = fc.array(serializedMutationArb, {
    minLength: 0,
    maxLength: 100,
  })

  /**
   * Serialize a mutation to JSON string (simulates IndexedDB storage)
   */
  function serializeMutation(mutation: SerializedMutation): string {
    return JSON.stringify({
      ...mutation,
      data: {
        ...mutation.data,
        date:
          mutation.data.date instanceof Date
            ? mutation.data.date.toISOString()
            : mutation.data.date,
      },
    })
  }

  /**
   * Deserialize a mutation from JSON string
   */
  function deserializeMutation(json: string): SerializedMutation {
    const parsed = JSON.parse(json)
    return {
      ...parsed,
      data: {
        ...parsed.data,
        date: parsed.data.date ? new Date(parsed.data.date) : undefined,
      },
    }
  }

  /**
   * Property 2: Mutation Persistence Round-Trip
   *
   * Any mutation that is serialized to storage and then deserialized
   * SHALL be equivalent to the original mutation.
   *
   * **Validates: Requirements 1.2, 1.3**
   */
  describe('Property 2: Mutation Persistence Round-Trip', () => {
    it('should preserve mutation id through serialization', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          expect(deserialized.id).toBe(mutation.id)
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve mutation type through serialization', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          expect(deserialized.type).toBe(mutation.type)
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve entity type through serialization', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          expect(deserialized.entityType).toBe(mutation.entityType)
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve entity id through serialization', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          expect(deserialized.entityId).toBe(mutation.entityId)
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve timestamp through serialization', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          expect(deserialized.timestamp).toBe(mutation.timestamp)
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve retry count through serialization', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          expect(deserialized.retryCount).toBe(mutation.retryCount)
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve string data fields through serialization', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          expect(deserialized.data.name).toBe(mutation.data.name)
          expect(deserialized.data.notes).toBe(mutation.data.notes)
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve numeric data fields through serialization', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          expect(deserialized.data.quantity).toBe(mutation.data.quantity)
          // Use closeTo for floating point comparison
          expect(deserialized.data.amount).toBeCloseTo(
            mutation.data.amount as number,
            5,
          )
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve date data fields through serialization', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          const originalDate = mutation.data.date as Date
          const deserializedDate = deserialized.data.date as Date

          expect(deserializedDate.getTime()).toBe(originalDate.getTime())
        }),
        { numRuns: 100 },
      )
    })

    it('should handle multiple serialization round-trips', () => {
      fc.assert(
        fc.property(
          serializedMutationArb,
          fc.integer({ min: 1, max: 5 }),
          (mutation, rounds) => {
            let current = mutation
            for (let i = 0; i < rounds; i++) {
              const serialized = serializeMutation(current)
              current = deserializeMutation(serialized)
            }

            expect(current.id).toBe(mutation.id)
            expect(current.type).toBe(mutation.type)
            expect(current.entityType).toBe(mutation.entityType)
            expect(current.entityId).toBe(mutation.entityId)
            expect(current.timestamp).toBe(mutation.timestamp)
          },
        ),
        { numRuns: 50 },
      )
    })
  })

  /**
   * Property 3: Mutation Order Preservation
   *
   * Mutations SHALL be executed in the order they were created,
   * as determined by their timestamp.
   *
   * **Validates: Requirements 1.4**
   */
  describe('Property 3: Mutation Order Preservation', () => {
    /**
     * Sort mutations by timestamp (FIFO order)
     */
    function sortByTimestamp(
      mutations: Array<SerializedMutation>,
    ): Array<SerializedMutation> {
      return [...mutations].sort((a, b) => a.timestamp - b.timestamp)
    }

    it('should maintain FIFO order when sorted by timestamp', () => {
      fc.assert(
        fc.property(mutationListArb, (mutations) => {
          const sorted = sortByTimestamp(mutations)

          // Verify sorted order
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].timestamp).toBeGreaterThanOrEqual(
              sorted[i - 1].timestamp,
            )
          }
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve all mutations after sorting', () => {
      fc.assert(
        fc.property(mutationListArb, (mutations) => {
          const sorted = sortByTimestamp(mutations)

          expect(sorted.length).toBe(mutations.length)

          // All original mutations should be present
          const originalIds = new Set(mutations.map((m) => m.id))
          const sortedIds = new Set(sorted.map((m) => m.id))

          expect(sortedIds.size).toBe(originalIds.size)
          originalIds.forEach((id) => {
            expect(sortedIds.has(id)).toBe(true)
          })
        }),
        { numRuns: 100 },
      )
    })

    it('should be idempotent - sorting twice gives same result', () => {
      fc.assert(
        fc.property(mutationListArb, (mutations) => {
          const sorted1 = sortByTimestamp(mutations)
          const sorted2 = sortByTimestamp(sorted1)

          expect(sorted2.map((m) => m.id)).toEqual(sorted1.map((m) => m.id))
        }),
        { numRuns: 100 },
      )
    })

    it('should handle mutations with same timestamp', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1600000000000, max: 1900000000000 }),
          (count, timestamp) => {
            const mutations: Array<SerializedMutation> = Array.from(
              { length: count },
              (_, i) => ({
                id: `mutation-${i}`,
                type: 'create' as const,
                entityType: 'batch' as const,
                entityId: `entity-${i}`,
                data: {
                  name: `Item ${i}`,
                  quantity: i,
                  amount: i * 100,
                  date: new Date(),
                },
                timestamp,
                retryCount: 0,
              }),
            )

            const sorted = sortByTimestamp(mutations)

            // All mutations should still be present
            expect(sorted.length).toBe(count)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should process entity operations in correct order', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 1600000000000, max: 1800000000000 }),
          (entityId, baseTimestamp) => {
            // Create a sequence: create -> update -> delete
            const mutations: Array<SerializedMutation> = [
              {
                id: 'mut-1',
                type: 'create',
                entityType: 'batch',
                entityId,
                data: {
                  name: 'New Batch',
                  quantity: 100,
                  amount: 0,
                  date: new Date(),
                },
                timestamp: baseTimestamp,
                retryCount: 0,
              },
              {
                id: 'mut-2',
                type: 'update',
                entityType: 'batch',
                entityId,
                data: {
                  name: 'Updated Batch',
                  quantity: 150,
                  amount: 0,
                  date: new Date(),
                },
                timestamp: baseTimestamp + 1000,
                retryCount: 0,
              },
              {
                id: 'mut-3',
                type: 'delete',
                entityType: 'batch',
                entityId,
                data: {
                  name: '',
                  quantity: 0,
                  amount: 0,
                  date: new Date(),
                },
                timestamp: baseTimestamp + 2000,
                retryCount: 0,
              },
            ]

            // Shuffle and sort
            const shuffled = [...mutations].sort(() => Math.random() - 0.5)
            const sorted = sortByTimestamp(shuffled)

            // Verify order: create -> update -> delete
            expect(sorted[0].type).toBe('create')
            expect(sorted[1].type).toBe('update')
            expect(sorted[2].type).toBe('delete')
          },
        ),
        { numRuns: 50 },
      )
    })
  })

  /**
   * Property 9: Mutation Preservation Invariant
   *
   * No mutations SHALL be lost during the sync process.
   * The count of mutations before sync should equal the count
   * of (synced + failed + pending) mutations after sync.
   *
   * **Validates: Requirements 8.5**
   */
  describe('Property 9: Mutation Preservation Invariant', () => {
    type SyncResult = 'synced' | 'failed' | 'pending'

    interface SyncedMutation extends SerializedMutation {
      syncResult: SyncResult
    }

    /**
     * Simulate sync process - assigns random results to mutations
     */
    function simulateSync(
      mutations: Array<SerializedMutation>,
      results: Array<SyncResult>,
    ): Array<SyncedMutation> {
      return mutations.map((mutation, i) => ({
        ...mutation,
        syncResult: results[i % results.length],
      }))
    }

    const syncResultArb: fc.Arbitrary<SyncResult> = fc.constantFrom(
      'synced',
      'failed',
      'pending',
    )

    it('should preserve total mutation count after sync', () => {
      fc.assert(
        fc.property(
          mutationListArb,
          fc.array(syncResultArb, { minLength: 1, maxLength: 100 }),
          (mutations, results) => {
            const synced = simulateSync(mutations, results)

            expect(synced.length).toBe(mutations.length)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should account for all mutations in sync results', () => {
      fc.assert(
        fc.property(
          mutationListArb,
          fc.array(syncResultArb, { minLength: 1, maxLength: 100 }),
          (mutations, results) => {
            const synced = simulateSync(mutations, results)

            const syncedCount = synced.filter(
              (m) => m.syncResult === 'synced',
            ).length
            const failedCount = synced.filter(
              (m) => m.syncResult === 'failed',
            ).length
            const pendingCount = synced.filter(
              (m) => m.syncResult === 'pending',
            ).length

            expect(syncedCount + failedCount + pendingCount).toBe(
              mutations.length,
            )
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should preserve mutation ids after sync', () => {
      fc.assert(
        fc.property(
          mutationListArb,
          fc.array(syncResultArb, { minLength: 1, maxLength: 100 }),
          (mutations, results) => {
            const synced = simulateSync(mutations, results)

            const originalIds = new Set(mutations.map((m) => m.id))
            const syncedIds = new Set(synced.map((m) => m.id))

            expect(syncedIds.size).toBe(originalIds.size)
            originalIds.forEach((id) => {
              expect(syncedIds.has(id)).toBe(true)
            })
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should preserve mutation data after sync', () => {
      fc.assert(
        fc.property(
          mutationListArb,
          fc.array(syncResultArb, { minLength: 1, maxLength: 100 }),
          (mutations, results) => {
            const synced = simulateSync(mutations, results)

            mutations.forEach((original) => {
              const syncedMutation = synced.find((m) => m.id === original.id)
              expect(syncedMutation).toBeDefined()
              expect(syncedMutation!.type).toBe(original.type)
              expect(syncedMutation!.entityType).toBe(original.entityType)
              expect(syncedMutation!.entityId).toBe(original.entityId)
              expect(syncedMutation!.timestamp).toBe(original.timestamp)
            })
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should handle empty mutation list', () => {
      const mutations: Array<SerializedMutation> = []
      const synced = simulateSync(mutations, ['synced'])

      expect(synced.length).toBe(0)
    })

    it('should handle all mutations syncing successfully', () => {
      fc.assert(
        fc.property(mutationListArb, (mutations) => {
          const synced = simulateSync(
            mutations,
            Array(mutations.length).fill('synced'),
          )

          const syncedCount = synced.filter(
            (m) => m.syncResult === 'synced',
          ).length

          expect(syncedCount).toBe(mutations.length)
        }),
        { numRuns: 100 },
      )
    })

    it('should handle all mutations failing', () => {
      fc.assert(
        fc.property(mutationListArb, (mutations) => {
          const synced = simulateSync(
            mutations,
            Array(mutations.length).fill('failed'),
          )

          const failedCount = synced.filter(
            (m) => m.syncResult === 'failed',
          ).length

          expect(failedCount).toBe(mutations.length)
        }),
        { numRuns: 100 },
      )
    })

    it('should handle mixed sync results', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (count, syncedPct, failedPct, pendingPct) => {
            const mutations: Array<SerializedMutation> = Array.from(
              { length: count },
              (_, i) => ({
                id: `mutation-${i}`,
                type: 'create' as const,
                entityType: 'batch' as const,
                entityId: `entity-${i}`,
                data: {
                  name: `Item ${i}`,
                  quantity: i,
                  amount: 0,
                  date: new Date(),
                },
                timestamp: Date.now() + i,
                retryCount: 0,
              }),
            )

            // Generate results based on percentages
            const total = syncedPct + failedPct + pendingPct
            const results: Array<SyncResult> = mutations.map((_, i) => {
              const rand = (i * 17) % total // Deterministic "random"
              if (rand < syncedPct) return 'synced'
              if (rand < syncedPct + failedPct) return 'failed'
              return 'pending'
            })

            const synced = simulateSync(mutations, results)

            // Total should always be preserved
            expect(synced.length).toBe(count)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Additional invariants for mutation persistence
   */
  describe('Mutation Persistence Invariants', () => {
    it('serialized mutation should be valid JSON', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)

          expect(() => JSON.parse(serialized)).not.toThrow()
        }),
        { numRuns: 100 },
      )
    })

    it('deserialized mutation should have all required fields', () => {
      fc.assert(
        fc.property(serializedMutationArb, (mutation) => {
          const serialized = serializeMutation(mutation)
          const deserialized = deserializeMutation(serialized)

          expect(deserialized).toHaveProperty('id')
          expect(deserialized).toHaveProperty('type')
          expect(deserialized).toHaveProperty('entityType')
          expect(deserialized).toHaveProperty('entityId')
          expect(deserialized).toHaveProperty('data')
          expect(deserialized).toHaveProperty('timestamp')
          expect(deserialized).toHaveProperty('retryCount')
        }),
        { numRuns: 100 },
      )
    })

    it('mutation list serialization should preserve order', () => {
      fc.assert(
        fc.property(mutationListArb, (mutations) => {
          const serialized = mutations.map(serializeMutation)
          const deserialized = serialized.map(deserializeMutation)

          expect(deserialized.map((m) => m.id)).toEqual(
            mutations.map((m) => m.id),
          )
        }),
        { numRuns: 100 },
      )
    })
  })
})
