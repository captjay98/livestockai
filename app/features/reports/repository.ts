/**
 * Database operations for report management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { DateRange } from './server'

/**
 * Data for inserting a new report configuration
 */
export interface ReportConfigInsert {
  name: string
  farmId: string
  reportType: 'profit_loss' | 'inventory' | 'sales' | 'feed' | 'egg'
  dateRangeType: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  customStartDate?: Date | null
  customEndDate?: Date | null
  includeCharts: boolean
  includeDetails: boolean
  createdBy: string
}

/**
 * Data for updating a report configuration
 */
export interface ReportConfigUpdate {
  name?: string
  reportType?: 'profit_loss' | 'inventory' | 'sales' | 'feed' | 'egg'
  dateRangeType?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  customStartDate?: Date | null
  customEndDate?: Date | null
  includeCharts?: boolean
  includeDetails?: boolean
}

/**
 * Report configuration with metadata
 */
export interface ReportConfig {
  id: string
  name: string
  farmId: string
  reportType: string
  dateRangeType: string
  customStartDate: Date | null
  customEndDate: Date | null
  includeCharts: boolean
  includeDetails: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Insert a new report configuration
 *
 * @param db - Kysely database instance
 * @param data - Report configuration data to insert
 * @returns The ID of the created report configuration
 *
 * @example
 * ```ts
 * const configId = await insertReportConfig(db, {
 *   name: 'Monthly Report',
 *   farmId: 'farm-1',
 *   reportType: 'sales',
 *   dateRangeType: 'month',
 *   includeCharts: true,
 *   includeDetails: true,
 *   createdBy: 'user-1'
 * })
 * ```
 */
export async function insertReportConfig(
  db: Kysely<Database>,
  data: ReportConfigInsert,
): Promise<string> {
  const result = await db
    .insertInto('report_configs')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Get a single report configuration by ID
 *
 * @param db - Kysely database instance
 * @param id - ID of the report configuration to retrieve
 * @returns The report configuration or null if not found
 */
export async function getReportConfigById(
  db: Kysely<Database>,
  id: string,
): Promise<ReportConfig | null> {
  const config = await db
    .selectFrom('report_configs')
    .select([
      'id',
      'name',
      'farmId',
      'reportType',
      'dateRangeType',
      'customStartDate',
      'customEndDate',
      'includeCharts',
      'includeDetails',
      'createdBy',
      'createdAt',
      'updatedAt',
    ])
    .where('id', '=', id)
    .executeTakeFirst()

  return (config as ReportConfig | null) ?? null
}

/**
 * Update report configuration fields
 *
 * @param db - Kysely database instance
 * @param id - ID of the report configuration to update
 * @param data - Fields to update
 */
export async function updateReportConfig(
  db: Kysely<Database>,
  id: string,
  data: ReportConfigUpdate,
): Promise<void> {
  await db
    .updateTable('report_configs')
    .set(data)
    .where('id', '=', id)
    .execute()
}

/**
 * Delete a report configuration by ID
 *
 * @param db - Kysely database instance
 * @param id - ID of the report configuration to delete
 */
export async function deleteReportConfig(
  db: Kysely<Database>,
  id: string,
): Promise<void> {
  await db.deleteFrom('report_configs').where('id', '=', id).execute()
}

/**
 * Get report configurations by farm
 *
 * @param db - Kysely database instance
 * @param farmId - ID of the farm to filter by
 * @returns Array of report configurations for the farm
 */
export async function getReportConfigsByFarm(
  db: Kysely<Database>,
  farmId: string,
): Promise<Array<ReportConfig>> {
  return await db
    .selectFrom('report_configs')
    .select([
      'id',
      'name',
      'farmId',
      'reportType',
      'dateRangeType',
      'customStartDate',
      'customEndDate',
      'includeCharts',
      'includeDetails',
      'createdBy',
      'createdAt',
      'updatedAt',
    ])
    .where('farmId', '=', farmId)
    .orderBy('createdAt', 'desc')
    .execute()
}

/**
 * Get sales data for reports
 *
 * @param db - Kysely database instance
 * @param farmId - Optional farm ID to filter by
 * @param dateRange - Date range for the report
 * @returns Sales data with customer information
 */
export async function getSalesData(
  db: Kysely<Database>,
  farmId: string | undefined,
  dateRange: DateRange,
) {
  let query = db
    .selectFrom('sales')
    .leftJoin('customers', 'customers.id', 'sales.customerId')
    .select([
      'sales.id',
      'sales.date',
      'sales.livestockType',
      'sales.quantity',
      'sales.unitPrice',
      'sales.totalAmount',
      'customers.name as customerName',
    ])
    .where('sales.date', '>=', dateRange.startDate)
    .where('sales.date', '<=', dateRange.endDate)
    .orderBy('sales.date', 'desc')

  if (farmId) {
    query = query.where('sales.farmId', '=', farmId)
  }

  return await query.execute()
}

/**
 * Get sales grouped by livestock type for P&L reports
 *
 * @param db - Kysely database instance
 * @param farmId - Optional farm ID to filter by
 * @param dateRange - Date range for the report
 * @returns Aggregated sales by livestock type
 */
export async function getSalesByType(
  db: Kysely<Database>,
  farmId: string | undefined,
  dateRange: DateRange,
) {
  let query = db
    .selectFrom('sales')
    .select([
      'livestockType',
      (eb) =>
        eb.fn
          .coalesce(
            eb.fn.sum<number>(eb.cast(eb.ref('totalAmount'), 'decimal')),
            eb.val(0),
          )
          .as('total'),
    ])
    .where('date', '>=', dateRange.startDate)
    .where('date', '<=', dateRange.endDate)
    .groupBy('livestockType')

  if (farmId) {
    query = query.where('farmId', '=', farmId)
  }

  return await query.execute()
}

/**
 * Get expenses grouped by category for P&L reports
 *
 * @param db - Kysely database instance
 * @param farmId - Optional farm ID to filter by
 * @param dateRange - Date range for the report
 * @returns Aggregated expenses by category
 */
export async function getExpensesByCategory(
  db: Kysely<Database>,
  farmId: string | undefined,
  dateRange: DateRange,
) {
  let query = db
    .selectFrom('expenses')
    .select([
      'category',
      (eb) =>
        eb.fn
          .coalesce(eb.fn.sum<number>(eb.ref('amount')), eb.val(0))
          .as('total'),
    ])
    .where('date', '>=', dateRange.startDate)
    .where('date', '<=', dateRange.endDate)
    .groupBy('category')

  if (farmId) {
    query = query.where('farmId', '=', farmId)
  }

  return await query.execute()
}

/**
 * Get batch data for inventory reports
 *
 * @param db - Kysely database instance
 * @param farmId - Optional farm ID to filter by
 * @returns Batch data with mortality counts
 */
export async function getBatchData(
  db: Kysely<Database>,
  farmId: string | undefined,
) {
  let query = db
    .selectFrom('batches')
    .leftJoin('mortality_records', 'mortality_records.batchId', 'batches.id')
    .select([
      'batches.id',
      'batches.species',
      'batches.livestockType',
      'batches.initialQuantity',
      'batches.currentQuantity',
      'batches.status',
      (eb) =>
        eb.fn
          .coalesce(
            eb.fn.sum<number>(eb.ref('mortality_records.quantity')),
            eb.val(0),
          )
          .as('mortalityCount'),
    ])
    .groupBy([
      'batches.id',
      'batches.species',
      'batches.livestockType',
      'batches.initialQuantity',
      'batches.currentQuantity',
      'batches.status',
    ])

  if (farmId) {
    query = query.where('batches.farmId', '=', farmId)
  }

  return await query.execute()
}

/**
 * Get layer bird count for egg production reports
 *
 * @param db - Kysely database instance
 * @param farmId - Optional farm ID to filter by
 * @returns Total count of active layer birds
 */
export async function getLayerBirdCount(
  db: Kysely<Database>,
  farmId: string | undefined,
): Promise<number> {
  let query = db
    .selectFrom('batches')
    .select((eb) =>
      eb.fn
        .coalesce(eb.fn.sum<number>(eb.ref('currentQuantity')), eb.val(0))
        .as('total'),
    )
    .where('species', 'ilike', '%layer%')
    .where('status', '=', 'active')

  if (farmId) {
    query = query.where('farmId', '=', farmId)
  }

  const result = await query.executeTakeFirst()
  return Number(result?.total || 0)
}

/**
 * Get egg records for egg production reports
 *
 * @param db - Kysely database instance
 * @param farmId - Optional farm ID to filter by
 * @param dateRange - Date range for the report
 * @returns Aggregated egg records by date
 */
export async function getEggRecords(
  db: Kysely<Database>,
  farmId: string | undefined,
  dateRange: DateRange,
) {
  let query = db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      'egg_records.date',
      (eb) =>
        eb.fn
          .sum<number>(eb.ref('egg_records.quantityCollected'))
          .as('collected'),
      (eb) =>
        eb.fn.sum<number>(eb.ref('egg_records.quantityBroken')).as('broken'),
      (eb) => eb.fn.sum<number>(eb.ref('egg_records.quantitySold')).as('sold'),
    ])
    .where('egg_records.date', '>=', dateRange.startDate)
    .where('egg_records.date', '<=', dateRange.endDate)
    .groupBy('egg_records.date')
    .orderBy('egg_records.date', 'desc')

  if (farmId) {
    query = query.where('batches.farmId', '=', farmId)
  }

  return await query.execute()
}

/**
 * Get feed records for feed consumption reports
 *
 * @param db - Kysely database instance
 * @param farmId - Optional farm ID to filter by
 * @param dateRange - Date range for the report
 * @returns Aggregated feed records by batch and type
 */
export async function getFeedRecords(
  db: Kysely<Database>,
  farmId: string | undefined,
  dateRange: DateRange,
) {
  let query = db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      'feed_records.batchId',
      'batches.species',
      'feed_records.feedType',
      (eb) =>
        eb.fn
          .sum<number>(eb.cast(eb.ref('feed_records.quantityKg'), 'decimal'))
          .as('totalQuantityKg'),
      (eb) =>
        eb.fn
          .sum<number>(eb.cast(eb.ref('feed_records.cost'), 'decimal'))
          .as('totalCost'),
    ])
    .where('feed_records.date', '>=', dateRange.startDate)
    .where('feed_records.date', '<=', dateRange.endDate)
    .groupBy([
      'feed_records.batchId',
      'batches.species',
      'feed_records.feedType',
    ])

  if (farmId) {
    query = query.where('batches.farmId', '=', farmId)
  }

  return await query.execute()
}
