/**
 * Database operations for monitoring alerts.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database, UserSettingsTable } from '~/lib/db/types'

/**
 * Batch data for monitoring
 */
export interface MonitoringBatch {
  id: string
  farmId: string
  species: string
  currentQuantity: number
  initialQuantity: number
  acquisitionDate: Date
}

/**
 * Mortality data for monitoring
 */
export interface MortalityData {
  runTotal: number | null
  total: number
}

/**
 * Water quality data for monitoring
 */
export interface WaterQualityData {
  date: Date
  ph: string
  ammoniaMgL: string
}

/**
 * Vaccination data for monitoring
 */
export interface VaccinationData {
  id: string
  vaccineName: string
  nextDueDate: Date | null
}

/**
 * Feed data for monitoring
 */
export interface FeedData {
  totalKg: string | null
}

/**
 * Weight data for monitoring
 */
export interface WeightData {
  averageWeightKg: string
  date: Date
}

/**
 * Growth standard data
 */
export interface GrowthStandardData {
  id: string
  species: string
  day: number
  expectedWeightG: number
}

/**
 * User alert thresholds
 */
export interface AlertThresholds {
  mortalityAlertPercent: number
  mortalityAlertQuantity: number
}

/**
 * Get active batches for monitoring
 *
 * @param db - Kysely database instance
 * @param farmIds - Array of farm IDs to filter by
 * @returns Array of active batch data for monitoring
 */
export async function selectBatchesForMonitoring(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<Array<MonitoringBatch>> {
  return await db
    .selectFrom('batches')
    .select([
      'id',
      'farmId',
      'species',
      'currentQuantity',
      'initialQuantity',
      'acquisitionDate',
    ])
    .where('farmId', 'in', farmIds)
    .where('status', '=', 'active')
    .execute()
}

/**
 * Get a single batch for monitoring
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to retrieve
 * @returns Batch data or null if not found
 */
export async function selectBatchForMonitoring(
  db: Kysely<Database>,
  batchId: string,
): Promise<MonitoringBatch | null> {
  const result = await db
    .selectFrom('batches')
    .select([
      'id',
      'farmId',
      'species',
      'currentQuantity',
      'initialQuantity',
      'acquisitionDate',
    ])
    .where('id', '=', batchId)
    .executeTakeFirst()

  return (result as MonitoringBatch | null) ?? null
}

/**
 * Get recent mortality total for a batch (last 24 hours)
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to query
 * @param sinceDate - Start date for the query
 * @returns Mortality data with run total
 */
export async function selectRecentMortality(
  db: Kysely<Database>,
  batchId: string,
  sinceDate: Date,
): Promise<MortalityData> {
  const result = await db
    .selectFrom('mortality_records')
    .select(({ fn }) => [fn.sum<number>('quantity').as('run_total')])
    .where('batchId', '=', batchId)
    .where('date', '>=', sinceDate)
    .executeTakeFirst()

  return {
    runTotal: result?.run_total ?? null,
    total: 0, // Will be calculated separately if needed
  }
}

/**
 * Get total mortality for a batch (all time)
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to query
 * @returns Total mortality count
 */
export async function selectTotalMortality(
  db: Kysely<Database>,
  batchId: string,
): Promise<number> {
  const result = await db
    .selectFrom('mortality_records')
    .select(({ fn }) => [fn.sum<number>('quantity').as('total')])
    .where('batchId', '=', batchId)
    .executeTakeFirst()

  return Number(result?.total ?? 0)
}

/**
 * Get most recent water quality record for a batch
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to query
 * @returns Most recent water quality data or null
 */
export async function selectRecentWaterQuality(
  db: Kysely<Database>,
  batchId: string,
): Promise<WaterQualityData | null> {
  const result = await db
    .selectFrom('water_quality')
    .select(['date', 'ph', 'ammoniaMgL'])
    .where('batchId', '=', batchId)
    .orderBy('date', 'desc')
    .limit(1)
    .executeTakeFirst()

  if (!result) return null

  return {
    date: result.date,
    ph: result.ph,
    ammoniaMgL: result.ammoniaMgL,
  }
}

/**
 * Get pending vaccinations for a batch
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to query
 * @returns Array of pending vaccination records
 */
export async function selectPendingVaccinations(
  db: Kysely<Database>,
  batchId: string,
): Promise<Array<VaccinationData>> {
  const results = await db
    .selectFrom('vaccinations')
    .select(['id', 'vaccineName', 'nextDueDate'])
    .where('batchId', '=', batchId)
    .where('nextDueDate', 'is not', null)
    .execute()

  return results.map((r) => ({
    id: r.id,
    vaccineName: r.vaccineName,
    nextDueDate: r.nextDueDate,
  }))
}

/**
 * Get total feed consumption for a batch
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to query
 * @returns Feed data with total kilograms
 */
export async function selectFeedRecords(
  db: Kysely<Database>,
  batchId: string,
): Promise<FeedData> {
  const result = await db
    .selectFrom('feed_records')
    .select(({ fn }) => [fn.sum<string>('quantityKg').as('totalKg')])
    .where('batchId', '=', batchId)
    .executeTakeFirst()

  return {
    totalKg: result?.totalKg ?? null,
  }
}

/**
 * Get most recent weight sample for a batch
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to query
 * @returns Most recent weight data or null
 */
export async function selectWeightSamples(
  db: Kysely<Database>,
  batchId: string,
): Promise<WeightData | null> {
  const result = await db
    .selectFrom('weight_samples')
    .select(['averageWeightKg', 'date'])
    .where('batchId', '=', batchId)
    .orderBy('date', 'desc')
    .limit(1)
    .executeTakeFirst()

  if (!result) return null

  return {
    averageWeightKg: result.averageWeightKg,
    date: result.date,
  }
}

/**
 * Get growth standards for a species
 *
 * @param db - Kysely database instance
 * @param species - Species to query standards for
 * @returns Array of growth standard records
 */
export async function selectGrowthStandards(
  db: Kysely<Database>,
  species: string,
): Promise<Array<GrowthStandardData>> {
  const results = await db
    .selectFrom('growth_standards')
    .select(['id', 'species', 'day', 'expected_weight_g'])
    .where('species', '=', species)
    .execute()

  return results.map((r) => ({
    id: r.id,
    species: r.species,
    day: r.day,
    expectedWeightG: r.expected_weight_g,
  }))
}

/**
 * Get user alert thresholds from settings
 *
 * @param db - Kysely database instance
 * @param userId - User ID to query
 * @returns Alert thresholds or defaults if not found
 */
export async function selectUserSettings(
  db: Kysely<Database>,
  userId: string,
): Promise<AlertThresholds> {
  const result = await db
    .selectFrom('user_settings')
    .select(['mortalityAlertPercent', 'mortalityAlertQuantity'])
    .where('userId', '=', userId)
    .executeTakeFirst()

  if (!result) {
    return {
      mortalityAlertPercent: 5,
      mortalityAlertQuantity: 10,
    }
  }

  return {
    mortalityAlertPercent: result.mortalityAlertPercent,
    mortalityAlertQuantity: result.mortalityAlertQuantity,
  }
}

/**
 * Get full user settings record
 *
 * @param db - Kysely database instance
 * @param userId - User ID to query
 * @returns Full user settings or null
 */
export async function selectUserSettingsFull(
  db: Kysely<Database>,
  userId: string,
): Promise<Pick<UserSettingsTable, 'notifications'> | null> {
  const result = await db
    .selectFrom('user_settings')
    .select(['notifications'])
    .where('userId', '=', userId)
    .executeTakeFirst()

  return (result as Pick<UserSettingsTable, 'notifications'> | null) ?? null
}

/**
 * Get user email for notifications
 *
 * @param db - Kysely database instance
 * @param userId - User ID to query
 * @returns User email or null
 */
export async function selectUserEmail(
  db: Kysely<Database>,
  userId: string,
): Promise<string | null> {
  const result = await db
    .selectFrom('users')
    .select(['email'])
    .where('id', '=', userId)
    .executeTakeFirst()

  return result?.email ?? null
}

/**
 * Get batch by ID with minimal fields
 *
 * @param db - Kysely database instance
 * @param batchId - Batch ID to query
 * @returns Batch species or null
 */
export async function selectBatchSpecies(
  db: Kysely<Database>,
  batchId: string,
): Promise<string | null> {
  const result = await db
    .selectFrom('batches')
    .select(['species'])
    .where('id', '=', batchId)
    .executeTakeFirst()

  return result?.species ?? null
}
