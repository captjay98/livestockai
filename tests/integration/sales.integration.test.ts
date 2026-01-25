import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  seedTestBatch,
  seedTestFarm,
  seedTestUser,
  truncateAllTables,
} from '../helpers/db-integration'

describe.skipIf(!process.env.DATABASE_URL_TEST)(
  'Sales Integration Tests',
  () => {
    let userId: string
    let farmId: string
    let batchId: string

    beforeEach(async () => {
      if (!process.env.DATABASE_URL_TEST) return
      await truncateAllTables()

      const user = await seedTestUser({ email: 'farmer@test.com' })
      userId = user.userId

      const farm = await seedTestFarm(userId, {
        name: 'Test Farm',
        type: 'poultry',
        modules: ['poultry'],
      })
      farmId = farm.farmId

      const batch = await seedTestBatch(farmId, {
        livestockType: 'poultry',
        species: 'broiler',
        initialQuantity: 100,
      })
      batchId = batch.batchId
    })

    afterAll(async () => {
      await closeTestDb()
    })

    it('should create sale linked to batch and decrease quantity', async () => {
      if (!process.env.DATABASE_URL_TEST) return

      const db = getTestDb()

      // Create sale
      await db
        .insertInto('sales')
        .values({
          farmId,
          batchId,
          livestockType: 'poultry',
          quantity: 20,
          unitPrice: '500.00',
          totalAmount: '10000.00',
          date: new Date(),
          paymentStatus: 'paid',
        })
        .execute()

      // Update batch quantity
      await db
        .updateTable('batches')
        .set({ currentQuantity: 80 })
        .where('id', '=', batchId)
        .execute()

      // Verify sale created
      const sale = await db
        .selectFrom('sales')
        .selectAll()
        .where('batchId', '=', batchId)
        .executeTakeFirst()

      expect(sale).toBeDefined()
      expect(sale!.quantity).toBe(20)
      expect(sale!.totalAmount).toBe('10000.00')

      // Verify batch quantity decreased
      const batch = await db
        .selectFrom('batches')
        .select(['currentQuantity'])
        .where('id', '=', batchId)
        .executeTakeFirst()

      expect(batch!.currentQuantity).toBe(80)
    })

    it('should create sale with customer association', async () => {
      if (!process.env.DATABASE_URL_TEST) return

      const db = getTestDb()

      // Create customer
      const customerId = await db
        .insertInto('customers')
        .values({
          farmId,
          name: 'John Doe',
          phone: '1234567890',
          email: 'john@example.com',
        })
        .returning('id')
        .executeTakeFirst()

      // Create sale with customer
      await db
        .insertInto('sales')
        .values({
          farmId,
          batchId,
          customerId: customerId!.id,
          livestockType: 'poultry',
          quantity: 15,
          unitPrice: '600.00',
          totalAmount: '9000.00',
          date: new Date(),
        })
        .execute()

      // Verify customer association
      const sale = await db
        .selectFrom('sales')
        .innerJoin('customers', 'customers.id', 'sales.customerId')
        .select(['sales.quantity', 'customers.name'])
        .where('sales.batchId', '=', batchId)
        .executeTakeFirst()

      expect(sale).toBeDefined()
      expect(sale!.name).toBe('John Doe')
      expect(sale!.quantity).toBe(15)
    })

    it('should calculate sale total correctly', async () => {
      if (!process.env.DATABASE_URL_TEST) return

      const db = getTestDb()

      const quantity = 25
      const unitPrice = '450.00'
      const expectedTotal = (quantity * parseFloat(unitPrice)).toFixed(2)

      await db
        .insertInto('sales')
        .values({
          farmId,
          batchId,
          livestockType: 'poultry',
          quantity,
          unitPrice,
          totalAmount: expectedTotal,
          date: new Date(),
        })
        .execute()

      const sale = await db
        .selectFrom('sales')
        .select(['quantity', 'unitPrice', 'totalAmount'])
        .where('batchId', '=', batchId)
        .executeTakeFirst()

      expect(sale!.totalAmount).toBe('11250.00')
      expect(parseFloat(sale!.totalAmount)).toBe(
        quantity * parseFloat(unitPrice),
      )
    })

    it('should handle payment status transitions', async () => {
      if (!process.env.DATABASE_URL_TEST) return

      const db = getTestDb()

      // Create sale with pending status
      const saleId = await db
        .insertInto('sales')
        .values({
          farmId,
          batchId,
          livestockType: 'poultry',
          quantity: 10,
          unitPrice: '500.00',
          totalAmount: '5000.00',
          date: new Date(),
          paymentStatus: 'pending',
        })
        .returning('id')
        .executeTakeFirst()

      // Update to partial
      await db
        .updateTable('sales')
        .set({ paymentStatus: 'partial' })
        .where('id', '=', saleId!.id)
        .execute()

      let sale = await db
        .selectFrom('sales')
        .select(['paymentStatus'])
        .where('id', '=', saleId!.id)
        .executeTakeFirst()

      expect(sale!.paymentStatus).toBe('partial')

      // Update to paid
      await db
        .updateTable('sales')
        .set({ paymentStatus: 'paid', paymentMethod: 'transfer' })
        .where('id', '=', saleId!.id)
        .execute()

      sale = await db
        .selectFrom('sales')
        .selectAll()
        .where('id', '=', saleId!.id)
        .executeTakeFirst()

      expect(sale!.paymentStatus).toBe('paid')
      expect((sale as any).paymentMethod).toBe('transfer')
    })

    it('should cascade delete sales when batch is deleted', async () => {
      if (!process.env.DATABASE_URL_TEST) return

      const db = getTestDb()

      // Create sales linked to batch
      await db
        .insertInto('sales')
        .values([
          {
            farmId,
            batchId,
            livestockType: 'poultry',
            quantity: 10,
            unitPrice: '500.00',
            totalAmount: '5000.00',
            date: new Date(),
          },
          {
            farmId,
            batchId,
            livestockType: 'poultry',
            quantity: 15,
            unitPrice: '600.00',
            totalAmount: '9000.00',
            date: new Date(),
          },
        ])
        .execute()

      // Verify sales exist
      let sales = await db
        .selectFrom('sales')
        .selectAll()
        .where('batchId', '=', batchId)
        .execute()

      expect(sales.length).toBe(2)

      // Delete batch
      await db.deleteFrom('batches').where('id', '=', batchId).execute()

      // Verify sales are cascade deleted
      sales = await db
        .selectFrom('sales')
        .selectAll()
        .where('batchId', '=', batchId)
        .execute()

      expect(sales.length).toBe(0)
    })

    it('should handle egg sales without batch', async () => {
      if (!process.env.DATABASE_URL_TEST) return

      const db = getTestDb()

      await db
        .insertInto('sales')
        .values({
          farmId,
          batchId: null,
          livestockType: 'eggs',
          quantity: 30,
          unitPrice: '50.00',
          totalAmount: '1500.00',
          date: new Date(),
        })
        .execute()

      const sale = await db
        .selectFrom('sales')
        .selectAll()
        .where('farmId', '=', farmId)
        .where('livestockType', '=', 'eggs')
        .executeTakeFirst()

      expect(sale).toBeDefined()
      expect(sale!.batchId).toBeNull()
      expect(sale!.livestockType).toBe('eggs')
      expect(sale!.totalAmount).toBe('1500.00')
    })
  },
)
