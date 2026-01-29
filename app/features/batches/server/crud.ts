import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  calculateBatchTotalCost,
  canDeleteBatch,
  determineBatchStatus,
  validateBatchData,
  validateUpdateData,
} from '../service'
import {
  deleteBatch as deleteBatchFromDb,
  getBatchById as getBatchByIdFromDb,
  getRelatedRecords,
  insertBatch,
  updateBatch as updateBatchInDb,
  updateBatchQuantity as updateBatchQuantityInDb,
} from '../repository'
import { createBatchSchema, updateBatchSchema } from './validation'
import type { BatchUpdate } from '../repository'
import type { CreateBatchData, UpdateBatchData } from './types'
import { AppError } from '~/lib/errors'

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
  const { checkFarmAccess } = await import('../../auth/utils')

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
      costPerUnit: data.costPerUnit.toString(),
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
  const { checkFarmAccess } = await import('../../auth/utils')

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
        throw createConflictError({ ...batch, updatedAt: batch.updatedAt }, {
          ...data,
          updatedAt: data.expectedUpdatedAt,
        } as any)
      }
    }

    const updateData: BatchUpdate = {}

    if (data.species !== undefined) updateData.species = data.species
    if (data.status !== undefined) updateData.status = data.status
    if (data.batchName !== undefined) updateData.batchName = data.batchName
    if (data.sourceSize !== undefined) updateData.sourceSize = data.sourceSize
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
          reason:
            'Cannot delete batch with existing records. Delete related records first.',
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

// Server function for client-side calls
export const createBatchFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ batch: createBatchSchema }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../../auth/server-middleware')
    const session = await requireAuth()
    // Type assertion to ensure compatibility with CreateBatchData interface
    return createBatch(session.user.id, data.batch as CreateBatchData)
  })

// Server function for client-side calls
export const updateBatchFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      batchId: z.string().uuid(),
      batch: updateBatchSchema,
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../../auth/server-middleware')
    const session = await requireAuth()
    return updateBatch(
      session.user.id,
      data.batchId,
      data.batch as UpdateBatchData,
    )
  })

// Server function for client-side calls
export const deleteBatchFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ batchId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../../auth/server-middleware')
    const session = await requireAuth()
    return deleteBatch(session.user.id, data.batchId)
  })
