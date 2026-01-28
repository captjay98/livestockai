import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { MODULE_METADATA } from '../modules/constants'
import {
    calculateBatchTotalCost,
    calculateFCR as calculateFeedConversionRatio,
    calculateMortalityRate,
    canDeleteBatch,
    determineBatchStatus,
    validateBatchData,
    validateUpdateData,
} from './service'
import {
    deleteBatch as deleteBatchFromDb,
    getBatchById as getBatchByIdFromDb,
    getBatchStats,
    getBatchesByFarm,
    getInventorySummary as getInventorySummaryFromDb,
    getRelatedRecords,
    getWeightSamples,
    insertBatch,
    updateBatch as updateBatchInDb,
    updateBatchQuantity as updateBatchQuantityInDb,
} from './repository'
import type { PaginatedResult } from '~/lib/types'
import type { BatchUpdate } from './repository'
import type { LivestockType } from '../modules/types'
import { AppError } from '~/lib/errors'
import { toNumber } from '~/features/settings/currency'

// Zod validation schemas
const createBatchSchema = z.object({
    farmId: z.string().uuid(),
    livestockType: z.enum([
        'poultry',
        'fish',
        'cattle',
        'goats',
        'sheep',
        'bees',
    ]),
    species: z.string().min(1).max(100),
    breedId: z.string().uuid().nullish(),
    initialQuantity: z.number().int().positive(),
    acquisitionDate: z.coerce.date(),
    costPerUnit: z.number().nonnegative(),
    batchName: z.string().max(100).nullish(),
    sourceSize: z.string().max(50).nullish(),
    structureId: z.string().uuid().nullish(),
    targetHarvestDate: z.coerce.date().nullish(),
    target_weight_g: z.number().positive().nullish(),
    targetPricePerUnit: z.number().nonnegative().nullish(),
    supplierId: z.string().uuid().nullish(),
    notes: z.string().max(500).nullish(),
})

const updateBatchSchema = z.object({
    species: z.string().min(1).max(100).optional(),
    status: z.enum(['active', 'depleted', 'sold']).optional(),
    batchName: z.string().max(100).nullish(),
    sourceSize: z.string().max(50).nullish(),
    structureId: z.string().uuid().nullish(),
    targetHarvestDate: z.coerce.date().nullish(),
    target_weight_g: z.number().positive().nullish(),
    notes: z.string().max(500).nullish(),
    /** Expected updatedAt timestamp for conflict detection (offline sync) */
    expectedUpdatedAt: z.coerce.date().optional(),
})

const paginatedQuerySchema = z.object({
    page: z.number().int().positive().optional().default(1),
    pageSize: z.number().int().positive().max(100).optional().default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    farmId: z.string().uuid().optional(),
    status: z.enum(['active', 'depleted', 'sold']).optional(),
    livestockType: z
        .enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees'])
        .optional(),
    breedId: z.string().uuid().optional(),
})

export type { PaginatedResult }
export type { InventorySummary } from './types'

/**
 * Get source size options for a livestock type based on module metadata
 *
 * @param livestockType - The type of livestock (e.g., 'poultry', 'fish')
 * @returns Array of value/label pairs for source size options
 */
export function getSourceSizeOptions(
    livestockType: LivestockType,
): Array<{ value: string; label: string }> {
    // Find the module that handles this livestock type
    const moduleEntry = Object.entries(MODULE_METADATA).find(([_, metadata]) =>
        metadata.livestockTypes.includes(livestockType),
    )

    if (!moduleEntry) {
        return []
    }

    return moduleEntry[1].sourceSizeOptions
}

/**
 * Pre-computed source size options organized by livestock type.
 * Useful for populating dropdowns and selection menus.
 */
export const SOURCE_SIZE_OPTIONS = {
    poultry: getSourceSizeOptions('poultry'),
    fish: getSourceSizeOptions('fish'),
    cattle: getSourceSizeOptions('cattle'),
    goats: getSourceSizeOptions('goats'),
    sheep: getSourceSizeOptions('sheep'),
    bees: getSourceSizeOptions('bees'),
}

/**
 * Data required to create a new livestock batch
 */
export interface CreateBatchData {
    /** The ID of the farm where the batch will be located */
    farmId: string
    /** The type of livestock (poultry, fish, etc.) */
    livestockType: LivestockType
    /** The specific species or breed (e.g., 'Broiler', 'Catfish') */
    species: string
    /** Optional breed ID for breed-specific forecasting */
    breedId?: string | null
    /** Initial number of units in the batch */
    initialQuantity: number
    /** Date when the batch was acquired or started */
    acquisitionDate: Date
    /** Cost per unit/animal in the system's currency */
    costPerUnit: number
    /** Optional custom name for the batch */
    batchName?: string | null
    /** Optional starting size/age description */
    sourceSize?: string | null
    /** Optional reference to the structure where the batch is housed */
    structureId?: string | null
    /** Optional expected harvest or depletion date */
    targetHarvestDate?: Date | null
    /** Optional target weight in grams for harvest */
    target_weight_g?: number | null
    /** Optional expected sale price per unit for revenue forecasting */
    targetPricePerUnit?: number | null
    /** Optional ID of the supplier */
    supplierId?: string | null
    /** Optional additional notes */
    notes?: string | null
}

/**
 * Data available for updating an existing livestock batch.
 * All fields are optional to allow partial updates.
 */
export interface UpdateBatchData {
    /** Updated species or breed name (e.g., 'Broiler', 'Catfish') */
    species?: string
    /**
     * Updated batch status.
     * 'active' - currently growing
     * 'depleted' - all animals died or removed without sale
     * 'sold' - all animals sold
     */
    status?: 'active' | 'depleted' | 'sold'
    /** Updated custom batch name or reference identifier */
    batchName?: string | null
    /** Updated source size description (e.g., 'day-old') */
    sourceSize?: string | null
    /** Updated reference to the structure where the batch is housed */
    structureId?: string | null
    /** Updated target harvest or depletion date */
    targetHarvestDate?: Date | null
    /** Updated target weight in grams for harvest forecasting */
    target_weight_g?: number | null
    /** Updated additional notes or observations */
    notes?: string | null
    /** Expected updatedAt timestamp for conflict detection (offline sync) */
    expectedUpdatedAt?: Date
}

/**
 * Create a new livestock batch and log an audit record
 *
 * @param userId - ID of the user performing the action
 * @param data - Batch creation data
 * @returns Promise resolving to the created batch ID
 * @throws {Error} If the user lacks access to the specified farm
 *
 * @example
 * ```typescript
 * const id = await createBatch('user_1', {
 *   farmId: 'farm_A',
 *   livestockType: 'poultry',
 *   species: 'Broiler',
 *   initialQuantity: 100,
 *   acquisitionDate: new Date(),
 *   costPerUnit: 500
 * })
 * ```
 */
export async function createBatch(
    userId: string,
    data: CreateBatchData,
): Promise<string> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { checkFarmAccess } = await import('../auth/utils')

    try {
        // Check farm access
        const hasAccess = await checkFarmAccess(userId, data.farmId)
        if (!hasAccess) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmId: data.farmId },
            })
        }

        // Business logic validation (from service layer)
        const validationError = validateBatchData(data)
        if (validationError) {
            throw new AppError('VALIDATION_ERROR', {
                metadata: { error: validationError },
            })
        }

        // Calculate total cost (from service layer)
        const totalCost = calculateBatchTotalCost(
            data.initialQuantity,
            data.costPerUnit,
        )

        // Database operation (from repository layer)
        const result = await insertBatch(db, {
            farmId: data.farmId,
            livestockType: data.livestockType,
            species: data.species,
            breedId: data.breedId || null,
            initialQuantity: data.initialQuantity,
            currentQuantity: data.initialQuantity,
            acquisitionDate: data.acquisitionDate,
            costPerUnit: totalCost,
            totalCost: totalCost,
            status: 'active',
            // Enhanced fields
            batchName: data.batchName || null,
            sourceSize: data.sourceSize || null,
            structureId: data.structureId || null,
            targetHarvestDate: data.targetHarvestDate || null,
            target_weight_g: data.target_weight_g || null,
            targetPricePerUnit: data.targetPricePerUnit
                ? data.targetPricePerUnit.toString()
                : null,
            supplierId: data.supplierId || null,
            notes: data.notes || null,
        })

        return result
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to create batch',
            cause: error,
        })
    }
}

// Server function for client-side calls
export const createBatchFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ batch: createBatchSchema }))
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        // Type assertion to ensure compatibility with CreateBatchData interface
        return createBatch(session.user.id, data.batch as CreateBatchData)
    })

/**
 * Get batches for a user, optionally filtered by farm and other criteria
 *
 * @param userId - ID of the user requesting batches
 * @param farmId - Optional farm ID to filter by
 * @param filters - Optional filters for status, livestock type, and species
 * @returns Promise resolving to an array of batches with farm names
 * @throws {Error} If the user lacks access to the requested farm
 *
 * @example
 * ```typescript
 * const batches = await getBatches('user_1', 'farm_A', { status: 'active' })
 * ```
 */
export async function getBatches(
    userId: string,
    farmId?: string,
    filters?: {
        status?: 'active' | 'depleted' | 'sold'
        livestockType?: 'poultry' | 'fish'
        species?: string
    },
) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { checkFarmAccess, getUserFarms } = await import('../auth/utils')

    try {
        let targetFarmIds: Array<string> = []

        if (farmId) {
            const hasAccess = await checkFarmAccess(userId, farmId)
            if (!hasAccess) {
                throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
            }
            targetFarmIds = [farmId]
        } else {
            // getUserFarms returns string[] of farm IDs
            targetFarmIds = await getUserFarms(userId)
            if (targetFarmIds.length === 0) {
                return []
            }
        }

        // Database operation (from repository layer)
        return await getBatchesByFarm(db, targetFarmIds, filters)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch batches',
            cause: error,
        })
    }
}

/**
 * Get a single batch by its unique ID
 *
 * @param userId - ID of the user requesting the batch
 * @param batchId - Unique ID of the batch
 * @returns Promise resolving to the batch data or null if not found
 * @throws {Error} If the user lacks access to the batch's farm
 *
 * @example
 * ```typescript
 * const batch = await getBatchById('user_1', 'batch_123')
 * ```
 */
export async function getBatchById(userId: string, batchId: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { checkFarmAccess } = await import('../auth/utils')

    try {
        // Database operation (from repository layer)
        const batch = await getBatchByIdFromDb(db, batchId)

        if (!batch) {
            return null
        }

        // Check farm access
        const hasAccess = await checkFarmAccess(userId, batch.farmId)
        if (!hasAccess) {
            throw new AppError('ACCESS_DENIED', { metadata: { batchId } })
        }

        return batch
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch batch',
            cause: error,
        })
    }
}

/**
 * Update an existing livestock batch
 *
 * @param userId - ID of the user performing the update
 * @param batchId - ID of the batch to update
 * @param data - Updated batch fields
 * @returns Promise resolving to the updated batch data
 * @throws {Error} If the batch is not found or access is denied
 * @throws {AppError} CONFLICT if server version is newer than expected (409)
 *
 * @example
 * ```typescript
 * await updateBatch('user_1', 'batch_123', { status: 'depleted' })
 * ```
 */
export async function updateBatch(
    userId: string,
    batchId: string,
    data: UpdateBatchData,
) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { createConflictError } = await import('~/lib/conflict-resolution')

    try {
        const batch = await getBatchById(userId, batchId)
        if (!batch) {
            throw new AppError('BATCH_NOT_FOUND', { metadata: { batchId } })
        }

        // Business logic validation (from service layer)
        const validationError = validateUpdateData(data)
        if (validationError) {
            throw new AppError('VALIDATION_ERROR', {
                metadata: { error: validationError },
            })
        }

        // Conflict detection: if expectedUpdatedAt is provided, check for conflicts
        if (data.expectedUpdatedAt) {
            const serverUpdatedAt = new Date(batch.updatedAt).getTime()
            const clientExpectedAt = new Date(data.expectedUpdatedAt).getTime()

            if (serverUpdatedAt > clientExpectedAt) {
                // Server version is newer - conflict detected
                throw createConflictError(
                    { ...batch, updatedAt: batch.updatedAt },
                    {
                        ...data,
                        updatedAt: data.expectedUpdatedAt,
                    } as any,
                )
            }
        }

        const updateData: BatchUpdate = {}

        if (data.species !== undefined) updateData.species = data.species
        if (data.status !== undefined) updateData.status = data.status
        if (data.batchName !== undefined) updateData.batchName = data.batchName
        if (data.sourceSize !== undefined)
            updateData.sourceSize = data.sourceSize
        if (data.structureId !== undefined)
            updateData.structureId = data.structureId
        if (data.targetHarvestDate !== undefined)
            updateData.targetHarvestDate = data.targetHarvestDate
        if (data.target_weight_g !== undefined)
            updateData.target_weight_g = data.target_weight_g
        if (data.notes !== undefined) updateData.notes = data.notes

        // Database operation (from repository layer)
        await updateBatchInDb(db, batchId, updateData)

        return await getBatchById(userId, batchId)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to update batch',
            cause: error,
        })
    }
}

// Server function for client-side calls
export const updateBatchFn = createServerFn({ method: 'POST' })
    .inputValidator(
        z.object({
            batchId: z.string().uuid(),
            batch: updateBatchSchema,
        }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        return updateBatch(
            session.user.id,
            data.batchId,
            data.batch as UpdateBatchData,
        )
    })

/**
 * Delete a batch if it has no related records (feed, sales, etc.)
 *
 * @param userId - ID of the user performing the deletion
 * @param batchId - ID of the batch to delete
 * @throws {Error} If the batch is not found, access is denied, or it has related records
 *
 * @example
 * ```typescript
 * await deleteBatch('user_1', 'batch_123')
 * ```
 */
export async function deleteBatch(userId: string, batchId: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
        const batch = await getBatchById(userId, batchId)
        if (!batch) {
            throw new AppError('BATCH_NOT_FOUND', { metadata: { batchId } })
        }

        // Check for related records (from repository layer)
        const relatedRecords = await getRelatedRecords(db, batchId)

        // Business logic check (from service layer)
        const canDeleteResult = canDeleteBatch(relatedRecords)
        if (!canDeleteResult) {
            throw new AppError('VALIDATION_ERROR', {
                metadata: {
                    reason: 'Cannot delete batch with existing records. Delete related records first.',
                },
            })
        }

        // Database operation (from repository layer)
        await deleteBatchFromDb(db, batchId)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to delete batch',
            cause: error,
        })
    }
}

// Server function for client-side calls
export const deleteBatchFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ batchId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        return deleteBatch(session.user.id, data.batchId)
    })

/**
 * Internal utility to update batch quantity and status based on quantity
 *
 * @param batchId - ID of the batch to update
 * @param newQuantity - The new quantity to set
 * @internal
 */
export async function updateBatchQuantity(
    batchId: string,
    newQuantity: number,
) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
        // Determine status using service layer logic
        const status = determineBatchStatus(newQuantity)

        // Database operation (from repository layer)
        await updateBatchQuantityInDb(db, batchId, newQuantity, status)
    } catch (error) {
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to update batch quantity',
            cause: error,
        })
    }
}

/**
 * Retrieve comprehensive statistics for a specific batch, including mortality, feed, and sales
 *
 * @param userId - ID of the user requesting stats
 * @param batchId - ID of the batch
 * @returns Promise resolving to a statistical summary object
 * @throws {Error} If the batch is not found or access is denied
 *
 * @example
 * ```typescript
 * const stats = await getBatchStats('user_1', 'batch_123')
 * console.log(stats.mortality.rate)
 * ```
 */
export async function getBatchStatsWrapper(userId: string, batchId: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
        const batch = await getBatchById(userId, batchId)
        if (!batch) {
            throw new AppError('BATCH_NOT_FOUND', { metadata: { batchId } })
        }

        // Database operations (from repository layer)
        const stats = await getBatchStats(db, batchId)
        const weightSamples = await getWeightSamples(db, batchId)

        // Business logic calculations (from service layer)
        const totalMortality = Number(stats.mortality.totalMortality || 0)
        const mortalityRate = calculateMortalityRate(
            batch.initialQuantity,
            batch.currentQuantity,
            totalMortality,
        )

        // Calculate FCR (Feed Conversion Ratio) if we have weight data
        let fcr = null
        if (weightSamples.length > 0) {
            const totalFeedKg = toNumber(String(stats.feed.totalFeedKg || '0'))
            if (totalFeedKg > 0) {
                const avgWeight = toNumber(weightSamples[0].averageWeightKg)
                const totalWeightGain = avgWeight * batch.currentQuantity
                fcr = calculateFeedConversionRatio(totalFeedKg, totalWeightGain)
            }
        }

        return {
            batch,
            mortality: {
                totalDeaths: stats.mortality.totalDeaths,
                totalQuantity: totalMortality,
                rate: mortalityRate,
            },
            feed: {
                totalFeedings: stats.feed.totalFeedings,
                totalKg: toNumber(String(stats.feed.totalFeedKg || '0')),
                totalCost: toNumber(String(stats.feed.totalFeedCost || '0')),
                fcr,
            },
            sales: {
                totalSales: stats.sales.totalSales,
                totalQuantity: stats.sales.totalSold,
                totalRevenue: toNumber(String(stats.sales.totalRevenue || '0')),
            },
            expenses: {
                total: toNumber(String(stats.expenses.totalExpenses || '0')),
            },
            currentWeight:
                weightSamples.length > 0
                    ? toNumber(String(weightSamples[0].averageWeightKg))
                    : null,
        }
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch batch stats',
            cause: error,
        })
    }
}

/**
 * Get inventory summary across all farms or for a specific farm
 *
 * @param userId - ID of the user requesting the summary
 * @param farmId - Optional farm ID to filter by
 * @returns Promise resolving to an inventory summary (overall, poultry, fish, etc.)
 *
 * @example
 * ```typescript
 * const summary = await getInventorySummary('user_1')
 * ```
 */
export async function getInventorySummary(userId: string, farmId?: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { checkFarmAccess, getUserFarms } = await import('../auth/utils')

    try {
        let targetFarmIds: Array<string> = []

        if (farmId) {
            // Check specific farm access
            const hasAccess = await checkFarmAccess(userId, farmId)
            if (!hasAccess) {
                throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
            }
            targetFarmIds = [farmId]
        } else {
            // Get all accessible farms
            targetFarmIds = await getUserFarms(userId)
            if (targetFarmIds.length === 0) {
                // Return empty stats if no farms
                return {
                    overall: {
                        totalQuantity: 0,
                        activeBatches: 0,
                        totalInvestment: 0,
                        depletedBatches: 0,
                    },
                    poultry: { batches: 0, quantity: 0, investment: 0 },
                    fish: { batches: 0, quantity: 0, investment: 0 },
                    feed: {
                        totalFeedings: 0,
                        totalKg: 0,
                        totalCost: 0,
                        fcr: 0,
                    },
                    sales: { totalSales: 0, totalQuantity: 0, totalRevenue: 0 },
                    currentWeight: null,
                }
            }
        }

        // Database operations (from repository layer)
        const summary = await getInventorySummaryFromDb(db, targetFarmIds)

        const totalQuantityOverall = toNumber(
            String(summary.overall?.total_quantity || '0'),
        )
        const totalInvestmentOverall = Number(
            summary.overall?.total_investment || 0,
        )

        // Helper to safely convert to number
        const safeToNumber = (val: string | number | null | undefined) =>
            Number(val || 0)

        // Calculate FCR
        const totalFeedKg = safeToNumber(
            String(summary.feedStats?.total_kg || '0'),
        )
        const totalSold = safeToNumber(
            String(summary.salesStats?.total_quantity || '0'),
        )
        const fcr =
            totalSold > 0 ? Number((totalFeedKg / totalSold).toFixed(2)) : 0

        const totalFeedCost = toNumber(
            String(summary.feedStats?.total_cost || '0'),
        )

        return {
            overall: {
                totalBatches: Number(summary.overall?.total_batches || 0),
                activeBatches: Number(summary.overall?.total_batches || 0),
                totalQuantity: totalQuantityOverall,
                totalInvestment: totalInvestmentOverall,
                depletedBatches: Number(summary.depletedBatches?.count || 0),
            },
            poultry: {
                batches: Number(summary.poultry?.total_batches || 0),
                quantity: toNumber(
                    String(summary.poultry?.total_quantity || '0'),
                ),
                investment: toNumber(
                    String(summary.poultry?.total_investment || '0'),
                ),
            },
            fish: {
                batches: Number(summary.fish?.total_batches || 0),
                quantity: toNumber(String(summary.fish?.total_quantity || '0')),
                investment: toNumber(
                    String(summary.fish?.total_investment || '0'),
                ),
            },
            feed: {
                totalFeedings: Number(summary.feedStats?.total_feedings || 0),
                totalKg: totalFeedKg,
                totalCost: totalFeedCost,
                fcr,
            },
            sales: {
                totalSales: Number(summary.salesStats?.total_sales || 0),
                totalQuantity: totalSold,
                totalRevenue: toNumber(
                    String(summary.salesStats?.total_revenue || '0'),
                ),
            },
            currentWeight:
                summary.averageWeightKg > 0 ? summary.averageWeightKg : null,
        }
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch inventory summary',
            cause: error,
        })
    }
}

/**
 * Paginated batches query with sorting and search
 */
export interface PaginatedQuery {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    farmId?: string
    status?: string
    livestockType?: string
    breedId?: string
}

/**
 * Perform a paginated query for batches with support for searching, sorting, and filtering
 *
 * @param userId - ID of the user performing the query
 * @param query - Pagination and filter parameters
 * @returns Promise resolving to a paginated result set
 *
 * @example
 * ```typescript
 * const result = await getBatchesPaginated('user_1', { page: 1, pageSize: 20, status: 'active' })
 * ```
 */
export async function getBatchesPaginated(
    userId: string,
    query: PaginatedQuery = {},
): Promise<
    PaginatedResult<{
        id: string
        farmId: string
        farmName: string | null
        livestockType: string
        species: string
        breedId?: string | null
        breedName?: string | null
        initialQuantity: number
        currentQuantity: number
        acquisitionDate: Date
        costPerUnit: string
        totalCost: string
        status: string
    }>
> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { sql } = await import('kysely')
    const { checkFarmAccess, getUserFarms } = await import('../auth/utils')

    try {
        const page = query.page || 1
        const pageSize = query.pageSize || 10
        const sortBy = query.sortBy || 'acquisitionDate'
        const sortOrder = query.sortOrder || 'desc'
        const search = query.search || ''

        // Determine target farms
        let targetFarmIds: Array<string> = []
        if (query.farmId) {
            const hasAccess = await checkFarmAccess(userId, query.farmId)
            if (!hasAccess)
                throw new AppError('ACCESS_DENIED', {
                    metadata: { farmId: query.farmId },
                })
            targetFarmIds = [query.farmId]
        } else {
            targetFarmIds = await getUserFarms(userId)
            if (targetFarmIds.length === 0) {
                return { data: [], total: 0, page, pageSize, totalPages: 0 }
            }
        }

        // Build base query for count
        let countQuery = db
            .selectFrom('batches')
            .leftJoin('farms', 'farms.id', 'batches.farmId')
            .where('batches.farmId', 'in', targetFarmIds)

        // Apply search filter
        if (search) {
            countQuery = countQuery.where((eb) =>
                eb.or([
                    eb('batches.species', 'ilike', `%${search}%`),
                    eb('farms.name', 'ilike', `%${search}%`),
                ]),
            )
        }

        // Apply status filter
        if (query.status) {
            countQuery = countQuery.where(
                'batches.status',
                '=',
                query.status as any,
            )
        }

        // Apply breed filter
        if (query.breedId) {
            countQuery = countQuery.where('batches.breedId', '=', query.breedId)
        }

        // Get total count
        const countResult = await countQuery
            .select(sql<number>`count(*)`.as('count'))
            .executeTakeFirst()
        const total = Number(countResult?.count || 0)
        const totalPages = Math.ceil(total / pageSize)

        // Apply sorting
        const sortColumn =
            sortBy === 'species'
                ? 'batches.species'
                : sortBy === 'currentQuantity'
                  ? 'batches.currentQuantity'
                  : sortBy === 'status'
                    ? 'batches.status'
                    : sortBy === 'livestockType'
                      ? 'batches.livestockType'
                      : 'batches.acquisitionDate'

        // Build data query
        let dataQuery = db
            .selectFrom('batches')
            .leftJoin('farms', 'farms.id', 'batches.farmId')
            .leftJoin('breeds', 'breeds.id', 'batches.breedId')
            .select([
                'batches.id',
                'batches.farmId',
                'batches.livestockType',
                'batches.species',
                'batches.breedId',
                'breeds.displayName as breedName',
                'batches.initialQuantity',
                'batches.currentQuantity',
                'batches.acquisitionDate',
                'batches.costPerUnit',
                'batches.totalCost',
                'batches.status',
                'farms.name as farmName',
            ])
            .where('batches.farmId', 'in', targetFarmIds)

        // Re-apply filters
        if (search) {
            dataQuery = dataQuery.where((eb) =>
                eb.or([
                    eb('batches.species', 'ilike', `%${search}%`),
                    eb('farms.name', 'ilike', `%${search}%`),
                ]),
            )
        }
        if (query.status) {
            dataQuery = dataQuery.where(
                'batches.status',
                '=',
                query.status as any,
            )
        }
        if (query.breedId) {
            dataQuery = dataQuery.where('batches.breedId', '=', query.breedId)
        }

        // Apply sorting and pagination
        const data = await dataQuery
            .orderBy(sortColumn as any, sortOrder)
            .limit(pageSize)
            .offset((page - 1) * pageSize)
            .execute()

        return {
            data: data.map((d: any) => ({
                ...d,
                farmName: d.farmName || null,
            })),
            total,
            page,
            pageSize,
            totalPages,
        }
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch paginated batches',
            cause: error,
        })
    }
}

// Server function for paginated batches
export const getBatchesPaginatedFn = createServerFn({ method: 'GET' })
    .inputValidator(paginatedQuerySchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        return getBatchesPaginated(session.user.id, data)
    })

// Server function for batch details
export const getBatchDetailsFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ batchId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        return getBatchStatsWrapper(session.user.id, data.batchId)
    })

// Server function for getting batches
export const getBatchesFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid().optional() }))
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        return getBatches(session.user.id, data.farmId)
    })

/**
 * Server function for getting batches with pagination and summary
 * Used by batches index route
 */
export const getBatchesForFarmFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            farmId: z.string().uuid().optional(),
            page: z.number().int().positive().optional(),
            pageSize: z.number().int().positive().optional(),
            sortBy: z.string().optional(),
            sortOrder: z.enum(['asc', 'desc']).optional(),
            search: z.string().optional(),
            status: z.string().optional(),
            livestockType: z.string().optional(),
            breedId: z.string().optional(),
        }),
    )
    .handler(async ({ data }) => {
        try {
            const { requireAuth } = await import('../auth/server-middleware')
            const session = await requireAuth()
            const farmId = data.farmId || undefined

            const [paginatedBatches, summary] = await Promise.all([
                getBatchesPaginated(session.user.id, {
                    farmId,
                    page: data.page,
                    pageSize: data.pageSize,
                    sortBy: data.sortBy,
                    sortOrder: data.sortOrder,
                    search: data.search,
                    status: data.status,
                    livestockType: data.livestockType,
                    breedId: data.breedId,
                }),
                getInventorySummary(session.user.id, farmId),
            ])

            return { paginatedBatches, summary }
        } catch (err) {
            if (err instanceof Error && err.message === 'UNAUTHORIZED') {
                throw redirect({ to: '/login' })
            }
            throw err
        }
    })

/**
 * Get batches needing attention based on Performance Index
 * Performance Index considers mortality rate, FCR, and growth rate
 * Batches with PI < 90 or > 110 need attention
 */
export const getBatchesNeedingAttentionFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid().optional() }))
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        const { getDb } = await import('~/lib/db')
        const { getUserFarms, checkFarmAccess } = await import('../auth/utils')

        const db = await getDb()

        // Determine target farms
        let targetFarmIds: Array<string> = []
        if (data.farmId) {
            const hasAccess = await checkFarmAccess(
                session.user.id,
                data.farmId,
            )
            if (!hasAccess) return []
            targetFarmIds = [data.farmId]
        } else {
            targetFarmIds = await getUserFarms(session.user.id)
            if (targetFarmIds.length === 0) return []
        }

        // Get active batches with stats
        const batches = await db
            .selectFrom('batches')
            .leftJoin('farms', 'farms.id', 'batches.farmId')
            .select([
                'batches.id',
                'batches.batchName',
                'batches.species',
                'batches.initialQuantity',
                'batches.currentQuantity',
                'batches.acquisitionDate',
            ])
            .where('batches.farmId', 'in', targetFarmIds)
            .where('batches.status', '=', 'active')
            .execute()

        const batchesWithPI = []

        for (const batch of batches) {
            // Calculate Performance Index
            const mortalityRate = calculateMortalityRate(
                batch.initialQuantity,
                batch.currentQuantity,
                batch.initialQuantity - batch.currentQuantity,
            )

            // Simple PI calculation: 100 - (mortality_rate * 2)
            // Normal mortality is 5-10%, so PI should be 80-90 for normal batches
            const performanceIndex = Math.max(0, 100 - mortalityRate * 2)

            // Check if needs attention (PI < 90 or > 110)
            if (performanceIndex < 90 || performanceIndex > 110) {
                const deviation = Math.abs(100 - performanceIndex)
                batchesWithPI.push({
                    id: batch.id,
                    batchName: batch.batchName || `${batch.species} Batch`,
                    species: batch.species,
                    performanceIndex: Math.round(performanceIndex),
                    deviation,
                })
            }
        }

        // Sort by deviation (highest first) and limit to 5
        return batchesWithPI
            .sort((a, b) => b.deviation - a.deviation)
            .slice(0, 5)
    })
