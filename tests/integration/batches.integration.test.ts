import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  seedTestBatch,
  seedTestFarm,
  seedTestUser,
  truncateAllTables,
} from '../helpers/db-integration'

describe('Batches Integration Tests', () => {
  let userId: string
  let farmId: string

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
  })

  afterAll(async () => {
    await closeTestDb()
  })

  it('should create batch with correct initial values', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const { batchId } = await seedTestBatch(farmId, {
      livestockType: 'poultry',
      species: 'broiler',
      initialQuantity: 100,
    })

    const db = getTestDb()
    const batch = await db
      .selectFrom('batches')
      .selectAll()
      .where('id', '=', batchId)
      .executeTakeFirst()

    expect(batch).toBeDefined()
    expect(batch!.farmId).toBe(farmId)
    expect(batch!.initialQuantity).toBe(100)
    expect(batch!.currentQuantity).toBe(100)
    expect(batch!.status).toBe('active')
  })

  it('should enforce initialQuantity > 0 constraint', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const db = getTestDb()
    await expect(
      db.insertInto('batches').values({
        farmId,
        livestockType: 'poultry',
        species: 'broiler',
        initialQuantity: 0,
        currentQuantity: 0,
        acquisitionDate: new Date(),
        costPerUnit: '10.00',
        totalCost: '0.00',
        status: 'active',
      }).execute(),
    ).rejects.toThrow()
  })

  it('should record mortality and verify quantity update', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const { batchId } = await seedTestBatch(farmId, { initialQuantity: 100 })
    const db = getTestDb()

    await db.insertInto('mortality_records').values({
      batchId,
      quantity: 5,
      date: new Date(),
      cause: 'disease',
    }).execute()

    await db.updateTable('batches')
      .set({ currentQuantity: 95 })
      .where('id', '=', batchId)
      .execute()

    const batch = await db.selectFrom('batches')
      .select(['currentQuantity'])
      .where('id', '=', batchId)
      .executeTakeFirst()

    expect(batch!.currentQuantity).toBe(95)
  })

  it('should record sale linked to batch', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const { batchId } = await seedTestBatch(farmId, { initialQuantity: 100 })
    const db = getTestDb()

    await db.insertInto('sales').values({
      farmId,
      batchId,
      livestockType: 'poultry',
      quantity: 20,
      unitPrice: '500.00',
      totalAmount: '10000.00',
      date: new Date(),
    }).execute()

    const sales = await db.selectFrom('sales')
      .selectAll()
      .where('batchId', '=', batchId)
      .execute()

    expect(sales.length).toBe(1)
    expect(sales[0].quantity).toBe(20)
  })

  it('should reject invalid batch status', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const { batchId } = await seedTestBatch(farmId)
    const db = getTestDb()

    await expect(
      db.updateTable('batches')
        .set({ status: 'invalid' as any })
        .where('id', '=', batchId)
        .execute(),
    ).rejects.toThrow()
  })

  it('should cascade delete batch records', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const { batchId } = await seedTestBatch(farmId)
    const db = getTestDb()

    await db.insertInto('mortality_records').values({
      batchId, quantity: 5, date: new Date(), cause: 'disease',
    }).execute()

    await db.insertInto('feed_records').values({
      batchId, feedType: 'starter', quantityKg: '10.00', cost: '500.00', date: new Date(),
    }).execute()

    await db.deleteFrom('batches').where('id', '=', batchId).execute()

    const mortality = await db.selectFrom('mortality_records').where('batchId', '=', batchId).execute()
    const feed = await db.selectFrom('feed_records').where('batchId', '=', batchId).execute()

    expect(mortality.length).toBe(0)
    expect(feed.length).toBe(0)
  })
})
