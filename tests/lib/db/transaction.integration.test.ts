/**
 * Integration tests for transaction support with PostgresDialect
 *
 * These tests verify that the migration from NeonDialect to PostgresDialect
 * enables full interactive transaction support.
 *
 * **Validates: Requirements 3.1, 3.3**
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

describe('Transaction Support - Integration Tests', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterEach(() => {
    resetTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  /**
   * Property 2: Transaction Atomicity - Commit
   *
   * For any sequence of database operations within a transaction where all
   * operations succeed, all changes are committed atomically.
   *
   * **Validates: Requirements 3.1**
   */
  describe('Property 2: Transaction Atomicity - Commit', () => {
    it('should commit all operations when transaction succeeds', async () => {
      const timestamp = Date.now()
      const { userId } = await seedTestUser({
        email: `test-${timestamp}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, {
        initialQuantity: 100,
        currentQuantity: 100,
      })

      const db = getTestDb()

      // Execute a transaction that inserts a mortality record and updates batch quantity
      await db.transaction().execute(async (trx) => {
        // Insert mortality record
        await trx
          .insertInto('mortality_records')
          .values({
            id: crypto.randomUUID(),
            batchId,
            quantity: 5,
            cause: 'disease',
            date: new Date(),
            notes: 'Test mortality',
          })
          .execute()

        // Update batch quantity
        await trx
          .updateTable('batches')
          .set({ currentQuantity: 95 })
          .where('id', '=', batchId)
          .execute()
      })

      // Verify both changes were committed
      const batch = await db
        .selectFrom('batches')
        .select(['currentQuantity'])
        .where('id', '=', batchId)
        .executeTakeFirst()

      const mortalityRecords = await db
        .selectFrom('mortality_records')
        .select(['quantity'])
        .where('batchId', '=', batchId)
        .execute()

      expect(batch?.currentQuantity).toBe(95)
      expect(mortalityRecords).toHaveLength(1)
      expect(mortalityRecords[0].quantity).toBe(5)
    })
  })

  /**
   * Property 2: Transaction Atomicity - Rollback
   *
   * For any sequence of database operations within a transaction where one
   * operation fails, all preceding operations are rolled back.
   *
   * **Validates: Requirements 3.3**
   */
  describe('Property 2: Transaction Atomicity - Rollback', () => {
    it('should rollback all operations when transaction fails', async () => {
      const timestamp = Date.now()
      const { userId } = await seedTestUser({
        email: `test-${timestamp}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, {
        initialQuantity: 100,
        currentQuantity: 100,
      })

      const db = getTestDb()

      // Execute a transaction that should fail
      try {
        await db.transaction().execute(async (trx) => {
          // First operation: Insert mortality record (should succeed)
          await trx
            .insertInto('mortality_records')
            .values({
              id: crypto.randomUUID(),
              batchId,
              quantity: 5,
              cause: 'disease',
              date: new Date(),
              notes: 'Test mortality',
            })
            .execute()

          // Second operation: Intentionally throw an error
          throw new Error('Simulated failure')
        })
      } catch (error) {
        // Expected to fail
        expect((error as Error).message).toBe('Simulated failure')
      }

      // Verify the mortality record was NOT inserted (rolled back)
      const mortalityRecords = await db
        .selectFrom('mortality_records')
        .select(['quantity'])
        .where('batchId', '=', batchId)
        .execute()

      expect(mortalityRecords).toHaveLength(0)

      // Verify batch quantity is unchanged
      const batch = await db
        .selectFrom('batches')
        .select(['currentQuantity'])
        .where('id', '=', batchId)
        .executeTakeFirst()

      expect(batch?.currentQuantity).toBe(100)
    })

    it('should rollback on constraint violation', async () => {
      const timestamp = Date.now()
      const { userId } = await seedTestUser({
        email: `test-${timestamp}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, {
        initialQuantity: 100,
        currentQuantity: 100,
      })

      const db = getTestDb()

      // Execute a transaction that should fail due to constraint violation
      try {
        await db.transaction().execute(async (trx) => {
          // First operation: Update batch quantity (should succeed)
          await trx
            .updateTable('batches')
            .set({ currentQuantity: 95 })
            .where('id', '=', batchId)
            .execute()

          // Second operation: Insert with invalid foreign key (should fail)
          await trx
            .insertInto('mortality_records')
            .values({
              id: crypto.randomUUID(),
              batchId: 'non-existent-batch-id', // Invalid FK
              quantity: 5,
              cause: 'disease',
              date: new Date(),
              notes: 'Test mortality',
            })
            .execute()
        })
      } catch {
        // Expected to fail due to FK constraint
      }

      // Verify batch quantity was rolled back to original
      const batch = await db
        .selectFrom('batches')
        .select(['currentQuantity'])
        .where('id', '=', batchId)
        .executeTakeFirst()

      expect(batch?.currentQuantity).toBe(100)
    })
  })

  /**
   * Multiple operations in single transaction
   *
   * Verifies that complex multi-step transactions work correctly.
   */
  describe('Complex Transactions', () => {
    it('should handle multiple inserts and updates in single transaction', async () => {
      const timestamp = Date.now()
      const { userId } = await seedTestUser({
        email: `test-${timestamp}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, {
        initialQuantity: 100,
        currentQuantity: 100,
      })

      const db = getTestDb()

      // Execute complex transaction
      await db.transaction().execute(async (trx) => {
        // Insert multiple mortality records
        await trx
          .insertInto('mortality_records')
          .values({
            id: crypto.randomUUID(),
            batchId,
            quantity: 3,
            cause: 'disease',
            date: new Date(),
            notes: 'First mortality',
          })
          .execute()

        await trx
          .insertInto('mortality_records')
          .values({
            id: crypto.randomUUID(),
            batchId,
            quantity: 2,
            cause: 'predator',
            date: new Date(),
            notes: 'Second mortality',
          })
          .execute()

        // Update batch quantity
        await trx
          .updateTable('batches')
          .set({ currentQuantity: 95 })
          .where('id', '=', batchId)
          .execute()
      })

      // Verify all changes
      const batch = await db
        .selectFrom('batches')
        .select(['currentQuantity'])
        .where('id', '=', batchId)
        .executeTakeFirst()

      const mortalityRecords = await db
        .selectFrom('mortality_records')
        .select(['quantity', 'cause'])
        .where('batchId', '=', batchId)
        .orderBy('quantity', 'asc')
        .execute()

      expect(batch?.currentQuantity).toBe(95)
      expect(mortalityRecords).toHaveLength(2)
      expect(mortalityRecords[0].quantity).toBe(2)
      expect(mortalityRecords[0].cause).toBe('predator')
      expect(mortalityRecords[1].quantity).toBe(3)
      expect(mortalityRecords[1].cause).toBe('disease')
    })
  })
})
