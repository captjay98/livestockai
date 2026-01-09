import { db } from '~/lib/db'
import { verifyFarmAccess } from '~/lib/auth/middleware'

export interface CreateEggRecordInput {
  batchId: string
  date: Date
  quantityCollected: number
  quantityBroken: number
  quantitySold: number
}

export async function createEggRecord(
  userId: string,
  farmId: string,
  input: CreateEggRecordInput,
): Promise<string> {
  await verifyFarmAccess(userId, farmId)

  // Verify batch belongs to farm and is a layer batch
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'farmId', 'species', 'livestockType'])
    .where('id', '=', input.batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!batch) {
    throw new Error('Batch not found or does not belong to this farm')
  }

  if (batch.livestockType !== 'poultry') {
    throw new Error('Egg records can only be created for poultry batches')
  }

  const result = await db
    .insertInto('egg_records')
    .values({
      batchId: input.batchId,
      date: input.date,
      quantityCollected: input.quantityCollected,
      quantityBroken: input.quantityBroken,
      quantitySold: input.quantitySold,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export async function getEggRecordsForBatch(
  userId: string,
  farmId: string,
  batchId: string,
) {
  await verifyFarmAccess(userId, farmId)

  return db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      'egg_records.id',
      'egg_records.batchId',
      'egg_records.date',
      'egg_records.quantityCollected',
      'egg_records.quantityBroken',
      'egg_records.quantitySold',
      'egg_records.createdAt',
    ])
    .where('egg_records.batchId', '=', batchId)
    .where('batches.farmId', '=', farmId)
    .orderBy('egg_records.date', 'desc')
    .execute()
}

export async function getEggRecordsForFarm(userId: string, farmId: string) {
  await verifyFarmAccess(userId, farmId)

  return db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      'egg_records.id',
      'egg_records.batchId',
      'egg_records.date',
      'egg_records.quantityCollected',
      'egg_records.quantityBroken',
      'egg_records.quantitySold',
      'egg_records.createdAt',
      'batches.species',
      'batches.currentQuantity',
    ])
    .where('batches.farmId', '=', farmId)
    .where('batches.livestockType', '=', 'poultry')
    .orderBy('egg_records.date', 'desc')
    .execute()
}

export async function getEggSummaryForFarm(userId: string, farmId: string) {
  await verifyFarmAccess(userId, farmId)

  const records = await db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      'egg_records.quantityCollected',
      'egg_records.quantityBroken',
      'egg_records.quantitySold',
      'batches.currentQuantity',
    ])
    .where('batches.farmId', '=', farmId)
    .execute()

  const totalCollected = records.reduce(
    (sum, r) => sum + r.quantityCollected,
    0,
  )
  const totalBroken = records.reduce((sum, r) => sum + r.quantityBroken, 0)
  const totalSold = records.reduce((sum, r) => sum + r.quantitySold, 0)
  const currentInventory = totalCollected - totalBroken - totalSold

  return {
    totalCollected,
    totalBroken,
    totalSold,
    currentInventory,
    recordCount: records.length,
  }
}

export async function calculateLayingPercentage(
  userId: string,
  farmId: string,
  batchId: string,
  date?: Date,
): Promise<number | null> {
  await verifyFarmAccess(userId, farmId)

  // Get batch current quantity
  const batch = await db
    .selectFrom('batches')
    .select(['currentQuantity'])
    .where('id', '=', batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!batch || batch.currentQuantity === 0) {
    return null
  }

  // Get eggs collected for the date (or most recent)
  let query = db
    .selectFrom('egg_records')
    .select(['quantityCollected'])
    .where('batchId', '=', batchId)

  if (date) {
    query = query.where('date', '=', date)
  } else {
    query = query.orderBy('date', 'desc').limit(1)
  }

  const record = await query.executeTakeFirst()

  if (!record) {
    return null
  }

  const layingPercentage =
    (record.quantityCollected / batch.currentQuantity) * 100
  return Math.round(layingPercentage * 100) / 100
}

export async function getEggInventory(
  userId: string,
  farmId: string,
  batchId?: string,
): Promise<number> {
  await verifyFarmAccess(userId, farmId)

  let query = db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      'egg_records.quantityCollected',
      'egg_records.quantityBroken',
      'egg_records.quantitySold',
    ])
    .where('batches.farmId', '=', farmId)

  if (batchId) {
    query = query.where('egg_records.batchId', '=', batchId)
  }

  const records = await query.execute()

  const totalCollected = records.reduce(
    (sum, r) => sum + r.quantityCollected,
    0,
  )
  const totalBroken = records.reduce((sum, r) => sum + r.quantityBroken, 0)
  const totalSold = records.reduce((sum, r) => sum + r.quantitySold, 0)

  return totalCollected - totalBroken - totalSold
}
