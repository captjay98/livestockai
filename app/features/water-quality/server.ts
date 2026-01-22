import { createServerFn } from '@tanstack/react-start'
import {
  getWaterQualityIssues,
  isWaterQualityAlert,
  validateReadingData,
  validateUpdateData,
} from './service'
import {
  
  
  deleteReading,
  getLatestReading,
  getLatestReadingsByFarms,
  getReadingById,
  getReadingsByBatch,
  getReadingsByFarm,
  getRecordFarmId,
  getWaterQualityPaginated,
  getWaterQualitySummary,
  insertReading,
  updateReading,
  verifyFishBatch
} from './repository'
import type {WaterQualityReadingInsert, WaterQualityReadingUpdate} from './repository';
import type { BasePaginatedQuery } from '~/lib/types'
import { AppError } from '~/lib/errors'

// Import from service and repository

// Re-export constants for backward compatibility
export { WATER_QUALITY_THRESHOLDS } from './constants'

// Types
export type { WaterQualityRecord } from './server'

/**
 * Represents a single water quality measurement record.
 * Primarily used for aquaculture (fish) monitoring.
 */
export interface WaterQualityRecord {
  /** Unique identifier for the measurement */
  id: string
  /** ID of the livestock batch being monitored */
  batchId: string
  /** Display name of the batch species */
  batchSpecies: string | null
  /** Date and time of the measurement */
  date: Date
  /** pH level (0-14) */
  ph: string
  /** Temperature in degrees Celsius */
  temperatureCelsius: string
  /** Dissolved Oxygen concentration in mg/L */
  dissolvedOxygenMgL: string
  /** Ammonia concentration in mg/L */
  ammoniaMgL: string
  /** Optional observer notes */
  notes: string | null
}

/**
 * Data structure for creating a new water quality record.
 */
export interface CreateWaterQualityInput {
  /** ID of the fish batch */
  batchId: string
  /** Measurement date */
  date: Date
  /** pH value */
  ph: number
  /** Temperature in Celsius */
  temperatureCelsius: number
  /** Dissolved Oxygen in mg/L */
  dissolvedOxygenMgL: number
  /** Ammonia in mg/L */
  ammoniaMgL: number
  /** Optional notes */
  notes?: string | null
}

/**
 * Filter parameters for paginated water quality queries.
 */
export interface WaterQualityQuery extends BasePaginatedQuery {
  /** Optional filter by specific batch */
  batchId?: string
}

/**
 * Data structure for updating an existing water quality record.
 */
export interface UpdateWaterQualityInput {
  /** Updated measurement date */
  date?: Date
  /** Updated pH value */
  ph?: number
  /** Updated temperature in Celsius */
  temperatureCelsius?: number
  /** Updated Dissolved Oxygen in mg/L */
  dissolvedOxygenMgL?: number
  /** Updated Ammonia in mg/L */
  ammoniaMgL?: number
  /** Updated notes */
  notes?: string | null
}

export type { PaginatedResult } from '~/lib/types'

/**
 * Saves a new water quality record to the database.
 * Verifies that the batch belongs to the farm and is of type 'fish'.
 *
 * @param userId - ID of the user performing the action
 * @param farmId - ID of the farm owning the batch
 * @param input - Water quality metrics
 * @returns Promise resolving to the new record ID
 * @throws {Error} If batch not found or is not a fish batch
 */
export async function createWaterQualityRecord(
  userId: string,
  farmId: string,
  input: CreateWaterQualityInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
    await verifyFarmAccess(userId, farmId)

    // Verify batch belongs to farm and is a fish batch
    const isValid = await verifyFishBatch(db, input.batchId, farmId)
    if (!isValid) {
      throw new AppError('BATCH_NOT_FOUND', {
        metadata: { batchId: input.batchId, farmId },
      })
    }

    const insertData: WaterQualityReadingInsert = {
      batchId: input.batchId,
      date: input.date,
      ph: input.ph.toString(),
      temperatureCelsius: input.temperatureCelsius.toString(),
      dissolvedOxygenMgL: input.dissolvedOxygenMgL.toString(),
      ammoniaMgL: input.ammoniaMgL.toString(),
      notes: input.notes || null,
    }

    return await insertReading(db, insertData)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create water quality record',
      cause: error,
    })
  }
}

/**
 * Server function to create a water quality record.
 */
export const createWaterQualityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; data: CreateWaterQualityInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createWaterQualityRecord(session.user.id, data.farmId, data.data)
  })

/**
 * Retrieves all water quality records for a specific farm or all accessible farms.
 *
 * @param userId - ID of the user requesting data
 * @param farmId - Optional farm filter
 * @returns Promise resolving to an array of water quality records with batch and farm info
 */
export async function getWaterQualityForFarm(userId: string, farmId?: string) {
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { db } = await import('~/lib/db')

  try {
    let targetFarmIds: Array<string> = []
    if (farmId) {
      await verifyFarmAccess(userId, farmId)
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) return []
    }

    if (targetFarmIds.length === 0) {
      return []
    }

    // Get readings for each farm
    const allReadings = await Promise.all(
      targetFarmIds.map((id) => getReadingsByFarm(db, id)),
    )

    return allReadings.flat()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch water quality records',
      cause: error,
    })
  }
}

/**
 * Computes active alerts for all fish batches based on their most recent water quality readings.
 *
 * @param userId - ID of the user requesting alerts
 * @param farmId - Optional farm filter
 * @returns Promise resolving to an array of active alerts with issues and severity
 */
export async function getWaterQualityAlerts(userId: string, farmId?: string) {
  const { verifyFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { db } = await import('~/lib/db')

  try {
    let targetFarmIds: Array<string> = []
    if (farmId) {
      await verifyFarmAccess(userId, farmId)
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) return []
    }

    // Get the most recent water quality record for each active fish batch
    const records = await getLatestReadingsByFarms(db, targetFarmIds)

    const alerts: Array<{
      batchId: string
      species: string
      issues: Array<string>
      severity: 'warning' | 'critical'
      date: Date
      farmName?: string
    }> = []

    for (const record of records) {
      const params = {
        ph: parseFloat(record.ph),
        temperatureCelsius: parseFloat(record.temperatureCelsius),
        dissolvedOxygenMgL: parseFloat(record.dissolvedOxygenMgL),
        ammoniaMgL: parseFloat(record.ammoniaMgL),
      }

      if (isWaterQualityAlert(params)) {
        const issues = getWaterQualityIssues(params)
        alerts.push({
          batchId: record.batchId,
          species: record.species || 'Unknown',
          issues,
          severity: issues.length > 2 ? 'critical' : 'warning',
          date: record.date,
          farmName: record.farmName || undefined,
        })
      }
    }

    return alerts
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch water quality alerts',
      cause: error,
    })
  }
}

/**
 * Retrieves a paginated list of water quality records with sorting and search.
 *
 * @param userId - ID of the user requesting data
 * @param query - Pagination, sorting, and filter parameters
 * @returns Promise resolving to a paginated set of measurements
 */
export async function getWaterQualityRecordsPaginated(
  userId: string,
  query: WaterQualityQuery = {},
) {
  const { getUserFarms } = await import('~/features/auth/utils')
  const { db } = await import('~/lib/db')

  try {
    let targetFarmIds: Array<string> = []
    if (query.farmId) {
      targetFarmIds = [query.farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
    }

    if (targetFarmIds.length === 0) {
      return {
        data: [],
        total: 0,
        page: query.page || 1,
        pageSize: query.pageSize || 10,
        totalPages: 0,
      }
    }

    return await getWaterQualityPaginated(db, targetFarmIds, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      batchId: query.batchId,
      search: query.search,
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch paginated water quality records',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve paginated water quality records.
 */
export const getWaterQualityRecordsPaginatedFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: WaterQualityQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getWaterQualityRecordsPaginated(session.user.id, data)
  })

/**
 * Updates an existing water quality record.
 *
 * @param userId - ID of the user performing the update
 * @param recordId - ID of the record to update
 * @param input - Partial update parameters
 * @returns Promise resolving when update is complete
 * @throws {Error} If record not found or user unauthorized
 */
export async function updateWaterQualityRecord(
  userId: string,
  recordId: string,
  input: UpdateWaterQualityInput,
): Promise<void> {
  const { checkFarmAccess } = await import('~/features/auth/utils')
  const { db } = await import('~/lib/db')

  try {
    // Get the farm ID for this record
    const farmId = await getRecordFarmId(db, recordId)
    if (!farmId) {
      throw new AppError('WATER_QUALITY_NOT_FOUND', {
        metadata: { resource: 'WaterQualityRecord', id: recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId },
      })
    }

    // Build update data
    const updateData: WaterQualityReadingUpdate = {}
    if (input.date !== undefined) updateData.date = input.date
    if (input.ph !== undefined) updateData.ph = input.ph.toString()
    if (input.temperatureCelsius !== undefined)
      updateData.temperatureCelsius = input.temperatureCelsius.toString()
    if (input.dissolvedOxygenMgL !== undefined)
      updateData.dissolvedOxygenMgL = input.dissolvedOxygenMgL.toString()
    if (input.ammoniaMgL !== undefined)
      updateData.ammoniaMgL = input.ammoniaMgL.toString()
    if (input.notes !== undefined) updateData.notes = input.notes

    await updateReading(db, recordId, updateData)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update water quality record',
      cause: error,
    })
  }
}

/**
 * Server function to update a water quality record.
 */
export const updateWaterQualityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { recordId: string; data: UpdateWaterQualityInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateWaterQualityRecord(
      session.user.id,
      data.recordId,
      data.data,
    )
  })

/**
 * Deletes a water quality record from the database.
 *
 * @param userId - ID of the user requesting deletion
 * @param recordId - ID of the record to delete
 * @returns Promise resolving when deletion is complete
 * @throws {Error} If record not found or user unauthorized
 */
export async function deleteWaterQualityRecord(
  userId: string,
  recordId: string,
): Promise<void> {
  const { checkFarmAccess } = await import('~/features/auth/utils')
  const { db } = await import('~/lib/db')

  try {
    // Get the farm ID for this record
    const farmId = await getRecordFarmId(db, recordId)
    if (!farmId) {
      throw new AppError('WATER_QUALITY_NOT_FOUND', {
        metadata: { resource: 'WaterQualityRecord', id: recordId },
      })
    }

    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId },
      })
    }

    await deleteReading(db, recordId)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete water quality record',
      cause: error,
    })
  }
}

/**
 * Server function to delete a water quality record.
 */
export const deleteWaterQualityRecordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { recordId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteWaterQualityRecord(session.user.id, data.recordId)
  })

// Re-export service functions for backward compatibility
export { validateReadingData, validateUpdateData } from './service'
