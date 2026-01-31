import * as fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'

import type { BatchRecord } from '~/features/batches/mutations'
import {
  TEMP_ID_PREFIX,
  addOptimisticRecord,
  createOptimisticContext,
  generateEntityTempId,
  isTempId,
  removeById,
  replaceTempIdWithRecord,
  updateById,
} from '~/lib/optimistic-utils'
import { createQueryClient } from '~/lib/query-client'

/**
 * Property Tests for Batch Mutation Optimistic Updates
 *
 * **Feature: offline-writes-v1**
 * **Property 4: Optimistic Updates (batches)**
 *
 * These tests verify that batch mutations correctly implement optimistic updates:
 * - Creates add a new batch with a temporary ID
 * - Updates modify the existing batch in place
 * - Deletes remove the batch from the cache
 * - Rollback restores previous state on failure
 * - Temp IDs are replaced with server IDs on success
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */
describe('Batch Mutation Optimistic Updates - Property Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  // Arbitraries for test data generation
  const uuidArb = fc.uuid()

  const livestockTypeArb = fc.constantFrom(
    'poultry',
    'fish',
    'cattle',
    'goats',
    'sheep',
    'bees',
  )

  const statusArb = fc.constantFrom('active', 'depleted', 'sold')

  const speciesArb = fc.constantFrom(
    'Broiler',
    'Layer',
    'Catfish',
    'Tilapia',
    'Angus',
    'Boer',
    'Merino',
    'Apis mellifera',
  )

  // Batch record arbitrary
  const batchRecordArb: fc.Arbitrary<BatchRecord> = fc.record({
    id: uuidArb,
    farmId: uuidArb,
    farmName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
      nil: null,
    }),
    livestockType: livestockTypeArb,
    species: speciesArb,
    breedId: fc.option(uuidArb, { nil: null }),
    breedName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: null,
    }),
    initialQuantity: fc.integer({ min: 1, max: 10000 }),
    currentQuantity: fc.integer({ min: 0, max: 10000 }),
    acquisitionDate: fc.date({
      min: new Date('2020-01-01'),
      max: new Date('2030-12-31'),
    }),
    costPerUnit: fc.float({ min: 0, max: 10000 }).map((n) => n.toFixed(2)),
    totalCost: fc.float({ min: 0, max: 100000000 }).map((n) => n.toFixed(2)),
    status: statusArb,
    batchName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
      nil: null,
    }),
    sourceSize: fc.option(
      fc.constantFrom(
        'day-old',
        'fingerling',
        'jumbo',
        'calf',
        'kid',
        'lamb',
        'nuc',
      ),
      { nil: null },
    ),
    structureId: fc.option(uuidArb, { nil: null }),
    targetHarvestDate: fc.option(
      fc.date({
        min: new Date('2020-01-01'),
        max: new Date('2030-12-31'),
      }),
      { nil: null },
    ),
    target_weight_g: fc.option(fc.integer({ min: 100, max: 100000 }), {
      nil: null,
    }),
    targetPricePerUnit: fc.option(
      fc.float({ min: 0, max: 10000 }).map((n) => n.toFixed(2)),
      { nil: null },
    ),
    supplierId: fc.option(uuidArb, { nil: null }),
    notes: fc.option(fc.string({ minLength: 0, maxLength: 500 }), {
      nil: null,
    }),
  })

  // Array of batch records
  const batchRecordsArb = fc.array(batchRecordArb, {
    minLength: 0,
    maxLength: 20,
  })

  // Create batch input arbitrary
  const createBatchInputArb = fc.record({
    farmId: uuidArb,
    livestockType: livestockTypeArb,
    species: speciesArb,
    breedId: fc.option(uuidArb, { nil: undefined }),
    initialQuantity: fc.integer({ min: 1, max: 10000 }),
    acquisitionDate: fc.date({
      min: new Date('2020-01-01'),
      max: new Date('2030-12-31'),
    }),
    costPerUnit: fc.float({ min: 0, max: 10000 }),
    batchName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
      nil: undefined,
    }),
    sourceSize: fc.option(fc.constantFrom('day-old', 'fingerling', 'jumbo'), {
      nil: undefined,
    }),
    structureId: fc.option(uuidArb, { nil: undefined }),
    targetHarvestDate: fc.option(
      fc.date({
        min: new Date('2020-01-01'),
        max: new Date('2030-12-31'),
      }),
      { nil: undefined },
    ),
    target_weight_g: fc.option(fc.integer({ min: 100, max: 100000 }), {
      nil: undefined,
    }),
    targetPricePerUnit: fc.option(fc.float({ min: 0, max: 10000 }), {
      nil: undefined,
    }),
    supplierId: fc.option(uuidArb, { nil: undefined }),
    notes: fc.option(fc.string({ minLength: 0, maxLength: 500 }), {
      nil: undefined,
    }),
  })

  // Update batch input arbitrary
  const updateBatchInputArb = fc.record({
    species: fc.option(speciesArb, { nil: undefined }),
    status: fc.option(statusArb, { nil: undefined }),
    batchName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
      nil: undefined,
    }),
    sourceSize: fc.option(fc.constantFrom('day-old', 'fingerling', 'jumbo'), {
      nil: undefined,
    }),
    structureId: fc.option(uuidArb, { nil: undefined }),
    targetHarvestDate: fc.option(
      fc.date({
        min: new Date('2020-01-01'),
        max: new Date('2030-12-31'),
      }),
      { nil: undefined },
    ),
    target_weight_g: fc.option(fc.integer({ min: 100, max: 100000 }), {
      nil: undefined,
    }),
    notes: fc.option(fc.string({ minLength: 0, maxLength: 500 }), {
      nil: undefined,
    }),
  })

  /**
   * Property 4.1: Batch Create Optimistic Updates
   *
   * WHEN offline, THE System SHALL allow creating new batches with all required fields.
   * Creates add a new batch with a temporary ID.
   *
   * **Validates: Requirements 4.1, 4.5**
   */
  describe('Property 4.1: Batch Create Optimistic Updates', () => {
    it('should generate batch temp IDs with correct prefix', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const tempId = generateEntityTempId('batch')

          expect(tempId.startsWith(`${TEMP_ID_PREFIX}batch-`)).toBe(true)
          expect(isTempId(tempId)).toBe(true)
        }),
        { numRuns: 100 },
      )
    })

    it('should add optimistic batch to empty cache', () => {
      fc.assert(
        fc.property(createBatchInputArb, (input) => {
          const tempId = generateEntityTempId('batch')

          const optimisticBatch: Omit<BatchRecord, 'id'> = {
            farmId: input.farmId,
            livestockType: input.livestockType,
            species: input.species,
            breedId: input.breedId || null,
            initialQuantity: input.initialQuantity,
            currentQuantity: input.initialQuantity,
            acquisitionDate: input.acquisitionDate,
            costPerUnit: input.costPerUnit.toString(),
            totalCost: (input.initialQuantity * input.costPerUnit).toString(),
            status: 'active',
            batchName: input.batchName || null,
            sourceSize: input.sourceSize || null,
            structureId: input.structureId || null,
            targetHarvestDate: input.targetHarvestDate || null,
            target_weight_g: input.target_weight_g || null,
            targetPricePerUnit: input.targetPricePerUnit?.toString() || null,
            supplierId: input.supplierId || null,
            notes: input.notes || null,
          }

          const result = addOptimisticRecord<BatchRecord>(
            undefined,
            optimisticBatch,
            tempId,
          )

          expect(result).toHaveLength(1)
          expect(result[0].id).toBe(tempId)
          expect(result[0].farmId).toBe(input.farmId)
          expect(result[0].species).toBe(input.species)
          expect(result[0].initialQuantity).toBe(input.initialQuantity)
          expect(result[0].status).toBe('active')
          expect(result[0]._isOptimistic).toBe(true)
          expect(result[0]._tempId).toBe(tempId)
        }),
        { numRuns: 100 },
      )
    })

    it('should append optimistic batch to existing cache', () => {
      fc.assert(
        fc.property(
          batchRecordsArb,
          createBatchInputArb,
          (existingBatches, input) => {
            const tempId = generateEntityTempId('batch')

            const optimisticBatch: Omit<BatchRecord, 'id'> = {
              farmId: input.farmId,
              livestockType: input.livestockType,
              species: input.species,
              breedId: input.breedId || null,
              initialQuantity: input.initialQuantity,
              currentQuantity: input.initialQuantity,
              acquisitionDate: input.acquisitionDate,
              costPerUnit: input.costPerUnit.toString(),
              totalCost: (input.initialQuantity * input.costPerUnit).toString(),
              status: 'active',
              batchName: input.batchName || null,
              sourceSize: input.sourceSize || null,
              structureId: input.structureId || null,
              targetHarvestDate: input.targetHarvestDate || null,
              target_weight_g: input.target_weight_g || null,
              targetPricePerUnit: input.targetPricePerUnit?.toString() || null,
              supplierId: input.supplierId || null,
              notes: input.notes || null,
            }

            const result = addOptimisticRecord<BatchRecord>(
              existingBatches,
              optimisticBatch,
              tempId,
            )

            // Should have one more batch
            expect(result).toHaveLength(existingBatches.length + 1)

            // Last batch should be the new one
            const lastBatch = result[result.length - 1]
            expect(lastBatch.id).toBe(tempId)
            expect(lastBatch._isOptimistic).toBe(true)

            // Existing batches should be preserved
            for (let i = 0; i < existingBatches.length; i++) {
              expect(result[i].id).toBe(existingBatches[i].id)
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should not mutate original cache array', () => {
      fc.assert(
        fc.property(
          batchRecordsArb.filter((arr) => arr.length > 0),
          createBatchInputArb,
          (existingBatches, input) => {
            const originalLength = existingBatches.length
            const tempId = generateEntityTempId('batch')

            const optimisticBatch: Omit<BatchRecord, 'id'> = {
              farmId: input.farmId,
              livestockType: input.livestockType,
              species: input.species,
              breedId: null,
              initialQuantity: input.initialQuantity,
              currentQuantity: input.initialQuantity,
              acquisitionDate: input.acquisitionDate,
              costPerUnit: input.costPerUnit.toString(),
              totalCost: (input.initialQuantity * input.costPerUnit).toString(),
              status: 'active',
              batchName: null,
              sourceSize: null,
              structureId: null,
              targetHarvestDate: null,
              target_weight_g: null,
              targetPricePerUnit: null,
              supplierId: null,
              notes: null,
            }

            addOptimisticRecord<BatchRecord>(
              existingBatches,
              optimisticBatch,
              tempId,
            )

            // Original array should not be modified
            expect(existingBatches).toHaveLength(originalLength)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 4.2: Batch Update Optimistic Updates
   *
   * WHEN offline, THE System SHALL allow updating batch details (name, notes, target dates).
   * Updates modify the existing batch in place.
   *
   * **Validates: Requirements 4.2**
   */
  describe('Property 4.2: Batch Update Optimistic Updates', () => {
    it('should update batch status optimistically', () => {
      fc.assert(
        fc.property(
          batchRecordsArb.filter((arr) => arr.length > 0),
          statusArb,
          (batches, newStatus) => {
            // Pick a random batch to update
            const targetIndex = Math.floor(Math.random() * batches.length)
            const targetId = batches[targetIndex].id

            const result = updateById<BatchRecord>(batches, targetId, {
              status: newStatus,
            })

            // Find the updated batch
            const updatedBatch = result.find((b) => b.id === targetId)
            expect(updatedBatch).toBeDefined()
            expect(updatedBatch?.status).toBe(newStatus)
            expect(updatedBatch?._isOptimistic).toBe(true)

            // Other batches should be unchanged
            for (const batch of result) {
              if (batch.id !== targetId) {
                const original = batches.find((b) => b.id === batch.id)
                expect(batch.status).toBe(original?.status)
              }
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should update batch name optimistically', () => {
      fc.assert(
        fc.property(
          batchRecordsArb.filter((arr) => arr.length > 0),
          fc.string({ minLength: 1, maxLength: 100 }),
          (batches, newName) => {
            const targetId = batches[0].id

            const result = updateById<BatchRecord>(batches, targetId, {
              batchName: newName,
            })

            const updatedBatch = result.find((b) => b.id === targetId)
            expect(updatedBatch?.batchName).toBe(newName)
            expect(updatedBatch?._isOptimistic).toBe(true)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should update batch notes optimistically', () => {
      fc.assert(
        fc.property(
          batchRecordsArb.filter((arr) => arr.length > 0),
          fc.string({ minLength: 0, maxLength: 500 }),
          (batches, newNotes) => {
            const targetId = batches[0].id

            const result = updateById<BatchRecord>(batches, targetId, {
              notes: newNotes,
            })

            const updatedBatch = result.find((b) => b.id === targetId)
            expect(updatedBatch?.notes).toBe(newNotes)
            expect(updatedBatch?._isOptimistic).toBe(true)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should preserve array length after update', () => {
      fc.assert(
        fc.property(
          batchRecordsArb.filter((arr) => arr.length > 0),
          updateBatchInputArb,
          (batches, updates) => {
            const targetId = batches[0].id
            const result = updateById(
              batches,
              targetId,
              updates as Partial<BatchRecord>,
            )

            expect(result).toHaveLength(batches.length)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return unchanged array if batch ID not found', () => {
      fc.assert(
        fc.property(
          batchRecordsArb,
          uuidArb,
          updateBatchInputArb,
          (batches, nonExistentId, updates) => {
            // Ensure the ID doesn't exist in batches
            const existingIds = new Set(batches.map((b) => b.id))
            if (existingIds.has(nonExistentId)) return // Skip this case

            const result = updateById(
              batches,
              nonExistentId,
              updates as Partial<BatchRecord>,
            )

            // All batches should be unchanged
            expect(result).toHaveLength(batches.length)
            for (let i = 0; i < batches.length; i++) {
              expect(result[i].id).toBe(batches[i].id)
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 4.3: Batch Delete Optimistic Updates
   *
   * WHEN offline, THE System SHALL allow deleting batches that have no associated records.
   * Deletes remove the batch from the cache.
   *
   * **Validates: Requirements 4.3, 4.4**
   */
  describe('Property 4.3: Batch Delete Optimistic Updates', () => {
    it('should remove batch from cache optimistically', () => {
      fc.assert(
        fc.property(
          batchRecordsArb.filter((arr) => arr.length > 0),
          (batches) => {
            // Pick a random batch to delete
            const targetIndex = Math.floor(Math.random() * batches.length)
            const targetId = batches[targetIndex].id

            const result = removeById(batches, targetId)

            // Should have one less batch
            expect(result).toHaveLength(batches.length - 1)

            // Target batch should not exist
            expect(result.find((b) => b.id === targetId)).toBeUndefined()

            // All other batches should still exist
            for (const batch of batches) {
              if (batch.id !== targetId) {
                expect(result.find((b) => b.id === batch.id)).toBeDefined()
              }
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return unchanged array if batch ID not found', () => {
      fc.assert(
        fc.property(batchRecordsArb, uuidArb, (batches, nonExistentId) => {
          // Ensure the ID doesn't exist in batches
          const existingIds = new Set(batches.map((b) => b.id))
          if (existingIds.has(nonExistentId)) return // Skip this case

          const result = removeById(batches, nonExistentId)

          expect(result).toHaveLength(batches.length)
        }),
        { numRuns: 100 },
      )
    })

    it('should handle empty cache', () => {
      fc.assert(
        fc.property(uuidArb, (id) => {
          const result = removeById<BatchRecord>(undefined, id)
          expect(result).toEqual([])
        }),
        { numRuns: 100 },
      )
    })

    it('should not mutate original cache array', () => {
      fc.assert(
        fc.property(
          batchRecordsArb.filter((arr) => arr.length > 0),
          (batches) => {
            const originalLength = batches.length
            const targetId = batches[0].id

            removeById(batches, targetId)

            // Original array should not be modified
            expect(batches).toHaveLength(originalLength)
            expect(batches.find((b) => b.id === targetId)).toBeDefined()
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 4.4: Batch Rollback on Failure
   *
   * IF a mutation fails after optimistic update, THEN THE Query_Client SHALL
   * rollback the cache to its previous state.
   *
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4 (rollback aspect)**
   */
  describe('Property 4.4: Batch Rollback on Failure', () => {
    it('should preserve previous state for create rollback', () => {
      fc.assert(
        fc.property(batchRecordsArb, (batches) => {
          const context = createOptimisticContext(batches)

          expect(context.previousData).toEqual(batches)
        }),
        { numRuns: 100 },
      )
    })

    it('should store temp ID in context for create rollback', () => {
      fc.assert(
        fc.property(batchRecordsArb, (batches) => {
          const tempId = generateEntityTempId('batch')
          const context = createOptimisticContext(batches, tempId)

          expect(context.previousData).toEqual(batches)
          expect(context.tempId).toBe(tempId)
        }),
        { numRuns: 100 },
      )
    })

    it('should restore cache to previous state on rollback', () => {
      fc.assert(
        fc.property(
          batchRecordsArb,
          batchRecordsArb,
          (originalBatches, modifiedBatches) => {
            const queryKey = ['batches']

            // Set initial data
            queryClient.setQueryData(queryKey, originalBatches)

            // Create context with original data
            const context = createOptimisticContext(originalBatches)

            // Simulate optimistic update
            queryClient.setQueryData(queryKey, modifiedBatches)

            // Verify data was modified
            expect(queryClient.getQueryData(queryKey)).toEqual(modifiedBatches)

            // Perform rollback
            if (context.previousData !== undefined) {
              queryClient.setQueryData(queryKey, context.previousData)
            }

            // Verify data was restored
            expect(queryClient.getQueryData(queryKey)).toEqual(originalBatches)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 4.5: Temp ID Replacement on Success
   *
   * WHEN a batch is created offline, THE System SHALL generate a temporary UUID
   * that is replaced upon sync.
   *
   * **Validates: Requirements 4.5**
   */
  describe('Property 4.5: Temp ID Replacement on Success', () => {
    it('should replace temp ID with server ID', () => {
      fc.assert(
        fc.property(
          batchRecordsArb,
          batchRecordArb,
          (existingBatches, serverBatch) => {
            // Create a batch with temp ID
            const tempId = generateEntityTempId('batch')
            const batchesWithTemp = addOptimisticRecord(
              existingBatches,
              {
                farmId: serverBatch.farmId,
                livestockType: serverBatch.livestockType,
                species: serverBatch.species,
                breedId: null,
                initialQuantity: serverBatch.initialQuantity,
                currentQuantity: serverBatch.currentQuantity,
                acquisitionDate: serverBatch.acquisitionDate,
                costPerUnit: serverBatch.costPerUnit,
                totalCost: serverBatch.totalCost,
                status: 'active',
                batchName: null,
                sourceSize: null,
                structureId: null,
                targetHarvestDate: null,
                target_weight_g: null,
                targetPricePerUnit: null,
                supplierId: null,
                notes: null,
              },
              tempId,
            )

            // Replace temp ID with server batch
            const result = replaceTempIdWithRecord(
              batchesWithTemp,
              tempId,
              serverBatch,
            )

            // Temp ID should no longer exist
            expect(result.find((b) => b.id === tempId)).toBeUndefined()

            // Server batch should exist
            const found = result.find((b) => b.id === serverBatch.id)
            expect(found).toBeDefined()
            expect(found?.species).toBe(serverBatch.species)
            expect(found?._isOptimistic).toBe(false)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should preserve other batches when replacing temp ID', () => {
      fc.assert(
        fc.property(
          batchRecordsArb.filter((arr) => arr.length > 0),
          batchRecordArb,
          (existingBatches, serverBatch) => {
            const tempId = generateEntityTempId('batch')
            const batchesWithTemp = addOptimisticRecord(
              existingBatches,
              {
                farmId: serverBatch.farmId,
                livestockType: serverBatch.livestockType,
                species: serverBatch.species,
                breedId: null,
                initialQuantity: serverBatch.initialQuantity,
                currentQuantity: serverBatch.currentQuantity,
                acquisitionDate: serverBatch.acquisitionDate,
                costPerUnit: serverBatch.costPerUnit,
                totalCost: serverBatch.totalCost,
                status: 'active',
                batchName: null,
                sourceSize: null,
                structureId: null,
                targetHarvestDate: null,
                target_weight_g: null,
                targetPricePerUnit: null,
                supplierId: null,
                notes: null,
              },
              tempId,
            )

            const result = replaceTempIdWithRecord(
              batchesWithTemp,
              tempId,
              serverBatch,
            )

            // All original batches should still exist
            for (const original of existingBatches) {
              const found = result.find((b) => b.id === original.id)
              expect(found).toBeDefined()
              expect(found?.species).toBe(original.species)
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should append server batch if temp ID not found', () => {
      fc.assert(
        fc.property(
          batchRecordsArb,
          batchRecordArb,
          (existingBatches, serverBatch) => {
            const nonExistentTempId = generateEntityTempId('batch')

            const result = replaceTempIdWithRecord(
              existingBatches,
              nonExistentTempId,
              serverBatch,
            )

            // Should have one more batch
            expect(result).toHaveLength(existingBatches.length + 1)

            // Server batch should be appended
            expect(result.find((b) => b.id === serverBatch.id)).toBeDefined()
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
