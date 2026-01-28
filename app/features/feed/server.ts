import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { getBatchesFn } from '../batches/server'
import {
    buildFeedStats,
    buildFeedSummary,
    calculateFCR,
    validateFeedRecord,
    validateUpdateData,
} from './service'
import {
    deductFromInventory,
    deductNewInventory,
    deleteFeedRecord as deleteFeedRecordFromDb,
    getBatchById,
    getBatchQuantity,
    getFeedInventoryById,
    getFeedInventoryForFarms,
    getFeedRecordById,
    getFeedRecordForValidation,
    getFeedRecordsByBatch,
    getFeedRecordsByFarms,
    getFeedRecordsPaginated,
    getFeedStatsData,
    getFeedSummaryByBatch,
    getNewInventory,
    getWeightSamples,
    insertFeedRecord as insertFeedRecordIntoDb,
    restoreInventoryOnDelete,
    restoreOldInventory,
    updateFeedRecord as updateFeedRecordInDb,
} from './repository'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

/**
 * Core interface representing a single feeding record with joined batch and supplier info
 */
export interface FeedRecord {
    id: string
    batchId: string
    batchSpecies: string | null
    feedType: string
    brandName: string | null
    quantityKg: string
    cost: string
    date: Date
    supplierName: string | null
    notes: string | null
}

// Re-export constants for backward compatibility
export { FEED_TYPES, type FeedType } from './constants'

/**
 * Data required to create a new feed consumption record.
 */
export interface CreateFeedRecordInput {
    /** ID of the livestock batch being fed */
    batchId: string
    /** The specific category of feed used */
    feedType:
        | 'starter'
        | 'grower'
        | 'finisher'
        | 'layer_mash'
        | 'fish_feed'
        | 'cattle_feed'
        | 'goat_feed'
        | 'sheep_feed'
        | 'hay'
        | 'silage'
        | 'bee_feed'
    /** Total weight of feed consumed in kilograms */
    quantityKg: number
    /** Total cost of the feed consumed in the system currency */
    cost: number
    /** Date of the feeding event */
    date: Date
    /** Optional ID of the supplier of the feed */
    supplierId?: string | null
    /** Optional ID of the feed inventory item to deduct from */
    inventoryId?: string | null
    /** Optional name of the feed brand */
    brandName?: string | null
    /** Optional individual bag size in kilograms */
    bagSizeKg?: number | null
    /** Optional number of bags consumed */
    numberOfBags?: number | null
    /** Optional additional notes or observations */
    notes?: string | null
}

/**
 * Parameters for filtering and paginating feeding records.
 */
export interface FeedQuery extends BasePaginatedQuery {
    /** Optional filter for a specific livestock batch */
    batchId?: string
}

/**
 * Create a new feed record, optionally deduct from inventory, and log audit
 *
 * @param userId - ID of the user creating the record
 * @param farmId - ID of the farm
 * @param input - Feed record data
 * @returns Promise resolving to the created record ID
 * @throws {Error} If user lacks access to the farm or inventory is insufficient
 *
 * @example
 * ```typescript
 * const recordId = await createFeedRecord('user_1', 'farm_A', {
 *   batchId: 'batch_123',
 *   feedType: 'starter',
 *   quantityKg: 25,
 *   cost: 15000,
 *   date: new Date()
 * })
 * ```
 */
export async function createFeedRecord(
    userId: string,
    farmId: string,
    input: CreateFeedRecordInput,
): Promise<string> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { verifyFarmAccess } = await import('~/features/auth/utils')

    try {
        await verifyFarmAccess(userId, farmId)

        // Validate input using service layer
        const validationError = validateFeedRecord(input, input.batchId)
        if (validationError) {
            throw new AppError('VALIDATION_ERROR', {
                metadata: { error: validationError },
            })
        }

        // Verify batch belongs to farm using repository
        const batch = await getBatchById(db, input.batchId)
        if (!batch || batch.farmId !== farmId) {
            throw new AppError('BATCH_NOT_FOUND', {
                metadata: { batchId: input.batchId, farmId },
            })
        }

        const result = await db.transaction().execute(async (tx) => {
            let inventoryId: string | null = null

            // If inventoryId provided, deduct from that specific inventory
            if (input.inventoryId) {
                const inventory = await getFeedInventoryById(
                    tx,
                    input.inventoryId,
                )

                if (!inventory || inventory.farmId !== farmId) {
                    throw new AppError('FEED_RECORD_NOT_FOUND', {
                        metadata: { inventoryId: input.inventoryId },
                    })
                }

                if (parseFloat(inventory.quantityKg) < input.quantityKg) {
                    throw new AppError('INSUFFICIENT_STOCK', {
                        metadata: {
                            resource: 'Feed',
                            available: parseFloat(inventory.quantityKg),
                            requested: input.quantityKg,
                        },
                        message: `Insufficient inventory. Available: ${parseFloat(inventory.quantityKg)}kg`,
                    })
                }

                // Deduct from inventory
                await deductFromInventory(
                    tx,
                    inventory.id,
                    input.quantityKg.toString(),
                )
                inventoryId = inventory.id
            }

            // Record the feed consumption using repository
            return await insertFeedRecordIntoDb(tx, {
                batchId: input.batchId,
                feedType: input.feedType,
                quantityKg: input.quantityKg.toString(),
                cost: input.cost.toString(),
                date: input.date,
                supplierId: input.supplierId || null,
                inventoryId: inventoryId,
                brandName: input.brandName || null,
                bagSizeKg: input.bagSizeKg || null,
                numberOfBags: input.numberOfBags || null,
                notes: input.notes || null,
            })
        })

        return result
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to create feed record',
            cause: error,
        })
    }
}

// Server function for client-side calls
const createFeedRecordSchema = z.object({
    farmId: z.string().uuid(),
    record: z.object({
        batchId: z.string().uuid(),
        feedType: z.enum([
            'starter',
            'grower',
            'finisher',
            'layer_mash',
            'fish_feed',
            'cattle_feed',
            'goat_feed',
            'sheep_feed',
            'hay',
            'silage',
            'bee_feed',
        ]),
        quantityKg: z.number().positive(),
        cost: z.number().nonnegative(),
        date: z.coerce.date(),
        supplierId: z.string().uuid().nullish(),
        inventoryId: z.string().uuid().nullish(),
        brandName: z.string().max(100).nullish(),
        bagSizeKg: z.number().positive().nullish(),
        numberOfBags: z.number().int().positive().nullish(),
        notes: z.string().max(500).nullish(),
    }),
})

export const createFeedRecordFn = createServerFn({ method: 'POST' })
    .inputValidator(createFeedRecordSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return createFeedRecord(session.user.id, data.farmId, data.record)
    })

/**
 * Delete a feeding record and restore the consumed quantity back to inventory
 *
 * @param userId - ID of the user performing the deletion
 * @param farmId - ID of the farm
 * @param recordId - ID of the feed record to delete
 * @throws {Error} If record is not found or access is denied
 */
export async function deleteFeedRecord(
    userId: string,
    farmId: string,
    recordId: string,
) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { verifyFarmAccess } = await import('~/features/auth/utils')

    try {
        await verifyFarmAccess(userId, farmId)

        // Get the record to restore inventory using repository
        const record = await getFeedRecordForValidation(db, recordId)

        if (!record) {
            throw new AppError('FEED_RECORD_NOT_FOUND', {
                metadata: { recordId },
            })
        }

        await db.transaction().execute(async (tx) => {
            // Restore inventory using repository
            await restoreInventoryOnDelete(
                tx,
                farmId,
                record.feedType,
                record.quantityKg,
            )

            // Delete the record using repository
            await deleteFeedRecordFromDb(tx, recordId)
        })
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to delete feed record',
            cause: error,
        })
    }
}

// Server function for client-side calls
export const deleteFeedRecordFn = createServerFn({ method: 'POST' })
    .inputValidator(
        z.object({ farmId: z.string().uuid(), recordId: z.string().uuid() }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return deleteFeedRecord(session.user.id, data.farmId, data.recordId)
    })

/**
 * Update an existing feeding record and adjust inventory accordingly
 *
 * @param userId - ID of the user performing the update
 * @param farmId - ID of the farm
 * @param recordId - ID of the record to update
 * @param data - Partial feed record data
 * @throws {Error} If record not found, or insufficient inventory for new selection
 */
export async function updateFeedRecord(
    userId: string,
    farmId: string,
    recordId: string,
    data: Partial<CreateFeedRecordInput>,
) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { verifyFarmAccess } = await import('~/features/auth/utils')

    try {
        await verifyFarmAccess(userId, farmId)

        // Validate update data using service layer
        const validationError = validateUpdateData(data)
        if (validationError) {
            throw new AppError('VALIDATION_ERROR', {
                metadata: { error: validationError },
            })
        }

        await db.transaction().execute(async (tx) => {
            // 1. Get existing record using repository
            const existingRecord = await getFeedRecordById(tx, recordId)

            if (!existingRecord) {
                throw new AppError('FEED_RECORD_NOT_FOUND', {
                    metadata: { recordId },
                })
            }

            // If quantity or feedType is changing, we need to adjust inventory
            if (
                (data.quantityKg &&
                    data.quantityKg !==
                        parseFloat(existingRecord.quantityKg)) ||
                (data.feedType && data.feedType !== existingRecord.feedType)
            ) {
                // 2. Restore old inventory using repository
                await restoreOldInventory(
                    tx,
                    farmId,
                    existingRecord.feedType,
                    existingRecord.quantityKg,
                )

                // 3. Deduct new inventory
                const newQuantity =
                    data.quantityKg || parseFloat(existingRecord.quantityKg)
                const newFeedType = data.feedType || existingRecord.feedType

                const inventory = await getNewInventory(tx, farmId, newFeedType)

                if (
                    !inventory ||
                    parseFloat(inventory.quantityKg) < newQuantity
                ) {
                    throw new AppError('INSUFFICIENT_STOCK', {
                        metadata: {
                            resource: 'Feed',
                            available: inventory
                                ? parseFloat(inventory.quantityKg)
                                : 0,
                            requested: newQuantity,
                        },
                        message: `Insufficient inventory for ${newFeedType}. Available: ${inventory ? parseFloat(inventory.quantityKg) : 0}kg`,
                    })
                }

                await deductNewInventory(
                    tx,
                    inventory.id,
                    newQuantity.toString(),
                )
            }

            // 4. Update the record using repository
            await updateFeedRecordInDb(tx, recordId, {
                feedType: data.feedType,
                quantityKg: data.quantityKg?.toString(),
                cost: data.cost?.toString(),
                date: data.date,
                batchId: data.batchId,
            })
        })
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to update feed record',
            cause: error,
        })
    }
}

const updateFeedRecordSchema = z.object({
    farmId: z.string().uuid(),
    recordId: z.string().uuid(),
    data: z.object({
        batchId: z.string().uuid().optional(),
        feedType: z
            .enum([
                'starter',
                'grower',
                'finisher',
                'layer_mash',
                'fish_feed',
                'cattle_feed',
                'goat_feed',
                'sheep_feed',
                'hay',
                'silage',
                'bee_feed',
            ])
            .optional(),
        quantityKg: z.number().positive().optional(),
        cost: z.number().nonnegative().optional(),
        date: z.coerce.date().optional(),
        supplierId: z.string().uuid().nullish(),
        inventoryId: z.string().uuid().nullish(),
        brandName: z.string().max(100).nullish(),
        bagSizeKg: z.number().positive().nullish(),
        numberOfBags: z.number().int().positive().nullish(),
        notes: z.string().max(500).nullish(),
    }),
})

export const updateFeedRecordFn = createServerFn({ method: 'POST' })
    .inputValidator(updateFeedRecordSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return updateFeedRecord(
            session.user.id,
            data.farmId,
            data.recordId,
            data.data,
        )
    })

/**
 * Retrieve all feeding records for a specific livestock batch
 *
 * @param userId - ID of the user
 * @param batchId - ID of the batch
 * @returns Promise resolving to an array of feed records
 */
export async function getFeedRecordsForBatch(userId: string, batchId: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getBatchById: fetchBatchById } = await import('../batches/server')

    try {
        const batch = await fetchBatchById(userId, batchId)
        if (!batch) {
            throw new AppError('BATCH_NOT_FOUND', {
                metadata: { batchId },
            })
        }

        return await getFeedRecordsByBatch(db, batchId)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch batch feed records',
            cause: error,
        })
    }
}

/**
 * Fetches all feeding records for one or more farms.
 * Defaults to all farms belonging to the user if no specific farm is provided.
 *
 * @param userId - ID of the requesting user
 * @param farmId - Optional specific farm to filter by
 */
export async function getFeedRecords(userId: string, farmId?: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        let targetFarmIds: Array<string> = []
        if (farmId) {
            targetFarmIds = [farmId]
        } else {
            targetFarmIds = await getUserFarms(userId)
        }

        return await getFeedRecordsByFarms(db, targetFarmIds)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch feed records',
            cause: error,
        })
    }
}

/**
 * Get summary of total feed consumption and costs for a batch, grouped by feed type
 *
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param batchId - ID of the batch
 * @returns Promise resolving to a feed summary object
 */
export async function getFeedSummaryForBatch(
    userId: string,
    farmId: string,
    batchId: string,
) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { verifyFarmAccess } = await import('~/features/auth/utils')

    try {
        await verifyFarmAccess(userId, farmId)

        const records = await getFeedSummaryByBatch(db, farmId, batchId)

        // Use service layer to build summary
        return buildFeedSummary(records)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch feed summary',
            cause: error,
        })
    }
}

/**
 * Calculate the Feed Conversion Ratio (FCR) for a batch based on feed consumed and weight gain
 *
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param batchId - ID of the batch
 * @returns Promise resolving to the FCR (number) or null if data is insufficient
 */
export async function calculateFCRForBatch(
    userId: string,
    farmId: string,
    batchId: string,
): Promise<number | null> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { verifyFarmAccess } = await import('~/features/auth/utils')

    try {
        await verifyFarmAccess(userId, farmId)

        // Get total feed consumed
        const feedSummary = await getFeedSummaryForBatch(
            userId,
            farmId,
            batchId,
        )

        // Get weight samples to calculate weight gain using repository
        const weightSamples = await getWeightSamples(db, batchId)

        if (weightSamples.length < 2) {
            return null // Need at least 2 weight samples to calculate gain
        }

        const firstWeight = parseFloat(weightSamples[0].averageWeightKg)
        const lastWeight = parseFloat(
            weightSamples[weightSamples.length - 1].averageWeightKg,
        )
        const weightGain = lastWeight - firstWeight

        if (weightGain <= 0) {
            return null // No weight gain
        }

        // Get batch quantity for total weight gain using repository
        const batchQuantity = await getBatchQuantity(db, batchId)

        if (!batchQuantity) {
            return null
        }

        const totalWeightGain = weightGain * batchQuantity

        // Use service layer to calculate FCR
        return calculateFCR(
            feedSummary.totalQuantityKg,
            totalWeightGain,
            batchQuantity,
        )
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to calculate FCR',
            cause: error,
        })
    }
}

/**
 * Fetches the current inventory levels for all feed types.
 *
 * @param userId - ID of the requesting user
 * @param farmId - Optional specific farm to filter by
 */
export async function getFeedInventoryFn(userId: string, farmId?: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        let targetFarmIds: Array<string> = []
        if (farmId) {
            targetFarmIds = [farmId]
        } else {
            targetFarmIds = await getUserFarms(userId)
        }

        return await getFeedInventoryForFarms(db, targetFarmIds)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch feed inventory',
            cause: error,
        })
    }
}

/**
 * Perform a paginated query for feeding records with sorting and search support
 *
 * @param userId - ID of the user
 * @param query - Pagination and filtering parameters
 * @returns Promise resolving to a paginated result set
 */
export async function getFeedRecordsPaginatedFn(
    userId: string,
    query: FeedQuery = {},
) {
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        let targetFarmIds: Array<string> = []
        if (query.farmId) {
            targetFarmIds = [query.farmId]
        } else {
            targetFarmIds = await getUserFarms(userId)
        }

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        return await getFeedRecordsPaginated(db, {
            ...query,
            farmIds: targetFarmIds,
        })
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch paginated feed records',
            cause: error,
        })
    }
}

// Server function for paginated feed records
const feedQuerySchema = z.object({
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    farmId: z.string().uuid().optional(),
    batchId: z.string().uuid().optional(),
})

export const getFeedRecordsPaginatedServerFn = createServerFn({ method: 'GET' })
    .inputValidator(feedQuerySchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()
        return getFeedRecordsPaginatedFn(session.user.id, data)
    })

/**
 * Generates high-level statistics for feed consumption.
 *
 * @param userId - ID of the requesting user
 * @param farmId - Optional specific farm to filter by
 */
export async function getFeedStats(userId: string, farmId?: string) {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('~/features/auth/utils')

    try {
        let targetFarmIds: Array<string> = []
        if (farmId) {
            targetFarmIds = [farmId]
        } else {
            targetFarmIds = await getUserFarms(userId)
        }

        const records = await getFeedStatsData(db, targetFarmIds)

        // Use service layer to build stats
        return buildFeedStats(records)
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to fetch feed stats',
            cause: error,
        })
    }
}

// Export for backward compatibility
export {
    getFeedRecordsPaginatedFn as getFeedRecordsPaginated,
    getFeedInventoryFn as getFeedInventory,
}

/**
 * Server function for getting feed data with pagination and summary
 * Used by feed index route
 */
const getFeedDataForFarmSchema = z.object({
    farmId: z.string().uuid().optional(),
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    feedType: z.string().optional(),
})

export const getFeedDataForFarm = createServerFn({ method: 'GET' })
    .inputValidator(getFeedDataForFarmSchema)
    .handler(async ({ data }) => {
        try {
            const { requireAuth } = await import('../auth/server-middleware')
            const session = await requireAuth()
            const farmId = data.farmId || undefined

            const [paginatedRecords, allBatches, inventory, summary] =
                await Promise.all([
                    getFeedRecordsPaginatedFn(session.user.id, {
                        farmId,
                        page: data.page,
                        pageSize: data.pageSize,
                        sortBy: data.sortBy,
                        sortOrder: data.sortOrder,
                        search: data.feedType ? data.feedType : data.search,
                    }),
                    getBatchesFn({ data: { farmId } }),
                    getFeedInventoryFn(session.user.id, farmId),
                    getFeedStats(session.user.id, farmId),
                ])

            const batches = allBatches.filter(
                (b: { status: string }) => b.status === 'active',
            )

            return {
                paginatedRecords,
                batches,
                inventory,
                summary,
            }
        } catch (err) {
            if (err instanceof Error && err.message === 'UNAUTHORIZED') {
                throw redirect({ to: '/login' })
            }
            throw err
        }
    })

/**
 * Server function to get active batches for a farm (for feed dialog)
 */
export const getActiveBatchesForFeedFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        return db
            .selectFrom('batches')
            .select(['id', 'species', 'livestockType', 'currentQuantity'])
            .where('farmId', '=', data.farmId)
            .where('status', '=', 'active')
            .execute()
    })

/**
 * Server function to get feed inventory for a farm (for feed dialog)
 */
export const getFeedInventoryForFarmFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        return db
            .selectFrom('feed_inventory')
            .select(['feedType', 'quantityKg'])
            .where('farmId', '=', data.farmId)
            .execute()
    })
