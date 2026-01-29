import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  seedTestFarm,
  seedTestUser,
  truncateAllTables,
} from '../helpers/db-integration'

describe.skipIf(!process.env.DATABASE_URL_TEST)(
  'Customers Integration Tests',
  () => {
    let userId: string
    let farmId: string

    beforeEach(async () => {
      await truncateAllTables()

      const user = await seedTestUser({ email: 'farmer@test.com' })
      userId = user.userId

      const farm = await seedTestFarm(userId)
      farmId = farm.farmId
    })

    afterAll(async () => {
      await closeTestDb()
    })

    it('creates customer with farmId foreign key', async () => {
      const db = getTestDb()

      const result = await db
        .insertInto('customers')
        .values({
          farmId,
          name: 'Test Customer',
          phone: '1234567890',
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      expect(result.id).toBeDefined()
    })

    it('enforces farmId foreign key constraint', async () => {
      const db = getTestDb()

      await expect(
        db
          .insertInto('customers')
          .values({
            farmId: '00000000-0000-0000-0000-000000000000',
            name: 'Test Customer',
            phone: '1234567890',
          })
          .execute(),
      ).rejects.toThrow()
    })

    it('cascades delete when farm is deleted', async () => {
      const db = getTestDb()

      const customer = await db
        .insertInto('customers')
        .values({
          farmId,
          name: 'Test Customer',
          phone: '1234567890',
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      // Delete farm
      await db.deleteFrom('farms').where('id', '=', farmId).execute()

      // Customer should be deleted too
      const deletedCustomer = await db
        .selectFrom('customers')
        .where('id', '=', customer.id)
        .selectAll()
        .executeTakeFirst()

      expect(deletedCustomer).toBeUndefined()
    })
  },
)
