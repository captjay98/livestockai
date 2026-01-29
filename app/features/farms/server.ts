import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { sql } from 'kysely'
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
        const isAdmin = await getIsAdmin(db, userId)

        // Admins see all farms
        if (isAdmin) {
            return await getAllFarms(db)
        }

        // Regular users get their assigned farms
        const userFarms = await getUserFarmsWithRoles(db, userId)
        const farmIds = userFarms.map(f => f.id)

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
export const getFarmsForUserFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({}))
    .handler(async () => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        return getFarmsForUser(session.user.id)
    })

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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
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
    .inputValidator(z.object({ farmId: z.string().uuid() }))
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
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
const updateFarmSchema = z.object({
    farmId: z.string().uuid(),
    name: z.string().min(1).max(100),
    location: z.string().min(1).max(200),
    type: z.enum([
        'poultry',
        'aquaculture',
        'mixed',
        'cattle',
        'goats',
        'sheep',
        'bees',
        'multi',
    ]),
})

export const updateFarmFn = createServerFn({ method: 'POST' })
    .inputValidator(updateFarmSchema)
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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

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
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
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
const createFarmSchema = z.object({
    name: z.string().min(1).max(100),
    location: z.string().min(1).max(200),
    type: z.enum([
        'poultry',
        'aquaculture',
        'mixed',
        'cattle',
        'goats',
        'sheep',
        'bees',
        'multi',
    ]),
    contactPhone: z.string().max(20).nullish(),
    notes: z.string().max(500).nullish(),
})

export const createFarmFn = createServerFn({ method: 'POST' })
    .inputValidator(createFarmSchema)
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
    .inputValidator(assignUserSchema)
    .handler(async ({ data }) => {
        try {
            const { requireAdmin } = await import('../auth/server-middleware')
            await requireAdmin()

            const { getDb } = await import('~/lib/db')
            const db = await getDb()

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
    .inputValidator(removeUserSchema)
    .handler(async ({ data }) => {
        try {
            const { requireAdmin } = await import('../auth/server-middleware')
            await requireAdmin()

            const { getDb } = await import('~/lib/db')
            const db = await getDb()

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
    .inputValidator(updateRoleSchema)
    .handler(async ({ data }) => {
        try {
            const { requireAdmin } = await import('../auth/server-middleware')
            await requireAdmin()

            const { getDb } = await import('~/lib/db')
            const db = await getDb()

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
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        try {
            const { requireAdmin } = await import('../auth/server-middleware')
            await requireAdmin()

            const { getDb } = await import('~/lib/db')
            const db = await getDb()

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
})
    .inputValidator(z.object({}))
    .handler(async () => {
        try {
            const { requireAuth } = await import('../auth/server-middleware')
            const session = await requireAuth()

            const { getDb } = await import('~/lib/db')
            const db = await getDb()

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

/**
 * Get district health comparison for extension workers
 */
export const getFarmHealthComparisonFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { checkObserverAccess } = await import('~/auth/utils')
        await checkObserverAccess(data.farmId)

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        // Get farm's district and species
        const farm = await db
            .selectFrom('farms')
            .select(['districtId'])
            .where('id', '=', data.farmId)
            .where('deletedAt', 'is', null)
            .executeTakeFirst()

        if (!farm?.districtId) {
            return { districtAvgMortality: null, percentileRank: null }
        }

        // Get all batches for this farm with mortality data
        const farmBatches = await db
            .selectFrom('batches')
            .leftJoin(
                'mortality_records',
                'mortality_records.batchId',
                'batches.id',
            )
            .select([
                'batches.species',
                'batches.initialQuantity',
                db.fn
                    .coalesce(db.fn.sum('mortality_records.quantity'), sql`0`)
                    .as('totalMortality'),
            ])
            .where('batches.farmId', '=', data.farmId)
            .where('batches.deletedAt', 'is', null)
            .groupBy([
                'batches.id',
                'batches.species',
                'batches.initialQuantity',
            ])
            .execute()

        if (farmBatches.length === 0) {
            return { districtAvgMortality: null, percentileRank: null }
        }

        // Calculate farm's mortality rate
        const farmMortalityRate =
            farmBatches.reduce((acc, batch) => {
                const rate =
                    batch.initialQuantity > 0
                        ? (Number(batch.totalMortality) /
                              batch.initialQuantity) *
                          100
                        : 0
                return acc + rate
            }, 0) / farmBatches.length

        // Get species from farm batches
        const species = [...new Set(farmBatches.map((b) => b.species))]

        // Get district farms with same species
        const districtFarms = await db
            .selectFrom('farms')
            .leftJoin('batches', 'batches.farmId', 'farms.id')
            .leftJoin(
                'mortality_records',
                'mortality_records.batchId',
                'batches.id',
            )
            .select([
                'farms.id as farmId',
                'batches.species',
                'batches.initialQuantity',
                db.fn
                    .coalesce(db.fn.sum('mortality_records.quantity'), sql`0`)
                    .as('totalMortality'),
            ])
            .where('farms.districtId', '=', farm.districtId)
            .where('farms.deletedAt', 'is', null)
            .where('batches.deletedAt', 'is', null)
            .where('batches.species', 'in', species)
            .groupBy([
                'farms.id',
                'batches.id',
                'batches.species',
                'batches.initialQuantity',
            ])
            .execute()

        if (districtFarms.length === 0) {
            return { districtAvgMortality: null, percentileRank: null }
        }

        // Calculate mortality rates for all district farms
        const farmMortalityRates = new Map<string, Array<number>>()

        districtFarms.forEach((districtFarm) => {
            const rate =
                districtFarm.initialQuantity && districtFarm.initialQuantity > 0
                    ? (Number(districtFarm.totalMortality) /
                          districtFarm.initialQuantity) *
                      100
                    : 0
            if (!farmMortalityRates.has(districtFarm.farmId)) {
                farmMortalityRates.set(districtFarm.farmId, [])
            }
            farmMortalityRates.get(districtFarm.farmId)!.push(rate)
        })

        // Calculate average mortality rate per farm
        const avgMortalityRates = Array.from(farmMortalityRates.values()).map(
            (rates) =>
                rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
        )

        // Calculate district average
        const districtAvgMortality =
            avgMortalityRates.reduce((sum, rate) => sum + rate, 0) /
            avgMortalityRates.length

        // Calculate percentile rank (what % of farms have lower mortality)
        const farmsWithLowerMortality = avgMortalityRates.filter(
            (rate) => rate < farmMortalityRate,
        ).length
        const percentileRank =
            (farmsWithLowerMortality / avgMortalityRates.length) * 100

        return {
            districtAvgMortality: Math.round(districtAvgMortality * 100) / 100,
            percentileRank: Math.round(percentileRank),
        }
    })

/**
 * Server function to get all farm details for the farm detail page
 */
export const getFarmDetailsFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const { getBatches } = await import('~/features/batches/server')
        const { getSalesForFarm } = await import('~/features/sales/server')
        const { getExpensesForFarm } =
            await import('~/features/expenses/server')
        const { getStructuresWithCounts } =
            await import('~/features/structures/server')
        const { getSensorSummaryByFarm } =
            await import('~/features/sensors/repository')
        const { getSensorStatus } = await import('~/features/sensors/service')
        const { getDb } = await import('~/lib/db')

        const session = await requireAuth()
        const db = await getDb()

        const [
            farm,
            stats,
            activeBatches,
            recentSales,
            recentExpenses,
            structures,
            sensorData,
        ] = await Promise.all([
            getFarmById(data.farmId, session.user.id),
            getFarmStats(data.farmId, session.user.id),
            getBatches(session.user.id, data.farmId, { status: 'active' }),
            getSalesForFarm(session.user.id, data.farmId),
            getExpensesForFarm(session.user.id, data.farmId),
            getStructuresWithCounts(session.user.id, data.farmId),
            getSensorSummaryByFarm(db, data.farmId),
        ])

        const sensorsWithStatus = sensorData.sensors.map((s) => ({
            ...s,
            status: getSensorStatus(s.lastReadingAt, s.pollingIntervalMinutes),
        }))

        return {
            farm,
            stats,
            activeBatches,
            recentSales,
            recentExpenses,
            structures,
            sensorSummary: {
                totalSensors: sensorData.sensors.length,
                activeSensors: sensorsWithStatus.filter(
                    (s) => s.status === 'online',
                ).length,
                inactiveSensors: sensorsWithStatus.filter(
                    (s) => s.status === 'offline',
                ).length,
                alertCount: sensorData.alertCount,
            },
        }
    })
