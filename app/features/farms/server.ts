import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { toNumber } from '~/features/settings/currency'

export interface CreateFarmData {
  name: string
  location: string
  type:
    | 'poultry'
    | 'aquaculture'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'
}

export interface UpdateFarmData {
  name?: string
  location?: string
  type?:
    | 'poultry'
    | 'aquaculture'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'
}

/**
 * Create a new farm and assign creator as owner
 */
export async function createFarm(
  data: CreateFarmData,
  creatorUserId?: string,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { createDefaultModules } = await import('~/features/modules/server')

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

  // Assign creator as owner if userId provided
  if (creatorUserId) {
    await db
      .insertInto('user_farms')
      .values({
        userId: creatorUserId,
        farmId: result.id,
        role: 'owner',
      })
      .execute()
  }

  return result.id
}

/**
 * Get all farms (admin use)
 */
export async function getFarms() {
  const { db } = await import('~/lib/db')

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
  const { db } = await import('~/lib/db')
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
  const { db } = await import('~/lib/db')
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
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  const hasAccess = await checkFarmAccess(userId, farmId)

  if (!hasAccess) {
    throw new Error('Access denied to this farm')
  }

  const updateData: {
    name?: string
    location?: string
    type?:
      | 'poultry'
      | 'aquaculture'
      | 'mixed'
      | 'cattle'
      | 'goats'
      | 'sheep'
      | 'bees'
      | 'multi'
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
      type: 'poultry' | 'aquaculture' | 'mixed'
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
  const { db } = await import('~/lib/db')

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
  const { db } = await import('~/lib/db')
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
    const session = await requireAuth()
    return createFarm(data, session.user.id)
  })

// Schema definitions for farm assignments
const assignUserSchema = z.object({
  userId: z.string().uuid(),
  farmId: z.string().uuid(),
  role: z.enum(['owner', 'manager', 'viewer']),
})

const removeUserSchema = z.object({
  userId: z.string().uuid(),
  farmId: z.string().uuid(),
})

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  farmId: z.string().uuid(),
  role: z.enum(['owner', 'manager', 'viewer']),
})

/**
 * Assign a user to a farm with a role (admin only)
 */
export const assignUserToFarmFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof assignUserSchema>) =>
    assignUserSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('~/lib/db')

    // Check if user exists
    const user = await db
      .selectFrom('users')
      .select(['id'])
      .where('id', '=', data.userId)
      .executeTakeFirst()

    if (!user) {
      throw new Error('User not found')
    }

    // Check if farm exists
    const farm = await db
      .selectFrom('farms')
      .select(['id'])
      .where('id', '=', data.farmId)
      .executeTakeFirst()

    if (!farm) {
      throw new Error('Farm not found')
    }

    // Insert or update assignment
    await db
      .insertInto('user_farms')
      .values({
        userId: data.userId,
        farmId: data.farmId,
        role: data.role,
      })
      .onConflict((oc) =>
        oc.columns(['userId', 'farmId']).doUpdateSet({ role: data.role }),
      )
      .execute()

    return { success: true }
  })

/**
 * Remove a user from a farm (admin only, with last owner protection)
 */
export const removeUserFromFarmFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof removeUserSchema>) =>
    removeUserSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('~/lib/db')

    // Get the user's current role in this farm
    const assignment = await db
      .selectFrom('user_farms')
      .select(['role'])
      .where('userId', '=', data.userId)
      .where('farmId', '=', data.farmId)
      .executeTakeFirst()

    if (!assignment) {
      throw new Error('User is not assigned to this farm')
    }

    // If user is an owner, check if they're the last owner
    if (assignment.role === 'owner') {
      const otherOwners = await db
        .selectFrom('user_farms')
        .select(['userId'])
        .where('farmId', '=', data.farmId)
        .where('role', '=', 'owner')
        .where('userId', '!=', data.userId)
        .execute()

      if (otherOwners.length === 0) {
        throw new Error('Cannot remove the last owner from a farm')
      }
    }

    // Remove the assignment
    await db
      .deleteFrom('user_farms')
      .where('userId', '=', data.userId)
      .where('farmId', '=', data.farmId)
      .execute()

    return { success: true }
  })

/**
 * Update a user's role in a farm (admin only, with last owner protection)
 */
export const updateUserFarmRoleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof updateRoleSchema>) =>
    updateRoleSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('~/lib/db')

    // Get the user's current role
    const assignment = await db
      .selectFrom('user_farms')
      .select(['role'])
      .where('userId', '=', data.userId)
      .where('farmId', '=', data.farmId)
      .executeTakeFirst()

    if (!assignment) {
      throw new Error('User is not assigned to this farm')
    }

    // If demoting from owner, check if they're the last owner
    if (assignment.role === 'owner' && data.role !== 'owner') {
      const otherOwners = await db
        .selectFrom('user_farms')
        .select(['userId'])
        .where('farmId', '=', data.farmId)
        .where('role', '=', 'owner')
        .where('userId', '!=', data.userId)
        .execute()

      if (otherOwners.length === 0) {
        throw new Error('Cannot demote the last owner of a farm')
      }
    }

    // Update the role
    await db
      .updateTable('user_farms')
      .set({ role: data.role })
      .where('userId', '=', data.userId)
      .where('farmId', '=', data.farmId)
      .execute()

    return { success: true }
  })

/**
 * Get all users assigned to a farm (admin only)
 */
export const getFarmMembersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) =>
    z.object({ farmId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('~/lib/db')

    return db
      .selectFrom('user_farms')
      .innerJoin('users', 'users.id', 'user_farms.userId')
      .select([
        'users.id',
        'users.name',
        'users.email',
        'users.role as globalRole',
        'user_farms.role as farmRole',
      ])
      .where('user_farms.farmId', '=', data.farmId)
      .orderBy('user_farms.role', 'asc')
      .execute()
  })

/**
 * Get farms with roles for the current user
 */
export const getUserFarmsWithRolesFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { requireAuth } = await import('../auth/server-middleware')
  const session = await requireAuth()

  const { db } = await import('~/lib/db')

  // Check if user is admin
  const user = await db
    .selectFrom('users')
    .select(['role'])
    .where('id', '=', session.user.id)
    .executeTakeFirst()

  if (user?.role === 'admin') {
    // Admin gets all farms as owner
    const farms = await db
      .selectFrom('farms')
      .select(['id', 'name', 'location', 'type'])
      .orderBy('name', 'asc')
      .execute()

    return farms.map((f) => ({ ...f, farmRole: 'owner' as const }))
  }

  // Regular user gets their assigned farms
  return db
    .selectFrom('user_farms')
    .innerJoin('farms', 'farms.id', 'user_farms.farmId')
    .select([
      'farms.id',
      'farms.name',
      'farms.location',
      'farms.type',
      'user_farms.role as farmRole',
    ])
    .where('user_farms.userId', '=', session.user.id)
    .orderBy('farms.name', 'asc')
    .execute()
})
