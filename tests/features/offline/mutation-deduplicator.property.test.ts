import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import type { MutationMeta } from '~/lib/mutation-deduplicator'
import {
  deduplicateMutations,
  mergeUpdateVariables,
} from '~/lib/mutation-deduplicator'
import { generateEntityTempId } from '~/lib/optimistic-utils'

/**
 * Property Tests for Mutation Deduplication
 *
 * **Feature: offline-writes-v1**
 *
 * These tests verify the correctness of mutation deduplication,
 * ensuring redundant mutations are optimized before sync.
 */
describe('Mutation Deduplicator - Property Tests', () => {
  // Arbitraries
  const entityTypeArb = fc.constantFrom(
    'batch',
    'sale',
    'feed',
    'mortality',
    'weight',
    'expense',
  )

  const mutationTypeArb = fc.constantFrom('create', 'update', 'delete')

  const variablesArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    quantity: fc.integer({ min: 0, max: 1000 }),
    amount: fc.float({ min: 0, max: 10000 }),
  })

  // Helper to create mutation meta
  function createMutationMeta(
    id: number,
    type: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    timestamp: number,
    variables: Record<string, unknown> = {},
  ): MutationMeta {
    return { id, type, entityType, entityId, timestamp, variables }
  }

  /**
   * Property 13: Create-Delete Cancellation
   *
   * For any entity created with a temp ID and then deleted before sync,
   * both mutations SHALL be removed from the queue.
   *
   * **Validates: Requirements 12.1, 12.5**
   */
  describe('Property 13: Create-Delete Cancellation', () => {
    it('should cancel create+delete pairs for temp IDs', () => {
      fc.assert(
        fc.property(entityTypeArb, variablesArb, (entityType, variables) => {
          const tempId = generateEntityTempId(entityType)

          const mutations: Array<MutationMeta> = [
            createMutationMeta(
              1,
              'create',
              entityType,
              tempId,
              1000,
              variables,
            ),
            createMutationMeta(2, 'delete', entityType, tempId, 2000, {}),
          ]

          const result = deduplicateMutations(mutations)

          // Both should be removed
          expect(result.remove).toContain(1)
          expect(result.remove).toContain(2)
          expect(result.keep).not.toContain(1)
          expect(result.keep).not.toContain(2)
          expect(result.actions.length).toBeGreaterThan(0)
        }),
        { numRuns: 100 },
      )
    })

    it('should cancel create+update+delete sequences for temp IDs', () => {
      fc.assert(
        fc.property(
          entityTypeArb,
          variablesArb,
          variablesArb,
          (entityType, createVars, updateVars) => {
            const tempId = generateEntityTempId(entityType)

            const mutations: Array<MutationMeta> = [
              createMutationMeta(
                1,
                'create',
                entityType,
                tempId,
                1000,
                createVars,
              ),
              createMutationMeta(
                2,
                'update',
                entityType,
                tempId,
                2000,
                updateVars,
              ),
              createMutationMeta(3, 'delete', entityType, tempId, 3000, {}),
            ]

            const result = deduplicateMutations(mutations)

            // All should be removed
            expect(result.remove).toContain(1)
            expect(result.remove).toContain(2)
            expect(result.remove).toContain(3)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should NOT cancel create+delete for server IDs', () => {
      fc.assert(
        fc.property(
          entityTypeArb,
          fc.uuid(),
          variablesArb,
          (entityType, serverId, variables) => {
            const mutations: Array<MutationMeta> = [
              createMutationMeta(
                1,
                'create',
                entityType,
                serverId,
                1000,
                variables,
              ),
              createMutationMeta(2, 'delete', entityType, serverId, 2000, {}),
            ]

            const result = deduplicateMutations(mutations)

            // Delete should be kept (entity exists on server)
            expect(result.keep).toContain(2)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 14: Update Merge Correctness
   *
   * For any sequence of updates to the same entity, the deduplicator
   * SHALL merge them into a single update with the latest values.
   *
   * **Validates: Requirements 12.3, 12.4**
   */
  describe('Property 14: Update Merge Correctness', () => {
    it('should merge multiple updates into one', () => {
      fc.assert(
        fc.property(
          entityTypeArb,
          fc.uuid(),
          fc.array(variablesArb, { minLength: 2, maxLength: 5 }),
          (entityType, entityId, variablesList) => {
            const mutations: Array<MutationMeta> = variablesList.map(
              (vars, i) =>
                createMutationMeta(
                  i + 1,
                  'update',
                  entityType,
                  entityId,
                  1000 + i * 100,
                  vars,
                ),
            )

            const result = deduplicateMutations(mutations)

            // Only the last update should be kept
            const lastId = variablesList.length
            expect(result.keep).toContain(lastId)

            // All others should be removed
            for (let i = 1; i < lastId; i++) {
              expect(result.remove).toContain(i)
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should remove updates before delete', () => {
      fc.assert(
        fc.property(
          entityTypeArb,
          fc.uuid(),
          fc.array(variablesArb, { minLength: 1, maxLength: 3 }),
          (entityType, entityId, updateVars) => {
            const mutations: Array<MutationMeta> = [
              ...updateVars.map((vars, i) =>
                createMutationMeta(
                  i + 1,
                  'update',
                  entityType,
                  entityId,
                  1000 + i * 100,
                  vars,
                ),
              ),
              createMutationMeta(100, 'delete', entityType, entityId, 5000, {}),
            ]

            const result = deduplicateMutations(mutations)

            // Delete should be kept
            expect(result.keep).toContain(100)

            // All updates should be removed
            for (let i = 1; i <= updateVars.length; i++) {
              expect(result.remove).toContain(i)
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should preserve single mutations', () => {
      fc.assert(
        fc.property(
          entityTypeArb,
          fc.uuid(),
          mutationTypeArb,
          variablesArb,
          (entityType, entityId, type, variables) => {
            const mutations: Array<MutationMeta> = [
              createMutationMeta(
                1,
                type,
                entityType,
                entityId,
                1000,
                variables,
              ),
            ]

            const result = deduplicateMutations(mutations)

            // Single mutation should be kept
            expect(result.keep).toContain(1)
            expect(result.remove).not.toContain(1)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Tests for mergeUpdateVariables utility
   */
  describe('mergeUpdateVariables', () => {
    it('should merge variables with later values overriding earlier', () => {
      fc.assert(
        fc.property(
          fc.array(variablesArb, { minLength: 2, maxLength: 5 }),
          (variablesList) => {
            const merged = mergeUpdateVariables(variablesList)
            const last = variablesList[variablesList.length - 1]

            // Last values should be present
            expect(merged.name).toBe(last.name)
            expect(merged.quantity).toBe(last.quantity)
            expect(merged.amount).toBe(last.amount)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should handle empty array', () => {
      const merged = mergeUpdateVariables([])
      expect(merged).toEqual({})
    })

    it('should handle single update', () => {
      fc.assert(
        fc.property(variablesArb, (variables) => {
          const merged = mergeUpdateVariables([variables])
          expect(merged).toEqual(variables)
        }),
        { numRuns: 100 },
      )
    })

    it('should preserve all keys from all updates', () => {
      const updates = [
        { a: 1, b: 2 },
        { b: 3, c: 4 },
        { c: 5, d: 6 },
      ]

      const merged = mergeUpdateVariables(updates)

      expect(merged).toHaveProperty('a', 1)
      expect(merged).toHaveProperty('b', 3)
      expect(merged).toHaveProperty('c', 5)
      expect(merged).toHaveProperty('d', 6)
    })
  })

  /**
   * Invariant tests
   */
  describe('Deduplication Invariants', () => {
    it('should never lose mutations (keep + remove = total)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(entityTypeArb, fc.uuid(), mutationTypeArb, variablesArb),
            { minLength: 1, maxLength: 10 },
          ),
          (mutationData) => {
            const mutations: Array<MutationMeta> = mutationData.map(
              ([entityType, entityId, type, variables], i) =>
                createMutationMeta(
                  i + 1,
                  type,
                  entityType,
                  entityId,
                  1000 + i * 100,
                  variables,
                ),
            )

            const result = deduplicateMutations(mutations)

            // Every mutation should be in either keep or remove
            const allIds = new Set([...result.keep, ...result.remove])
            for (const mutation of mutations) {
              expect(allIds.has(mutation.id)).toBe(true)
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should not have overlapping keep and remove sets', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(entityTypeArb, fc.uuid(), mutationTypeArb, variablesArb),
            { minLength: 1, maxLength: 10 },
          ),
          (mutationData) => {
            const mutations: Array<MutationMeta> = mutationData.map(
              ([entityType, entityId, type, variables], i) =>
                createMutationMeta(
                  i + 1,
                  type,
                  entityType,
                  entityId,
                  1000 + i * 100,
                  variables,
                ),
            )

            const result = deduplicateMutations(mutations)

            // No ID should be in both keep and remove
            const keepSet = new Set(result.keep)
            for (const id of result.remove) {
              expect(keepSet.has(id)).toBe(false)
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
