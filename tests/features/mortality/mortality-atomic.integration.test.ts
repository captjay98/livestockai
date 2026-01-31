/**
 * Mortality Recording - Atomic Operations Integration Tests
 *
 * Tests the critical path of recording mortality and updating batch quantity.
 * This operation MUST be atomic to prevent data inconsistency.
 */

import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  resetTestDb,
  seedTestBatch,
  seedTestFarm,
  seedTestUser,
  truncateAllTables,
} from '../../helpers/db-integration'

describe('Mortality Recording - Atomic Operations', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterEach(() => {
    resetTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  it('should atomically record mortality and update batch quantity', async () => {
    const db = getTestDb()

    // Setup
    const { userId } = await seedTestUser({
      email: `test-${Date.now()}@example.com`,
    })
    const { farmId } = await seedTestFarm(userId)
    const { batchId } = await seedTestBatch(farmId, {
      species: 'broiler',
      initialQuantity: 100,
      currentQuantity: 100,
    })

    // Execute atomic operation
    await db.transaction().execute(async (trx) => {
      // Insert mortality record
      await trx
        .insertInto('mortality_records')
        .values({
          batchId,
          quantity: 5,
          date: new Date(),
          cause: 'disease',
        })
        .execute()

      // Update batch quantity
      await trx
        .updateTable('batches')
        .set({ currentQuantity: 95 })
        .where('id', '=', batchId)
        .execute()
    })

    // Verify both operations succeeded
    const batch = await db
      .selectFrom('batches')
      .selectAll()
      .where('id', '=', batchId)
      .executeTakeFirstOrThrow()

    const mortalityRecords = await db
      .selectFrom('mortality_records')
      .selectAll()
      .where('batchId', '=', batchId)
      .execute()

    expect(batch.currentQuantity).toBe(95)
    expect(mortalityRecords).toHaveLength(1)
    expect(mortalityRecords[0].quantity).toBe(5)
  })

  it('should rollback both operations if batch update fails', async () => {
    const db = getTestDb()

    // Setup
    const { userId } = await seedTestUser({
      email: `test-${Date.now()}@example.com`,
    })
    const { farmId } = await seedTestFarm(userId)
    const { batchId } = await seedTestBatch(farmId, {
      species: 'broiler',
      initialQuantity: 100,
      currentQuantity: 100,
    })

    // Attempt transaction that should fail
    try {
      await db.transaction().execute(async (trx) => {
        // Insert mortality record
        await trx
          .insertInto('mortality_records')
          .values({
            batchId,
            quantity: 5,
            date: new Date(),
            cause: 'disease',
          })
          .execute()

        // This should fail (invalid quantity)
        await trx
          .updateTable('batches')
          .set({ currentQuantity: -10 }) // Violates CHECK constraint
          .where('id', '=', batchId)
          .execute()
      })

      // Should not reach here
      expect.fail('Transaction should have failed')
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined()
    }

    // Verify rollback - no mortality record should exist
    const mortalityRecords = await db
      .selectFrom('mortality_records')
      .selectAll()
      .where('batchId', '=', batchId)
      .execute()

    const batch = await db
      .selectFrom('batches')
      .selectAll()
      .where('id', '=', batchId)
      .executeTakeFirstOrThrow()

    expect(mortalityRecords).toHaveLength(0)
    expect(batch.currentQuantity).toBe(100) // Unchanged
  })

  it('should handle multiple mortality records correctly', async () => {
    const db = getTestDb()

    // Setup
    const { userId } = await seedTestUser({
      email: `test-${Date.now()}@example.com`,
    })
    const { farmId } = await seedTestFarm(userId)
    const { batchId } = await seedTestBatch(farmId, {
      species: 'broiler',
      initialQuantity: 100,
      currentQuantity: 100,
    })

    // Record first mortality
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('mortality_records')
        .values({
          batchId,
          quantity: 3,
          date: new Date(),
          cause: 'disease',
        })
        .execute()

      await trx
        .updateTable('batches')
        .set({ currentQuantity: 97 })
        .where('id', '=', batchId)
        .execute()
    })

    // Record second mortality
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('mortality_records')
        .values({
          batchId,
          quantity: 2,
          date: new Date(),
          cause: 'predator',
        })
        .execute()

      await trx
        .updateTable('batches')
        .set({ currentQuantity: 95 })
        .where('id', '=', batchId)
        .execute()
    })

    // Verify final state
    const batch = await db
      .selectFrom('batches')
      .selectAll()
      .where('id', '=', batchId)
      .executeTakeFirstOrThrow()

    const mortalityRecords = await db
      .selectFrom('mortality_records')
      .selectAll()
      .where('batchId', '=', batchId)
      .execute()

    expect(batch.currentQuantity).toBe(95)
    expect(mortalityRecords).toHaveLength(2)
    expect(mortalityRecords[0].quantity).toBe(3)
    expect(mortalityRecords[1].quantity).toBe(2)
  })

  it('should prevent negative batch quantity', async () => {
    const db = getTestDb()

    // Setup
    const { userId } = await seedTestUser({
      email: `test-${Date.now()}@example.com`,
    })
    const { farmId } = await seedTestFarm(userId)
    const { batchId } = await seedTestBatch(farmId, {
      species: 'broiler',
      initialQuantity: 10,
      currentQuantity: 5,
    })

    // Attempt to record more deaths than current quantity
    try {
      await db.transaction().execute(async (trx) => {
        await trx
          .insertInto('mortality_records')
          .values({
            batchId,
            quantity: 10,
            date: new Date(),
            cause: 'disease',
          })
          .execute()

        // This should fail (negative quantity)
        await trx
          .updateTable('batches')
          .set({ currentQuantity: -5 })
          .where('id', '=', batchId)
          .execute()
      })

      expect.fail('Should not allow negative quantity')
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined()
    }

    // Verify no changes
    const batch = await db
      .selectFrom('batches')
      .selectAll()
      .where('id', '=', batchId)
      .executeTakeFirstOrThrow()

    expect(batch.currentQuantity).toBe(5)
  })

  it('should calculate total mortality correctly', async () => {
    const db = getTestDb()

    // Setup
    const { userId } = await seedTestUser({
      email: `test-${Date.now()}@example.com`,
    })
    const { farmId } = await seedTestFarm(userId)
    const { batchId } = await seedTestBatch(farmId, {
      species: 'broiler',
      initialQuantity: 100,
      currentQuantity: 100,
    })

    // Record multiple mortalities
    const mortalityCounts = [5, 3, 2, 4]
    let currentQuantity = 100

    for (const count of mortalityCounts) {
      await db.transaction().execute(async (trx) => {
        await trx
          .insertInto('mortality_records')
          .values({
            batchId,
            quantity: count,
            date: new Date(),
            cause: 'disease',
          })
          .execute()

        currentQuantity -= count
        await trx
          .updateTable('batches')
          .set({ currentQuantity })
          .where('id', '=', batchId)
          .execute()
      })
    }

    // Calculate total mortality
    const mortalityRecords = await db
      .selectFrom('mortality_records')
      .selectAll()
      .where('batchId', '=', batchId)
      .execute()

    const totalMortality = mortalityRecords.reduce(
      (sum, record) => sum + record.quantity,
      0,
    )

    const batch = await db
      .selectFrom('batches')
      .selectAll()
      .where('id', '=', batchId)
      .executeTakeFirstOrThrow()

    expect(totalMortality).toBe(14) // 5 + 3 + 2 + 4
    expect(batch.currentQuantity).toBe(86) // 100 - 14
    expect(batch.initialQuantity - batch.currentQuantity).toBe(totalMortality)
  })
})
