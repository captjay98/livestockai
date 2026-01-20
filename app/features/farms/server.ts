import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { toNumber } from '~/features/settings/currency'
import { AppError } from '~/lib/errors'

/**
 * Data structure for creating a new farm.
 */
export interface CreateFarmData {
  /** Display name of the farm */
  name: string
  /** Physical or geographical location description */
  location: string
  /**
   * Primary livestock focus of the farm.
   * Helps determine which modules are enabled by default.
   */
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

/**
 * Data structure for updating an existing farm's details.
 */
export interface UpdateFarmData {
  /** New display name */
  name?: string
  /** New location description */
  location?: string
  /** New primary livestock focus */
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
 * Create a new farm and assign the creator as the owner.
 * Automatically initializes default modules for the farm.
 *
 * @param data - Farm details (name, location, type)
 * @param creatorUserId - ID of the user creating the farm (optional)
 * @returns Promise resolving to the new farm's ID
 */
export async function createFarm(
  data: CreateFarmData,
  creatorUserId?: string,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { createDefaultModules } = await import('~/features/modules/server')

  try {
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create farm',
      cause: error,
    })
  }
}

/**
 * Retrieve all farms in the system.
 * This is an administrative function and should be protected.
 *
 * @returns Promise resolving to an array of all farms
 */
export async function getFarms() {
  const { db } = await import('~/lib/db')

  try {
    return await db
      .selectFrom('farms')
      .selectAll()
      .orderBy('name', 'asc')
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch farms',
      cause: error,
    })
  }
}

/**
 * Retrieve all farms that a specific user has access to.
 *
 * @param userId - ID of the user
 * @returns Promise resolving to an array of farms accessible to the user
 */
export async function getFarmsForUser(userId: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('../auth/utils')

  try {
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch user farms',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve all farms accessible to the currently authenticated user.
 *
 * @returns Promise resolving to an array of farms
 */
export const getFarmsForUserFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return getFarmsForUser(session.user.id)
  },
)

/**
 * Retrieve a single farm by its ID, with a security check to ensure the user has access.
 *
 * @param farmId - ID of the farm to retrieve
 * @param userId - ID of the user requesting the farm
 * @returns Promise resolving to the farm object or undefined if not found/denied
 * @throws {Error} If user does not have access to the farm
 */
export async function getFarmById(farmId: string, userId: string) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const hasAccess = await checkFarmAccess(userId, farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }

    return await db
      .selectFrom('farms')
      .selectAll()
      .where('id', '=', farmId)
      .executeTakeFirst()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch farm details',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve a specific farm by ID for the current user.
 *
 * @param data - Object containing the farmId
 * @returns Promise resolving to the farm object
 */
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

  try {
    const hasAccess = await checkFarmAccess(userId, farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update farm',
      cause: error,
    })
  }
}

/**
 * Server function to update a farm's details.
 *
 * @param data - Farm ID and updated details
 * @returns Promise resolving to the updated farm object
 */
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
 * Permanently delete a farm and its associated user mappings.
 * Fails if the farm still has active batches, sales, or expenses.
 *
 * @param farmId - ID of the farm to delete
 * @throws {Error} If the farm has dependent records
 */
export async function deleteFarm(farmId: string) {
  const { db } = await import('~/lib/db')

  try {
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
      throw new AppError('VALIDATION_ERROR', {
        metadata: { reason: 'farmDeleteFailed' },
      })
    }

    // Remove user assignments
    await db.deleteFrom('user_farms').where('farmId', '=', farmId).execute()

    // Delete the farm
    await db.deleteFrom('farms').where('id', '=', farmId).execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete farm',
      cause: error,
    })
  }
}

/**
 * Calculate and retrieve key statistics for a farm, including livestock count,
 * recent sales volume, and expense totals.
 *
 * @param farmId - ID of the farm
 * @param userId - ID of the user requesting stats
 * @returns Promise resolving to a statistics summary object
 * @throws {Error} If access is denied
 */
export async function getFarmStats(farmId: string, userId: string) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const hasAccess = await checkFarmAccess(userId, farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch farm stats',
      cause: error,
    })
  }
}

// Server function to create a farm with auth
/**
 * Server function to create a new farm and assign the current user as owner.
 *
 * @param data - Farm creation details
 * @returns Promise resolving to the new farm ID
 */
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
    try {
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
        throw new AppError('USER_NOT_FOUND', {
          metadata: { userId: data.userId },
        })
      }

      // Check if farm exists
      const farm = await db
        .selectFrom('farms')
        .select(['id'])
        .where('id', '=', data.farmId)
        .executeTakeFirst()

      if (!farm) {
        throw new AppError('FARM_NOT_FOUND', {
          metadata: { farmId: data.farmId },
        })
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
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to assign user to farm',
        cause: error,
      })
    }
  })

/**
 * Remove a user from a farm (admin only, with last owner protection)
 */
export const removeUserFromFarmFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof removeUserSchema>) =>
    removeUserSchema.parse(data),
  )
  .handler(async ({ data }) => {
    try {
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
        throw new AppError('VALIDATION_ERROR', {
          metadata: { reason: 'userNotAssigned' },
        })
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
          throw new AppError('VALIDATION_ERROR', {
            metadata: { reason: 'lastOwnerRemove' },
          })
        }
      }

      // Remove the assignment
      await db
        .deleteFrom('user_farms')
        .where('userId', '=', data.userId)
        .where('farmId', '=', data.farmId)
        .execute()

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to remove user from farm',
        cause: error,
      })
    }
  })

/**
 * Update a user's role in a farm (admin only, with last owner protection)
 */
export const updateUserFarmRoleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof updateRoleSchema>) =>
    updateRoleSchema.parse(data),
  )
  .handler(async ({ data }) => {
    try {
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
        throw new AppError('VALIDATION_ERROR', {
          metadata: { reason: 'userNotAssigned' },
        })
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
          throw new AppError('VALIDATION_ERROR', {
            metadata: { reason: 'lastOwnerDemote' },
          })
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
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to update user role',
        cause: error,
      })
    }
  })

/**
 * Get all users assigned to a farm (admin only)
 */
export const getFarmMembersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) =>
    z.object({ farmId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const { requireAdmin } = await import('../auth/server-middleware')
      await requireAdmin()

      const { db } = await import('~/lib/db')

      return await db
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
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch farm members',
        cause: error,
      })
    }
  })

/**
 * Get farms with roles for the current user
 */
export const getUserFarmsWithRolesFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
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
    return await db
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch user farms with roles',
      cause: error,
    })
  }
})
