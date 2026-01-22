import { createServerFn } from '@tanStack/react-start'
import { z } from 'zod'
import {
  canChangeUserRole,
  canDeleteFarm,
  canRemoveUserFromFarm,
  validateFarmData,
  validateFarmRole,
  validateUpdateData,
} from './service'
import {
  assignUserToFarm as assignUserToFarmDb,
  checkFarmDependents,
  checkFarmExists,
  checkUserExists,
  countOtherOwners,
  deleteFarm as deleteFarmDb,
  deleteUserFarm,
  deleteUserFarmAssignments,
  getAllFarms,
  getFarmById as getFarmByIdDb,
  getFarmMembers,
  getFarmStats as getFarmStatsDb,
  getFarmsByIds,
  getIsAdmin,
  getUserFarmsWithRoles,
  insertFarm,
  updateFarm as updateFarmDb,
  updateUserFarmRole,
  upsertUserFarm,
} from './repository'
import type { CreateFarmData, UpdateFarmData } from './service'
import type { FarmRecord } from './repository'
import { AppError } from '~/lib/errors'
import { toNumber } from '~/features/settings/currency'

// Re-export types for backwards compatibility
export type { CreateFarmData, UpdateFarmData }

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
    // Validate input
    const validationError = validateFarmData(data)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', {
        message: validationError,
      })
    }

    // Insert farm
    const farmId = await insertFarm(db, data)

    // Create default modules based on farm type
    await createDefaultModules(farmId, data.type)

    // Assign creator as owner if userId provided
    if (creatorUserId) {
      await assignUserToFarmDb(db, creatorUserId, farmId, 'owner')
    }

    return farmId
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
export async function getFarms(): Promise<Array<FarmRecord>> {
  const { db } = await import('~/lib/db')

  try {
    return await getAllFarms(db)
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
export async function getFarmsForUser(
  userId: string,
): Promise<Array<FarmRecord>> {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('../auth/utils')

  try {
    const isAdmin = await getIsAdmin(db, userId)

    // Admins see all farms
    if (isAdmin) {
      return await getAllFarms(db)
    }

    // Regular users get their assigned farms
    const farmIds = await getUserFarms(userId)

    if (farmIds.length === 0) {
      return []
    }

    return await getFarmsByIds(db, farmIds)
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
export async function getFarmById(
  farmId: string,
  userId: string,
): Promise<FarmRecord | null> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const hasAccess = await checkFarmAccess(userId, farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }

    return await getFarmByIdDb(db, farmId)
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
export async function updateFarmAction(
  farmId: string,
  userId: string,
  data: UpdateFarmData,
): Promise<FarmRecord | null> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const hasAccess = await checkFarmAccess(userId, farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }

    // Validate update data
    const validationError = validateUpdateData(data)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', {
        message: validationError,
      })
    }

    // Build update object
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

    await updateFarmDb(db, farmId, updateData)

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
    return updateFarmAction(data.farmId, session.user.id, {
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
export async function deleteFarm(farmId: string): Promise<void> {
  const { db } = await import('~/lib/db')

  try {
    // Check for dependent records
    const dependents = await checkFarmDependents(db, farmId)

    // Use service layer to check if deletion is allowed
    if (!canDeleteFarm(dependents)) {
      throw new AppError('VALIDATION_ERROR', {
        metadata: { reason: 'farmDeleteFailed' },
      })
    }

    // Remove user assignments
    await deleteUserFarmAssignments(db, farmId)

    // Delete the farm
    await deleteFarmDb(db, farmId)
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
export async function getFarmStats(
  farmId: string,
  userId: string,
): Promise<{
  batches: {
    total: number
    active: number
    totalLivestock: number
  }
  sales: {
    count: number
    revenue: number
  }
  expenses: {
    count: number
    amount: number
  }
}> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const hasAccess = await checkFarmAccess(userId, farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }

    const stats = await getFarmStatsDb(db, farmId)

    return {
      batches: {
        total: stats.batches.total,
        active: stats.batches.active,
        totalLivestock: stats.batches.totalLivestock,
      },
      sales: {
        count: stats.sales.count,
        revenue: toNumber(String(stats.sales.revenue)), // in Naira
      },
      expenses: {
        count: stats.expenses.count,
        amount: toNumber(String(stats.expenses.amount)), // in Naira
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

      // Validate role
      const roleError = validateFarmRole(data.role)
      if (roleError) {
        throw new AppError('VALIDATION_ERROR', {
          message: roleError,
        })
      }

      // Check if user exists
      const userExists = await checkUserExists(db, data.userId)
      if (!userExists) {
        throw new AppError('USER_NOT_FOUND', {
          metadata: { userId: data.userId },
        })
      }

      // Check if farm exists
      const farmExists = await checkFarmExists(db, data.farmId)
      if (!farmExists) {
        throw new AppError('FARM_NOT_FOUND', {
          metadata: { farmId: data.farmId },
        })
      }

      // Upsert assignment
      await upsertUserFarm(db, data.userId, data.farmId, data.role)

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
        const otherOwnersCount = await countOtherOwners(
          db,
          data.farmId,
          data.userId,
        )

        // Use service layer to check if removal is allowed
        const result = canRemoveUserFromFarm(true, otherOwnersCount)
        if (!result.canRemove) {
          throw new AppError('VALIDATION_ERROR', {
            metadata: { reason: 'lastOwnerRemove' },
          })
        }
      }

      // Remove the assignment
      await deleteUserFarm(db, data.userId, data.farmId)

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

      // Validate role
      const roleError = validateFarmRole(data.role)
      if (roleError) {
        throw new AppError('VALIDATION_ERROR', {
          message: roleError,
        })
      }

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
        const otherOwnersCount = await countOtherOwners(
          db,
          data.farmId,
          data.userId,
        )

        // Use service layer to check if role change is allowed
        const result = canChangeUserRole(
          assignment.role,
          data.role,
          otherOwnersCount,
        )
        if (!result.canChange) {
          throw new AppError('VALIDATION_ERROR', {
            metadata: { reason: 'lastOwnerDemote' },
          })
        }
      }

      // Update the role
      await updateUserFarmRole(db, data.userId, data.farmId, data.role)

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

      return await getFarmMembers(db, data.farmId)
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
    const isAdmin = await getIsAdmin(db, session.user.id)

    if (isAdmin) {
      // Admin gets all farms as owner
      const farms = await getAllFarms(db)

      return farms.map((f) => ({ ...f, farmRole: 'owner' as const }))
    }

    // Regular user gets their assigned farms
    return await getUserFarmsWithRoles(db, session.user.id)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch user farms with roles',
      cause: error,
    })
  }
})
