import { createServerFn } from '@tanstack/react-start'
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
  const { db } = await import('../db')
  const { createDefaultModules } = await import('../modules/server')

  const result = await db
    .insertInto('farms')
    .values({
      name: data.name,
      location: data.location,
      type: data.type,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  // Create default modules based on farm type
  await createDefaultModules(result.id, data.type)

  return result.id
}

/**
 * Get all farms (admin use)
 */
export async function getFarms() {
  const { db } = await import('../db')

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
  const { db } = await import('../db')
  const { getUserFarms } = await import('../auth/utils')

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

// Server function for client-side calls
export const getFarmsForUserFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return getFarmsForUser(session.user.id)
  },
)

/**
 * Get a single farm by ID (with access check)
 */
export async function getFarmById(farmId: string, userId: string) {
  const { db } = await import('../db')
  const { checkFarmAccess } = await import('../auth/utils')

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

// Server function for client-side calls
export const getFarmByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return getFarmById(data.farmId, session.user.id)
  })

/**
 * Update a farm
 */
export async function updateFarm(
  farmId: string,
  userId: string,
  data: UpdateFarmData,
) {
  const { db } = await import('../db')
  const { checkFarmAccess } = await import('../auth/utils')

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

// Server function for client-side calls
export const updateFarmFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      farmId: string
      name: string
      location: string
      type: 'poultry' | 'fishery' | 'mixed'
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return updateFarm(data.farmId, session.user.id, {
      name: data.name,
      location: data.location,
      type: data.type,
    })
  })

/**
 * Delete a farm (admin only - checked at route level)
 */
export async function deleteFarm(farmId: string) {
  const { db } = await import('../db')

  // First check if farm has any dependent records
  const [batches, sales, expenses] = await Promise.all([
    db
      .selectFrom('batches')
      .select('id')
      .where('farmId', '=', farmId)
      .executeTakeFirst(),
    db
      .selectFrom('sales')
      .select('id')
      .where('farmId', '=', farmId)
      .executeTakeFirst(),
    db
      .selectFrom('expenses')
      .select('id')
      .where('farmId', '=', farmId)
      .executeTakeFirst(),
  ])

  if (batches || sales || expenses) {
    throw new Error(
      'Cannot delete farm with existing records. Please delete all batches, sales, and expenses first.',
    )
  }

  // Remove user assignments
  await db.deleteFrom('user_farms').where('farmId', '=', farmId).execute()

  // Delete the farm
  await db.deleteFrom('farms').where('id', '=', farmId).execute()
}

/**
 * Get farm statistics
 */
export async function getFarmStats(farmId: string, userId: string) {
  const { db } = await import('../db')
  const { checkFarmAccess } = await import('../auth/utils')

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
        db.fn
          .count('id')
          .filterWhere('status', '=', 'active')
          .as('active_batches'),
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

// Server function to create a farm with auth
export const createFarmFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateFarmData) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    return createFarm(data)
  })
