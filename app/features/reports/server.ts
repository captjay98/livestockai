/**
 * @module Reports
 *
 * Core reporting engine for generating detailed business insights.
 * Includes logic for Profit & Loss, Inventory, Sales, Feed, and Egg production reports.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  calculateDateRange,
  calculateEggInventory,
  calculateLayingPercentage,
  calculateMortalityRate,
  calculateProfitMargin,
} from './service'
import {
  deleteReportConfig,
  getBatchData,
  getEggRecords,
  getExpensesByCategory,
  getFeedRecords,
  getLayerBirdCount,
  getReportConfigById,
  getReportConfigsByFarm,
  getSalesByType,
  getSalesData,
  insertReportConfig,
  updateReportConfig,
} from './repository'
import { AppError } from '~/lib/errors'

/**
 * Universal date range for report generation.
 */
export interface DateRange {
  /** Start boundary (inclusive) */
  startDate: Date
  /** End boundary (inclusive) */
  endDate: Date
}

/**
 * Multi-dimensional financial overview for the farm.
 */
export interface ProfitLossReport {
  /** The report window */
  period: DateRange
  /** Revenue breakdown */
  revenue: {
    /** Combined revenue */
    total: number
    /** Revenue categorized by product or livestock type */
    byType: Array<{ type: string; amount: number }>
  }
  /** Expense breakdown */
  expenses: {
    /** Combined operational cost */
    total: number
    /** Costs categorized by ledger item */
    byCategory: Array<{ category: string; amount: number }>
  }
  /** Net profit (Revenue - Expenses) */
  profit: number
  /** Profit as a percentage of revenue */
  profitMargin: number
}

/**
 * Report detailing livestock quantities and mortality.
 */
export interface InventoryReport {
  /** List of individual batch statuses */
  batches: Array<{
    id: string
    species: string
    livestockType: string
    initialQuantity: number
    currentQuantity: number
    mortalityCount: number
    mortalityRate: number
    status: string
  }>
  /** Farm-wide totals */
  summary: {
    totalPoultry: number
    totalFish: number
    totalMortality: number
    overallMortalityRate: number
  }
}

/**
 * Detailed record of sales over a period.
 */
export interface SalesReport {
  /** The report window */
  period: DateRange
  /** Individual sales transactions */
  sales: Array<{
    id: string
    date: Date
    livestockType: string
    quantity: number
    unitPrice: number
    totalAmount: number
    customerName: string | null
  }>
  /** Sales summary */
  summary: {
    totalSales: number
    totalRevenue: number
    /** Revenue aggregated by livestock type */
    byType: Array<{ type: string; quantity: number; revenue: number }>
  }
}

/**
 * Report on feed consumption and costs.
 */
export interface FeedReport {
  /** The report window */
  period: DateRange
  /** Feed consumption records */
  records: Array<{
    batchId: string
    species: string
    feedType: string
    totalQuantityKg: number
    totalCost: number
  }>
  /** Feed summary */
  summary: {
    totalFeedKg: number
    totalCost: number
    /** Consumption aggregated by feed type */
    byFeedType: Array<{ type: string; quantityKg: number; cost: number }>
  }
}

/**
 * Report on egg production and inventory.
 */
export interface EggReport {
  /** The report window */
  period: DateRange
  /** Daily egg records */
  records: Array<{
    date: Date
    collected: number
    broken: number
    sold: number
    inventory: number
  }>
  /** Production summary */
  summary: {
    totalCollected: number
    totalBroken: number
    totalSold: number
    currentInventory: number
    averageLayingPercentage: number
  }
}

// ============================================================================
// Server Functions
// ============================================================================

/**
 * Generates a Profit and Loss report.
 * Aggregates all sales and expenses within the specified window.
 */
export const getProfitLossReport = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      dateRangeType: z
        .enum(['today', 'week', 'month', 'quarter', 'year', 'custom'])
        .default('month'),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()

    const dateRange =
      data.dateRangeType === 'custom' && data.startDate && data.endDate
        ? calculateDateRange(
            'custom',
            new Date(data.startDate),
            new Date(data.endDate),
          )
        : calculateDateRange(data.dateRangeType)

    try {
      const [salesByTypeResult, expensesByCategoryResult] = await Promise.all([
        getSalesByType(db, data.farmId, dateRange),
        getExpensesByCategory(db, data.farmId, dateRange),
      ])

      const totalRevenue = salesByTypeResult.reduce(
        (sum, s) => sum + parseFloat(String(s.total)),
        0,
      )
      const totalExpenses = expensesByCategoryResult.reduce(
        (sum, e) => sum + parseFloat(String(e.total)),
        0,
      )
      const profit = totalRevenue - totalExpenses
      const profitMargin = calculateProfitMargin(totalRevenue, totalExpenses)

      return {
        period: dateRange,
        revenue: {
          total: totalRevenue,
          byType: salesByTypeResult.map((s) => ({
            type: s.livestockType,
            amount: parseFloat(String(s.total)),
          })),
        },
        expenses: {
          total: totalExpenses,
          byCategory: expensesByCategoryResult.map((e) => ({
            category: e.category,
            amount: parseFloat(String(e.total)),
          })),
        },
        profit,
        profitMargin,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Generates a real-time livestock count and health report.
 */
export const getInventoryReport = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()

    try {
      const batchData = await getBatchData(db, data.farmId)

      const batchesWithRates = batchData.map((b) => ({
        id: b.id,
        species: b.species,
        livestockType: b.livestockType,
        initialQuantity: b.initialQuantity,
        currentQuantity: b.currentQuantity,
        mortalityCount: Number(b.mortalityCount),
        mortalityRate: calculateMortalityRate(
          b.initialQuantity,
          b.currentQuantity,
        ),
        status: b.status,
      }))

      const totalPoultry = batchesWithRates
        .filter((b) => b.livestockType === 'poultry' && b.status === 'active')
        .reduce((sum, b) => sum + b.currentQuantity, 0)

      const totalFish = batchesWithRates
        .filter((b) => b.livestockType === 'fish' && b.status === 'active')
        .reduce((sum, b) => sum + b.currentQuantity, 0)

      const totalMortality = batchesWithRates.reduce(
        (sum, b) => sum + b.mortalityCount,
        0,
      )
      const totalInitial = batchesWithRates.reduce(
        (sum, b) => sum + b.initialQuantity,
        0,
      )
      const overallMortalityRate = calculateMortalityRate(
        totalInitial,
        totalInitial - totalMortality,
      )

      return {
        batches: batchesWithRates,
        summary: {
          totalPoultry,
          totalFish,
          totalMortality,
          overallMortalityRate,
        },
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Generates a detailed sales report for a given period.
 */
export const getSalesReport = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      dateRangeType: z
        .enum(['today', 'week', 'month', 'quarter', 'year', 'custom'])
        .default('month'),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()

    const dateRange =
      data.dateRangeType === 'custom' && data.startDate && data.endDate
        ? calculateDateRange(
            'custom',
            new Date(data.startDate),
            new Date(data.endDate),
          )
        : calculateDateRange(data.dateRangeType)

    try {
      const sales = await getSalesData(db, data.farmId, dateRange)

      const salesData = sales.map((s) => ({
        id: s.id,
        date: s.date,
        livestockType: s.livestockType,
        quantity: s.quantity,
        unitPrice: parseFloat(s.unitPrice),
        totalAmount: parseFloat(s.totalAmount),
        customerName: s.customerName,
      }))

      // Summary by type
      const byTypeMap = new Map<string, { quantity: number; revenue: number }>()
      for (const sale of salesData) {
        const existing = byTypeMap.get(sale.livestockType) || {
          quantity: 0,
          revenue: 0,
        }
        byTypeMap.set(sale.livestockType, {
          quantity: existing.quantity + sale.quantity,
          revenue: existing.revenue + sale.totalAmount,
        })
      }

      return {
        period: dateRange,
        sales: salesData,
        summary: {
          totalSales: salesData.length,
          totalRevenue: salesData.reduce((sum, s) => sum + s.totalAmount, 0),
          byType: Array.from(byTypeMap.entries()).map(([type, typeData]) => ({
            type,
            quantity: typeData.quantity,
            revenue: typeData.revenue,
          })),
        },
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Generates a feed consumption and cost report.
 */
export const getFeedReport = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      dateRangeType: z
        .enum(['today', 'week', 'month', 'quarter', 'year', 'custom'])
        .default('month'),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()

    const dateRange =
      data.dateRangeType === 'custom' && data.startDate && data.endDate
        ? calculateDateRange(
            'custom',
            new Date(data.startDate),
            new Date(data.endDate),
          )
        : calculateDateRange(data.dateRangeType)

    try {
      const feedRecords = await getFeedRecords(db, data.farmId, dateRange)

      const recordsData = feedRecords.map((r) => ({
        batchId: r.batchId,
        species: r.species,
        feedType: r.feedType,
        totalQuantityKg: parseFloat(String(r.totalQuantityKg)),
        totalCost: parseFloat(String(r.totalCost)),
      }))

      // Summary by feed type
      const byFeedTypeMap = new Map<
        string,
        { quantityKg: number; cost: number }
      >()
      for (const record of recordsData) {
        const existing = byFeedTypeMap.get(record.feedType) || {
          quantityKg: 0,
          cost: 0,
        }
        byFeedTypeMap.set(record.feedType, {
          quantityKg: existing.quantityKg + record.totalQuantityKg,
          cost: existing.cost + record.totalCost,
        })
      }

      return {
        period: dateRange,
        records: recordsData,
        summary: {
          totalFeedKg: recordsData.reduce(
            (sum, r) => sum + r.totalQuantityKg,
            0,
          ),
          totalCost: recordsData.reduce((sum, r) => sum + r.totalCost, 0),
          byFeedType: Array.from(byFeedTypeMap.entries()).map(
            ([feedType, feedData]) => ({
              type: feedType,
              quantityKg: feedData.quantityKg,
              cost: feedData.cost,
            }),
          ),
        },
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Generates an egg production and inventory report.
 */
export const getEggReport = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      dateRangeType: z
        .enum(['today', 'week', 'month', 'quarter', 'year', 'custom'])
        .default('month'),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()

    const dateRange =
      data.dateRangeType === 'custom' && data.startDate && data.endDate
        ? calculateDateRange(
            'custom',
            new Date(data.startDate),
            new Date(data.endDate),
          )
        : calculateDateRange(data.dateRangeType)

    try {
      const eggRecords = await getEggRecords(db, data.farmId, dateRange)

      const recordsWithInventory = calculateEggInventory(
        eggRecords.map((r) => ({
          collected: Number(r.collected),
          broken: Number(r.broken),
          sold: Number(r.sold),
        })),
      )

      // Add dates back to records
      const recordsWithDates = recordsWithInventory.map((inv, index) => ({
        date: eggRecords[index].date,
        ...inv,
      }))

      const totalCollected = recordsWithInventory.reduce(
        (sum, r) => sum + r.collected,
        0,
      )
      const totalBroken = recordsWithInventory.reduce(
        (sum, r) => sum + r.broken,
        0,
      )
      const totalSold = recordsWithInventory.reduce((sum, r) => sum + r.sold, 0)

      const layerBirds = await getLayerBirdCount(db, data.farmId)
      const days = recordsWithInventory.length || 1
      const averageLayingPercentage = calculateLayingPercentage(
        totalCollected,
        layerBirds,
        days,
      )

      return {
        period: dateRange,
        records: recordsWithDates,
        summary: {
          totalCollected,
          totalBroken,
          totalSold,
          currentInventory: recordsWithInventory[0]?.inventory || 0,
          averageLayingPercentage,
        },
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Save a report configuration for later use
 */
export const saveReportConfig = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      name: z.string().min(1).max(100),
      farmId: z.string().uuid(),
      reportType: z.enum(['profit_loss', 'inventory', 'sales', 'feed', 'egg']),
      dateRangeType: z.enum([
        'today',
        'week',
        'month',
        'quarter',
        'year',
        'custom',
      ]),
      customStartDate: z.string().datetime().optional(),
      customEndDate: z.string().datetime().optional(),
      includeCharts: z.boolean().default(true),
      includeDetails: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const configId = await insertReportConfig(db, {
        name: data.name,
        farmId: data.farmId,
        reportType: data.reportType,
        dateRangeType: data.dateRangeType,
        customStartDate: data.customStartDate
          ? new Date(data.customStartDate)
          : null,
        customEndDate: data.customEndDate ? new Date(data.customEndDate) : null,
        includeCharts: data.includeCharts,
        includeDetails: data.includeDetails,
        createdBy: session.user.id,
      })

      return configId
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Get a saved report configuration
 */
export const getReportConfig = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()

    try {
      const config = await getReportConfigById(db, data.id)
      if (!config) {
        throw new AppError('NOT_FOUND', { message: 'Report config not found' })
      }
      return config
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Get all report configurations for a farm
 */
export const getReportConfigs = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()

    try {
      return await getReportConfigsByFarm(db, data.farmId)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Update a report configuration
 */
export const updateReportConfigFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      reportType: z
        .enum(['profit_loss', 'inventory', 'sales', 'feed', 'egg'])
        .optional(),
      dateRangeType: z
        .enum(['today', 'week', 'month', 'quarter', 'year', 'custom'])
        .optional(),
      customStartDate: z.string().datetime().nullable().optional(),
      customEndDate: z.string().datetime().nullable().optional(),
      includeCharts: z.boolean().optional(),
      includeDetails: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()

    try {
      await updateReportConfig(db, data.id, {
        name: data.name,
        reportType: data.reportType,
        dateRangeType: data.dateRangeType,
        customStartDate: data.customStartDate
          ? new Date(data.customStartDate)
          : null,
        customEndDate: data.customEndDate ? new Date(data.customEndDate) : null,
        includeCharts: data.includeCharts,
        includeDetails: data.includeDetails,
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Delete a report configuration
 */
export const deleteReportConfigFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()

    try {
      await deleteReportConfig(db, data.id)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })

/**
 * Fetch report data based on type and parameters
 */
export const fetchReportData = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      reportType: z.string(),
      farmId: z.string().optional(),
      startDate: z.string(),
      endDate: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { getFarms } = await import('../farms/server')

    const farms = await getFarms()

    let report:
      | ProfitLossReport
      | InventoryReport
      | SalesReport
      | FeedReport
      | EggReport
      | null = null

    switch (data.reportType) {
      case 'profit-loss':
        report = await getProfitLossReport({
          data: {
            farmId: data.farmId,
            startDate: data.startDate,
            endDate: data.endDate,
            dateRangeType: 'custom',
          },
        })
        break
      case 'inventory':
        report = await getInventoryReport({ data: { farmId: data.farmId } })
        break
      case 'sales':
        report = await getSalesReport({
          data: {
            farmId: data.farmId,
            startDate: data.startDate,
            endDate: data.endDate,
            dateRangeType: 'custom',
          },
        })
        break
      case 'feed':
        report = await getFeedReport({
          data: {
            farmId: data.farmId,
            startDate: data.startDate,
            endDate: data.endDate,
            dateRangeType: 'custom',
          },
        })
        break
      case 'eggs':
        report = await getEggReport({
          data: {
            farmId: data.farmId,
            startDate: data.startDate,
            endDate: data.endDate,
            dateRangeType: 'custom',
          },
        })
        break
    }

    return { farms, report, reportType: data.reportType }
  })
