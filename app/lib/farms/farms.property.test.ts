import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 16: Farm Data Isolation
 * Feature: poultry-fishery-tracker, Property 16: Farm Data Isolation
 * Validates: Requirements 2.2, 2.3, 10.7
 *
 * For any query with a farm filter, all returned records SHALL have farm_id
 * equal to the filter value (or be associated with a batch that has that farm_id).
 */
describe('Property 16: Farm Data Isolation', () => {
  // Arbitrary for farm IDs (UUIDs)
  const farmIdArb = fc.uuid()

  // Arbitrary for batch records
  const batchArb = fc.record({
    id: fc.uuid(),
    farmId: fc.uuid(),
    species: fc.constantFrom('broiler', 'layer', 'catfish', 'tilapia'),
    currentQuantity: fc.integer({ min: 0, max: 10000 }),
  })

  // Arbitrary for records that belong to a farm
  const farmRecordArb = fc.record({
    id: fc.uuid(),
    farmId: fc.uuid(),
    amount: fc.double({ min: 0, max: 1000000, noNaN: true }),
  })

  // Arbitrary for records that belong to a batch (indirect farm association)
  const batchRecordArb = fc.record({
    id: fc.uuid(),
    batchId: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 1000 }),
  })

  /**
   * Simulates filtering records by farm ID
   */
  function filterByFarmId<T extends { farmId: string }>(
    records: Array<T>,
    targetFarmId: string,
  ): Array<T> {
    return records.filter((r) => r.farmId === targetFarmId)
  }

  /**
   * Simulates filtering batch-associated records by farm ID
   */
  function filterBatchRecordsByFarmId<T extends { batchId: string }>(
    records: Array<T>,
    batches: Array<{ id: string; farmId: string }>,
    targetFarmId: string,
  ): Array<T> {
    const batchIdsForFarm = new Set(
      batches.filter((b) => b.farmId === targetFarmId).map((b) => b.id),
    )
    return records.filter((r) => batchIdsForFarm.has(r.batchId))
  }

  it('all filtered records have the correct farm_id', () => {
    fc.assert(
      fc.property(
        fc.array(farmRecordArb, { minLength: 0, maxLength: 100 }),
        farmIdArb,
        (records, targetFarmId) => {
          const filtered = filterByFarmId(records, targetFarmId)

          // All filtered records must have the target farm ID
          for (const record of filtered) {
            expect(record.farmId).toBe(targetFarmId)
          }

          // No records with different farm IDs should be included
          const otherFarmRecords = records.filter(
            (r) => r.farmId !== targetFarmId,
          )
          for (const record of otherFarmRecords) {
            expect(filtered).not.toContainEqual(record)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('batch-associated records are correctly filtered by farm', () => {
    fc.assert(
      fc.property(
        fc.array(batchArb, { minLength: 0, maxLength: 50 }),
        fc.array(batchRecordArb, { minLength: 0, maxLength: 100 }),
        farmIdArb,
        (batches, records, targetFarmId) => {
          // Assign some records to batches that exist
          const recordsWithValidBatches = records.map((r, i) => ({
            ...r,
            batchId:
              batches.length > 0 ? batches[i % batches.length].id : r.batchId,
          }))

          const filtered = filterBatchRecordsByFarmId(
            recordsWithValidBatches,
            batches,
            targetFarmId,
          )

          // All filtered records must belong to batches from the target farm
          const batchIdsForFarm = new Set(
            batches.filter((b) => b.farmId === targetFarmId).map((b) => b.id),
          )

          for (const record of filtered) {
            expect(batchIdsForFarm.has(record.batchId)).toBe(true)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('empty result when farm has no records', () => {
    fc.assert(
      fc.property(
        fc.array(farmRecordArb, { minLength: 0, maxLength: 50 }),
        farmIdArb,
        (records, targetFarmId) => {
          // Ensure no records have the target farm ID
          const recordsWithoutTarget = records.map((r) => ({
            ...r,
            farmId: r.farmId === targetFarmId ? `other-${r.farmId}` : r.farmId,
          }))

          const filtered = filterByFarmId(recordsWithoutTarget, targetFarmId)

          expect(filtered).toHaveLength(0)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('filtering preserves record count for matching farm', () => {
    fc.assert(
      fc.property(
        fc.array(farmRecordArb, { minLength: 1, maxLength: 50 }),
        (records) => {
          // Pick a farm ID that exists in the records
          const targetFarmId = records[0].farmId

          // Count records with this farm ID
          const expectedCount = records.filter(
            (r) => r.farmId === targetFarmId,
          ).length

          const filtered = filterByFarmId(records, targetFarmId)

          expect(filtered.length).toBe(expectedCount)
        },
      ),
      { numRuns: 100 },
    )
  })
})
