import { sql } from 'kysely'

/**
 * @module Reports
 *
 * Core reporting engine for generating detailed business insights.
 * Includes logic for Profit & Loss, Inventory, Sales, Feed, and Egg production reports.
 */

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

/**
 * Generates a Profit and Loss report.
 * Aggregates all sales and expenses within the specified window.
 *
 * @param farmId - Optional farm ID to filter by, or undefined for all farms
 * @param dateRange - The date range for the report
 * @returns Promise resolving to a ProfitLossReport with revenue, expenses, and profit margins
 */
export async function getProfitLossReport(
  farmId: string | undefined,
  dateRange: DateRange,
): Promise<ProfitLossReport> {
  const { db } = await import('~/lib/db')

  // Revenue by type
  let salesQuery = db
    .selectFrom('sales')
    .select([
      'livestockType',
      sql<string>`COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0)`.as('total'),
    ])
    .where('date', '>=', dateRange.startDate)
    .where('date', '<=', dateRange.endDate)
    .groupBy('livestockType')

  if (farmId) {
    salesQuery = salesQuery.where('farmId', '=', farmId)
  }

  const salesByType = await salesQuery.execute()

  // Expenses by category
  let expensesQuery = db
    .selectFrom('expenses')
    .select([
      'category',
      sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`.as('total'),
    ])
    .where('date', '>=', dateRange.startDate)
    .where('date', '<=', dateRange.endDate)
    .groupBy('category')

  if (farmId) {
    expensesQuery = expensesQuery.where('farmId', '=', farmId)
  }

  const expensesByCategory = await expensesQuery.execute()

  const totalRevenue = salesByType.reduce(
    (sum, s) => sum + parseFloat(s.total),
    0,
  )
  const totalExpenses = expensesByCategory.reduce(
    (sum, e) => sum + parseFloat(e.total),
    0,
  )
  const profit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

  return {
    period: dateRange,
    revenue: {
      total: totalRevenue,
      byType: salesByType.map((s) => ({
        type: s.livestockType,
        amount: parseFloat(s.total),
      })),
    },
    expenses: {
      total: totalExpenses,
      byCategory: expensesByCategory.map((e) => ({
        category: e.category,
        amount: parseFloat(e.total),
      })),
    },
    profit,
    profitMargin: Math.round(profitMargin * 10) / 10,
  }
}

/**
 * Generates a real-time livestock count and health report.
 *
 * @param farmId - Optional farm ID to filter by, or undefined for all farms
 * @returns Promise resolving to an InventoryReport with batch details and mortality rates
 */
export async function getInventoryReport(
  farmId: string | undefined,
): Promise<InventoryReport> {
  const { db } = await import('~/lib/db')

  let batchQuery = db
    .selectFrom('batches')
    .leftJoin('mortality_records', 'mortality_records.batchId', 'batches.id')
    .select([
      'batches.id',
      'batches.species',
      'batches.livestockType',
      'batches.initialQuantity',
      'batches.currentQuantity',
      'batches.status',
      sql<number>`COALESCE(SUM(mortality_records.quantity), 0)`.as(
        'mortalityCount',
      ),
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
    batchQuery = batchQuery.where('batches.farmId', '=', farmId)
  }

  const batches = await batchQuery.execute()

  const batchesWithRates = batches.map((b) => ({
    id: b.id,
    species: b.species,
    livestockType: b.livestockType,
    initialQuantity: b.initialQuantity,
    currentQuantity: b.currentQuantity,
    mortalityCount: Number(b.mortalityCount),
    mortalityRate:
      b.initialQuantity > 0
        ? Math.round((Number(b.mortalityCount) / b.initialQuantity) * 1000) / 10
        : 0,
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
  const overallMortalityRate =
    totalInitial > 0
      ? Math.round((totalMortality / totalInitial) * 1000) / 10
      : 0

  return {
    batches: batchesWithRates,
    summary: {
      totalPoultry,
      totalFish,
      totalMortality,
      overallMortalityRate,
    },
  }
}

/**
 * Generates a detailed sales report for a given period.
 *
 * @param farmId - Optional farm ID to filter by, or undefined for all farms
 * @param dateRange - The date range for the report
 * @returns Promise resolving to a SalesReport with transactions and revenue breakdown
 */
export async function getSalesReport(
  farmId: string | undefined,
  dateRange: DateRange,
): Promise<SalesReport> {
  const { db } = await import('~/lib/db')

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

  const sales = await query.execute()

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
  const byType = new Map<string, { quantity: number; revenue: number }>()
  for (const sale of salesData) {
    const existing = byType.get(sale.livestockType) || {
      quantity: 0,
      revenue: 0,
    }
    byType.set(sale.livestockType, {
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
      byType: Array.from(byType.entries()).map(([type, data]) => ({
        type,
        quantity: data.quantity,
        revenue: data.revenue,
      })),
    },
  }
}

/**
 * Generates a feed consumption and cost report.
 *
 * @param farmId - Optional farm ID to filter by, or undefined for all farms
 * @param dateRange - The date range for the report
 * @returns Promise resolving to a FeedReport with consumption records and cost breakdown
 */
export async function getFeedReport(
  farmId: string | undefined,
  dateRange: DateRange,
): Promise<FeedReport> {
  const { db } = await import('~/lib/db')

  let query = db
    .selectFrom('feed_records')
    .innerJoin('batches', 'batches.id', 'feed_records.batchId')
    .select([
      'feed_records.batchId',
      'batches.species',
      'feed_records.feedType',
      sql<string>`SUM(CAST("quantityKg" AS DECIMAL))`.as('totalQuantityKg'),
      sql<string>`SUM(CAST(feed_records.cost AS DECIMAL))`.as('totalCost'),
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

  const records = await query.execute()

  const recordsData = records.map((r) => ({
    batchId: r.batchId,
    species: r.species,
    feedType: r.feedType,
    totalQuantityKg: parseFloat(r.totalQuantityKg),
    totalCost: parseFloat(r.totalCost),
  }))

  // Summary by feed type
  const byFeedType = new Map<string, { quantityKg: number; cost: number }>()
  for (const record of recordsData) {
    const existing = byFeedType.get(record.feedType) || {
      quantityKg: 0,
      cost: 0,
    }
    byFeedType.set(record.feedType, {
      quantityKg: existing.quantityKg + record.totalQuantityKg,
      cost: existing.cost + record.totalCost,
    })
  }

  return {
    period: dateRange,
    records: recordsData,
    summary: {
      totalFeedKg: recordsData.reduce((sum, r) => sum + r.totalQuantityKg, 0),
      totalCost: recordsData.reduce((sum, r) => sum + r.totalCost, 0),
      byFeedType: Array.from(byFeedType.entries()).map(([type, data]) => ({
        type,
        quantityKg: data.quantityKg,
        cost: data.cost,
      })),
    },
  }
}

/**
 * Generates an egg production and inventory report.
 *
 * @param farmId - Optional farm ID to filter by, or undefined for all farms
 * @param dateRange - The date range for the report
 * @returns Promise resolving to an EggReport with daily records and laying percentages
 */
export async function getEggReport(
  farmId: string | undefined,
  dateRange: DateRange,
): Promise<EggReport> {
  const { db } = await import('~/lib/db')

  let query = db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      'egg_records.date',
      sql<number>`SUM("quantityCollected")`.as('collected'),
      sql<number>`SUM("quantityBroken")`.as('broken'),
      sql<number>`SUM("quantitySold")`.as('sold'),
    ])
    .where('egg_records.date', '>=', dateRange.startDate)
    .where('egg_records.date', '<=', dateRange.endDate)
    .groupBy('egg_records.date')
    .orderBy('egg_records.date', 'desc')

  if (farmId) {
    query = query.where('batches.farmId', '=', farmId)
  }

  const records = await query.execute()

  let runningInventory = 0
  const recordsWithInventory = records
    .reverse()
    .map((r) => {
      runningInventory +=
        Number(r.collected) - Number(r.broken) - Number(r.sold)
      return {
        date: r.date,
        collected: Number(r.collected),
        broken: Number(r.broken),
        sold: Number(r.sold),
        inventory: runningInventory,
      }
    })
    .reverse()

  const totalCollected = recordsWithInventory.reduce(
    (sum, r) => sum + r.collected,
    0,
  )
  const totalBroken = recordsWithInventory.reduce((sum, r) => sum + r.broken, 0)
  const totalSold = recordsWithInventory.reduce((sum, r) => sum + r.sold, 0)

  // Get layer bird count for laying percentage
  let layerQuery = db
    .selectFrom('batches')
    .select(sql<number>`COALESCE(SUM("currentQuantity"), 0)`.as('total'))
    .where('species', 'ilike', '%layer%')
    .where('status', '=', 'active')

  if (farmId) {
    layerQuery = layerQuery.where('farmId', '=', farmId)
  }

  const layerResult = await layerQuery.executeTakeFirst()
  const layerBirds = Number(layerResult?.total || 0)
  const days = recordsWithInventory.length || 1
  const averageLayingPercentage =
    layerBirds > 0
      ? Math.round((totalCollected / (layerBirds * days)) * 1000) / 10
      : 0

  return {
    period: dateRange,
    records: recordsWithInventory,
    summary: {
      totalCollected,
      totalBroken,
      totalSold,
      currentInventory: recordsWithInventory[0]?.inventory || 0,
      averageLayingPercentage,
    },
  }
}
