/**
 * Database operations for water quality management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Data for inserting a new water quality reading.
 */
export interface WaterQualityReadingInsert {
  batchId: string
  date: Date
  ph: string
  temperatureCelsius: string
  dissolvedOxygenMgL: string
  ammoniaMgL: string
  notes: string | null
}

/**
 * Data for updating a water quality reading.
 */
export interface WaterQualityReadingUpdate {
  date?: Date
  ph?: string
  temperatureCelsius?: string
  dissolvedOxygenMgL?: string
  ammoniaMgL?: string
  notes?: string | null
}

/**
 * Water quality reading with batch and farm information.
 */
export interface WaterQualityReadingWithDetails {
  id: string
  batchId: string
  date: Date
  ph: string
  temperatureCelsius: string
  dissolvedOxygenMgL: string
  ammoniaMgL: string
  notes: string | null
  createdAt: Date
  species: string | null
  farmName: string | null
}

/**
 * Filters for water quality queries.
 */
export interface WaterQualityFilters {
  batchId?: string
  search?: string
}

/**
 * Insert a new water quality reading into the database.
 *
 * @param db - Kysely database instance
 * @param data - Reading data to insert
 * @returns The ID of the created reading
 *
 * @example
 * ```ts
 * const readingId = await insertReading(db, {
 *   batchId: 'batch-1',
 *   date: new Date(),
 *   ph: '7.0',
 *   temperatureCelsius: '27.00',
 *   dissolvedOxygenMgL: '6.50',
 *   ammoniaMgL: '0.010',
 *   notes: null
 * })
 * ```
 */
export async function insertReading(
  db: Kysely<Database>,
  data: WaterQualityReadingInsert,
): Promise<string> {
  const result = await db
    .insertInto('water_quality')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a single water quality reading by ID.
 *
 * @param db - Kysely database instance
 * @param id - ID of the reading to retrieve
 * @returns The reading data or null if not found
 */
export async function getReadingById(
  db: Kysely<Database>,
  id: string,
): Promise<WaterQualityReadingWithDetails | null> {
  const reading = await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'water_quality.id',
      'water_quality.batchId',
      'water_quality.date',
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
      'water_quality.notes',
      'water_quality.createdAt',
      'batches.species',
      'farms.name as farmName',
    ])
    .where('water_quality.id', '=', id)
    .executeTakeFirst()

  return (reading as WaterQualityReadingWithDetails | null) ?? null
}

/**
 * Update a water quality reading.
 *
 * @param db - Kysely database instance
 * @param id - ID of the reading to update
 * @param data - Fields to update
 */
export async function updateReading(
  db: Kysely<Database>,
  id: string,
  data: WaterQualityReadingUpdate,
): Promise<void> {
  await db.updateTable('water_quality').set(data).where('id', '=', id).execute()
}

/**
 * Delete a water quality reading.
 *
 * @param db - Kysely database instance
 * @param id - ID of the reading to delete
 */
export async function deleteReading(
  db: Kysely<Database>,
  id: string,
): Promise<void> {
  await db.deleteFrom('water_quality').where('id', '=', id).execute()
}

/**
 * Get water quality readings by farm ID.
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param filters - Optional filters for the query
 * @returns Array of water quality readings
 */
export async function getReadingsByFarm(
  db: Kysely<Database>,
  farmId: string,
  filters?: WaterQualityFilters,
): Promise<Array<WaterQualityReadingWithDetails>> {
  let query = db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'water_quality.id',
      'water_quality.batchId',
      'water_quality.date',
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
      'water_quality.notes',
      'water_quality.createdAt',
      'batches.species',
      'farms.name as farmName',
    ])
    .where('batches.farmId', '=', farmId)
    .where('batches.livestockType', '=', 'fish')
    .orderBy('water_quality.date', 'desc')

  if (filters?.batchId) {
    query = query.where('water_quality.batchId', '=', filters.batchId)
  }

  if (filters?.search) {
    const searchLower = `%${filters.search.toLowerCase()}%`
    query = query.where((eb) =>
      eb.or([eb('batches.species', 'ilike', searchLower)]),
    )
  }

  return await query.execute()
}

/**
 * Get water quality readings by batch ID.
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns Array of water quality readings
 */
export async function getReadingsByBatch(
  db: Kysely<Database>,
  batchId: string,
): Promise<Array<WaterQualityReadingWithDetails>> {
  return await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'water_quality.id',
      'water_quality.batchId',
      'water_quality.date',
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
      'water_quality.notes',
      'water_quality.createdAt',
      'batches.species',
      'farms.name as farmName',
    ])
    .where('water_quality.batchId', '=', batchId)
    .orderBy('water_quality.date', 'desc')
    .execute()
}

/**
 * Get the latest water quality reading for a batch.
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @returns The latest reading or null if not found
 */
export async function getLatestReading(
  db: Kysely<Database>,
  batchId: string,
): Promise<WaterQualityReadingWithDetails | null> {
  const reading = await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'water_quality.id',
      'water_quality.batchId',
      'water_quality.date',
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
      'water_quality.notes',
      'water_quality.createdAt',
      'batches.species',
      'farms.name as farmName',
    ])
    .where('water_quality.batchId', '=', batchId)
    .orderBy('water_quality.date', 'desc')
    .limit(1)
    .executeTakeFirst()

  return (reading as WaterQualityReadingWithDetails | null) ?? null
}

/**
 * Get the most recent reading for each active fish batch in specified farms.
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs to filter by
 * @returns Array of latest readings per batch
 */
export async function getLatestReadingsByFarms(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<WaterQualityReadingWithDetails>> {
  const records = await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .select([
      'water_quality.id',
      'water_quality.batchId',
      'water_quality.date',
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
      'water_quality.notes',
      'water_quality.createdAt',
      'batches.species',
      'farms.name as farmName',
    ])
    .where('batches.farmId', 'in', farmIds)
    .where('batches.livestockType', '=', 'fish')
    .where('batches.status', '=', 'active')
    .orderBy('water_quality.date', 'desc')
    .execute()

  // Group by batch and get the most recent for each
  const latestByBatch = new Map<string, WaterQualityReadingWithDetails>()
  for (const record of records) {
    if (!latestByBatch.has(record.batchId)) {
      latestByBatch.set(record.batchId, record as WaterQualityReadingWithDetails)
    }
  }

  return Array.from(latestByBatch.values())
}

/**
 * Paginated result type for water quality queries.
 */
export interface WaterQualityPaginatedResult {
  data: Array<WaterQualityReadingWithDetails>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Get paginated water quality readings.
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs to filter by
 * @param filters - Pagination and filter parameters
 * @returns Paginated result with readings
 */
export async function getWaterQualityPaginated(
  db: Kysely<Database>,
  farmIds: Array<string>,
  filters: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    batchId?: string
    search?: string
  },
): Promise<WaterQualityPaginatedResult> {
  const page = filters.page || 1
  const pageSize = filters.pageSize || 10
  const offset = (page - 1) * pageSize

  let baseQuery = db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .innerJoin('farms', 'farms.id', 'batches.farmId')
    .where('batches.farmId', 'in', farmIds)
    .where('batches.livestockType', '=', 'fish')

  if (filters.search) {
    const searchLower = `%${filters.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([eb('batches.species', 'ilike', searchLower)]),
    )
  }

  if (filters.batchId) {
    baseQuery = baseQuery.where('water_quality.batchId', '=', filters.batchId)
  }

  const countResult = await baseQuery
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  let dataQuery = baseQuery
    .select([
      'water_quality.id',
      'water_quality.batchId',
      'water_quality.date',
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
      'water_quality.notes',
      'water_quality.createdAt',
      'batches.species',
      'farms.name as farmName',
    ])
    .limit(pageSize)
    .offset(offset)

  if (filters.sortBy) {
    const sortOrder = filters.sortOrder || 'desc'
    let sortCol = `water_quality.${filters.sortBy}`
    if (filters.sortBy === 'species') sortCol = 'batches.species'
    // @ts-ignore - Kysely dynamic column type limitation
    dataQuery = dataQuery.orderBy(sortCol, sortOrder)
  } else {
    dataQuery = dataQuery.orderBy('water_quality.date', 'desc')
  }

  const data = await dataQuery.execute()

  return {
    data: data as Array<WaterQualityReadingWithDetails>,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Summary data for water quality over a period.
 */
export interface WaterQualitySummaryData {
  totalReadings: number
  alertCount: number
  averagePh: number | null
  averageTemperature: number | null
  averageDissolvedOxygen: number | null
  averageAmmonia: number | null
  phStatus: 'optimal' | 'acceptable' | 'warning' | 'critical'
  temperatureStatus: 'optimal' | 'acceptable' | 'warning' | 'critical'
  dissolvedOxygenStatus: 'optimal' | 'acceptable' | 'warning' | 'critical'
  ammoniaStatus: 'optimal' | 'acceptable' | 'warning' | 'critical'
}

/**
 * Get water quality summary for a farm.
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm
 * @param period - Time period for the summary
 * @returns Summary data for the farm
 */
export async function getWaterQualitySummary(
  db: Kysely<Database>,
  farmId: string,
  period: 'day' | 'week' | 'month' = 'week',
): Promise<WaterQualitySummaryData> {
  let startDate: Date
  const now = new Date()

  switch (period) {
    case 'day':
      startDate = new Date(now.setDate(now.getDate() - 1))
      break
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7))
      break
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1))
      break
    default:
      startDate = new Date(now.setDate(now.getDate() - 7))
  }

  const readings = await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .select([
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
    ])
    .where('batches.farmId', '=', farmId)
    .where('batches.livestockType', '=', 'fish')
    .where('water_quality.date', '>=', startDate)
    .execute()

  // Calculate aggregates
  const totalReadings = readings.length

  let alertCount = 0
  let sumPh = 0
  let sumTemp = 0
  let sumDo = 0
  let sumAmmonia = 0
  let validCount = 0

  for (const reading of readings) {
    const ph = parseFloat(reading.ph)
    const temp = parseFloat(reading.temperatureCelsius)
    const doVal = parseFloat(reading.dissolvedOxygenMgL)
    const ammonia = parseFloat(reading.ammoniaMgL)

    if (
      isNaN(ph) ||
      isNaN(temp) ||
      isNaN(doVal) ||
      isNaN(ammonia)
    ) {
      continue
    }

    // Check for alert
    if (
      ph < 6.5 ||
      ph > 9.0 ||
      temp < 25 ||
      temp > 30 ||
      doVal < 5 ||
      ammonia > 0.02
    ) {
      alertCount++
    }

    sumPh += ph
    sumTemp += temp
    sumDo += doVal
    sumAmmonia += ammonia
    validCount++
  }

  const averagePh = validCount > 0 ? sumPh / validCount : null
  const averageTemperature = validCount > 0 ? sumTemp / validCount : null
  const averageDissolvedOxygen = validCount > 0 ? sumDo / validCount : null
  const averageAmmonia = validCount > 0 ? sumAmmonia / validCount : null

  // Import here to avoid circular dependency
  const { determineParameterStatus } = await import('./service')

  const phStatus = averagePh
    ? determineParameterStatus('ph', averagePh)
    : 'acceptable'
  const temperatureStatus = averageTemperature
    ? determineParameterStatus('temperatureCelsius', averageTemperature)
    : 'acceptable'
  const dissolvedOxygenStatus = averageDissolvedOxygen
    ? determineParameterStatus('dissolvedOxygenMgL', averageDissolvedOxygen)
    : 'acceptable'
  const ammoniaStatus = averageAmmonia
    ? determineParameterStatus('ammoniaMgL', averageAmmonia)
    : 'acceptable'

  return {
    totalReadings,
    alertCount,
    averagePh,
    averageTemperature,
    averageDissolvedOxygen,
    averageAmmonia,
    phStatus,
    temperatureStatus,
    dissolvedOxygenStatus,
    ammoniaStatus,
  }
}

/**
 * Check if a batch is a fish batch belonging to a farm.
 *
 * @param db - Kysely database instance
 * @param batchId - ID of the batch
 * @param farmId - ID of the farm
 * @returns True if batch is valid fish batch for the farm
 */
export async function verifyFishBatch(
  db: Kysely<Database>,
  batchId: string,
  farmId: string,
): Promise<boolean> {
  const batch = await db
    .selectFrom('batches')
    .select(['id', 'livestockType'])
    .where('id', '=', batchId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  return batch?.livestockType === 'fish'
}

/**
 * Get the farm ID for a water quality record.
 *
 * @param db - Kysely database instance
 * @param recordId - ID of the water quality record
 * @returns The farm ID or null if not found
 */
export async function getRecordFarmId(
  db: Kysely<Database>,
  recordId: string,
): Promise<string | null> {
  const result = await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .select(['batches.farmId'])
    .where('water_quality.id', '=', recordId)
    .executeTakeFirst()

  return result?.farmId ?? null
}
