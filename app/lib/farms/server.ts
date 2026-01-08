import { db } from '../db'
import { getUserFarms, checkFarmAccess } from '../auth/middleware'
import { toNumber } from '../currency'

export interface CreateFarmData {
  name: string
  location: string
  type: 'poultry' | 'fishery' | 'mixed'
}

export interface UpdateFarmData {
  name?: string
  location?: string
  type?: 'poultry' | 'fishery' | 'mixed'
}

/**
 * Create a new farm
 */
export async function createFarm(data: CreateFarmData): Promise<string> {
  const result = await db
    .insertInto('farms')
    .values({
      name: data.name,
      location: data.location,
      type: data.type,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Get all farms (admin use)
 */
export async function getFarms() {
  return await db
    .selectFrom('farms')
    .selectAll()
    .orderBy('name', 'asc')
    .execute()
}

/**
 * Get all farms accessible to a user
 */
export async function getFarmsForUser(userId: string) {
  const farmIds = await getUserFarms(userId)
  
  if (farmIds.length === 0) {
    return []
  }

  return await db
    .selectFrom('farms')
    .selectAll()
    .where('id', 'in', farmIds)
    .orderBy('name', 'asc')
    .execute()
}

/**
 * Get a single farm by ID (with access check)
 */
export async function getFarmById(farmId: string, userId: string) {
  const hasAccess = await checkFarmAccess(userId, farmId)
  
  if (!hasAccess) {
    throw new Error('Access denied to this farm')
  }

  return await db
    .selectFrom('farms')
    .selectAll()
    .where('id', '=', farmId)
    .executeTakeFirst()
}

/**
 * Update a farm
 */
export async function updateFarm(farmId: string, userId: string, data: UpdateFarmData) {
  const hasAccess = await checkFarmAccess(userId, farmId)
  
  if (!hasAccess) {
    throw new Error('Access denied to this farm')
  }

  const updateData: {
    name?: string
    location?: string
    type?: 'poultry' | 'fishery' | 'mixed'
  } = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.location !== undefined) updateData.location = data.location
  if (data.type !== undefined) updateData.type = data.type

  await db
    .updateTable('farms')
    .set(updateData)
    .where('id', '=', farmId)
    .execute()

  return await getFarmById(farmId, userId)
}

/**
 * Delete a farm (admin only - checked at route level)
 */
export async function deleteFarm(farmId: string) {
  // First check if farm has any dependent records
  const [batches, sales, expenses] = await Promise.all([
    db.selectFrom('batches').select('id').where('farmId', '=', farmId).executeTakeFirst(),
    db.selectFrom('sales').select('id').where('farmId', '=', farmId).executeTakeFirst(),
    db.selectFrom('expenses').select('id').where('farmId', '=', farmId).executeTakeFirst(),
  ])

  if (batches || sales || expenses) {
    throw new Error('Cannot delete farm with existing records. Please delete all batches, sales, and expenses first.')
  }

  // Remove user assignments
  await db
    .deleteFrom('user_farms')
    .where('farmId', '=', farmId)
    .execute()

  // Delete the farm
  await db
    .deleteFrom('farms')
    .where('id', '=', farmId)
    .execute()
}

/**
 * Get farm statistics
 */
export async function getFarmStats(farmId: string, userId: string) {
  const hasAccess = await checkFarmAccess(userId, farmId)
  
  if (!hasAccess) {
    throw new Error('Access denied to this farm')
  }

  const [batchStats, salesStats, expenseStats] = await Promise.all([
    // Batch statistics
    db
      .selectFrom('batches')
      .select([
        db.fn.count('id').as('total_batches'),
        db.fn.sum('currentQuantity').as('total_livestock'),
        db.fn.count('id').filterWhere('status', '=', 'active').as('active_batches'),
      ])
      .where('farmId', '=', farmId)
      .executeTakeFirst(),

    // Sales statistics (last 30 days)
    db
      .selectFrom('sales')
      .select([
        db.fn.count('id').as('total_sales'),
        db.fn.sum('totalAmount').as('total_revenue'),
      ])
      .where('farmId', '=', farmId)
      .where('date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .executeTakeFirst(),

    // Expense statistics (last 30 days)
    db
      .selectFrom('expenses')
      .select([
        db.fn.count('id').as('total_expenses'),
        db.fn.sum('amount').as('total_amount'),
      ])
      .where('farmId', '=', farmId)
      .where('date', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .executeTakeFirst(),
  ])

  return {
    batches: {
      total: Number(batchStats?.total_batches || 0),
      active: Number(batchStats?.active_batches || 0),
      totalLivestock: Number(batchStats?.total_livestock || 0),
    },
    sales: {
      count: Number(salesStats?.total_sales || 0),
      revenue: toNumber(String(salesStats?.total_revenue || '0')), // in Naira
    },
    expenses: {
      count: Number(expenseStats?.total_expenses || 0),
      amount: toNumber(String(expenseStats?.total_amount || '0')), // in Naira
    },
  }
}
