/**
 * Sensor data aggregation service
 * Rolls up raw readings into hourly/daily aggregates for efficient historical queries
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

export type AggregationPeriod = 'hourly' | 'daily'

interface AggregationResult {
  sensorId: string
  periodType: AggregationPeriod
  periodStart: Date
  avgValue: number
  minValue: number
  maxValue: number
  readingCount: number
}

/**
 * Calculate the start of the period for a given date
 */
export function getPeriodStart(
  date: Date,
  periodType: AggregationPeriod,
): Date {
  const d = new Date(date)
  if (periodType === 'hourly') {
    d.setMinutes(0, 0, 0)
  } else {
    d.setHours(0, 0, 0, 0)
  }
  return d
}

/**
 * Calculate the end of the period for a given date
 */
export function getPeriodEnd(date: Date, periodType: AggregationPeriod): Date {
  const d = new Date(date)
  if (periodType === 'hourly') {
    d.setMinutes(59, 59, 999)
  } else {
    d.setHours(23, 59, 59, 999)
  }
  return d
}

/**
 * Aggregate readings for a specific sensor and period
 */
export async function aggregateReadingsForPeriod(
  db: Kysely<Database>,
  sensorId: string,
  periodType: AggregationPeriod,
  periodStart: Date,
  periodEnd: Date,
): Promise<AggregationResult | null> {
  const result = await db
    .selectFrom('sensor_readings')
    .select([
      db.fn.avg<string>('value').as('avgValue'),
      db.fn.min<string>('value').as('minValue'),
      db.fn.max<string>('value').as('maxValue'),
      db.fn.count<string>('id').as('readingCount'),
    ])
    .where('sensorId', '=', sensorId)
    .where('recordedAt', '>=', periodStart)
    .where('recordedAt', '<=', periodEnd)
    .executeTakeFirst()

  if (!result || !result.readingCount || Number(result.readingCount) === 0) {
    return null
  }

  return {
    sensorId,
    periodType,
    periodStart,
    avgValue: Number(result.avgValue),
    minValue: Number(result.minValue),
    maxValue: Number(result.maxValue),
    readingCount: Number(result.readingCount),
  }
}

/**
 * Store aggregation result in the database
 */
export async function storeAggregation(
  db: Kysely<Database>,
  aggregation: AggregationResult,
): Promise<string> {
  const result = await db
    .insertInto('sensor_aggregates')
    .values({
      sensorId: aggregation.sensorId,
      periodType: aggregation.periodType,
      periodStart: aggregation.periodStart,
      avgValue: String(aggregation.avgValue),
      minValue: String(aggregation.minValue),
      maxValue: String(aggregation.maxValue),
      readingCount: aggregation.readingCount,
    })
    .onConflict((oc) =>
      oc.columns(['sensorId', 'periodType', 'periodStart']).doUpdateSet({
        avgValue: String(aggregation.avgValue),
        minValue: String(aggregation.minValue),
        maxValue: String(aggregation.maxValue),
        readingCount: aggregation.readingCount,
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Run aggregation for all active sensors for a specific period
 */
export async function runAggregationForAllSensors(
  db: Kysely<Database>,
  periodType: AggregationPeriod,
  targetDate: Date,
): Promise<{ processed: number; aggregated: number }> {
  const periodStart = getPeriodStart(targetDate, periodType)
  const periodEnd = getPeriodEnd(targetDate, periodType)

  // Get all active sensors
  const sensors = await db
    .selectFrom('sensors')
    .select(['id'])
    .where('isActive', '=', true)
    .where('deletedAt', 'is', null)
    .execute()

  let aggregated = 0

  for (const sensor of sensors) {
    const result = await aggregateReadingsForPeriod(
      db,
      sensor.id,
      periodType,
      periodStart,
      periodEnd,
    )

    if (result) {
      await storeAggregation(db, result)
      aggregated++
    }
  }

  return { processed: sensors.length, aggregated }
}

/**
 * Get aggregated data for a sensor
 */
export async function getAggregatedData(
  db: Kysely<Database>,
  sensorId: string,
  periodType: AggregationPeriod,
  startDate: Date,
  endDate: Date,
) {
  const rows = await db
    .selectFrom('sensor_aggregates')
    .select([
      'id',
      'sensorId',
      'periodType',
      'periodStart',
      'avgValue',
      'minValue',
      'maxValue',
      'readingCount',
    ])
    .where('sensorId', '=', sensorId)
    .where('periodType', '=', periodType)
    .where('periodStart', '>=', startDate)
    .where('periodStart', '<=', endDate)
    .orderBy('periodStart', 'asc')
    .execute()

  return rows.map((r) => ({
    ...r,
    avgValue: Number(r.avgValue),
    minValue: Number(r.minValue),
    maxValue: Number(r.maxValue),
  }))
}

/**
 * Delete old raw readings after aggregation (data retention)
 * Keeps raw data for the specified number of days
 */
export async function cleanupOldReadings(
  db: Kysely<Database>,
  retentionDays: number,
): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  const result = await db
    .deleteFrom('sensor_readings')
    .where('recordedAt', '<', cutoffDate)
    .execute()

  return result.length
}
