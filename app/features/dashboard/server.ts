import { sql } from 'kysely'
import type { BatchAlert } from '~/features/monitoring/alerts'

export interface DashboardStats {
  inventory: {
    totalPoultry: number
    totalFish: number
    totalCattle: number
    totalGoats: number
    totalSheep: number
    totalBees: number
    activeBatches: number
  }
  financial: {
    monthlyRevenue: number
    monthlyExpenses: number
    monthlyProfit: number
    revenueChange: number
    expensesChange: number
  }
  production: {
    eggsThisMonth: number
    layingPercentage: number
  }
  alerts: Array<BatchAlert>
  topCustomers: Array<{ id: string; name: string; totalSpent: number }>
  recentTransactions: Array<{
    id: string
    type: 'sale' | 'expense'
    description: string
    amount: number
    date: Date
  }>
}

export async function getDashboardStats(
  userId: string,
  farmId?: string,
): Promise<DashboardStats> {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('../auth/utils')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Determine target farms
  let targetFarmIds: Array<string> = []
  if (farmId) {
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) {
      // Return empty stats if no farms
      return {
        inventory: {
          totalPoultry: 0,
          totalFish: 0,
          totalCattle: 0,
          totalGoats: 0,
          totalSheep: 0,
          totalBees: 0,
          activeBatches: 0,
        },
        financial: {
          monthlyRevenue: 0,
          monthlyExpenses: 0,
          monthlyProfit: 0,
          revenueChange: 0,
          expensesChange: 0,
        },
        production: { eggsThisMonth: 0, layingPercentage: 0 },
        alerts: [],
        topCustomers: [],
        recentTransactions: [],
      }
    }
  }

  // Inventory summary
  const inventoryByType = await db
    .selectFrom('batches')
    .select([
      'livestockType',
      sql<number>`SUM(CAST("currentQuantity" AS INTEGER))`.as('total'),
    ])
    .where('status', '=', 'active')
    .where('farmId', 'in', targetFarmIds)
    .groupBy('livestockType')
    .execute()

  const totalPoultry =
    inventoryByType.find((i) => i.livestockType === 'poultry')?.total || 0
  const totalFish =
    inventoryByType.find((i) => i.livestockType === 'fish')?.total || 0
  const totalCattle =
    inventoryByType.find((i) => i.livestockType === 'cattle')?.total || 0
  const totalGoats =
    inventoryByType.find((i) => i.livestockType === 'goats')?.total || 0
  const totalSheep =
    inventoryByType.find((i) => i.livestockType === 'sheep')?.total || 0
  const totalBees =
    inventoryByType.find((i) => i.livestockType === 'bees')?.total || 0

  const activeBatchesResult = await db
    .selectFrom('batches')
    .select(sql<number>`COUNT(*)`.as('count'))
    .where('status', '=', 'active')
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst()
  const activeBatches = Number(activeBatchesResult?.count || 0)

  // Monthly revenue
  const salesResult = await db
    .selectFrom('sales')
    .select(
      sql<string>`COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0)`.as('total'),
    )
    .where('date', '>=', startOfMonth)
    .where('date', '<=', endOfMonth)
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst()
  const monthlyRevenue = parseFloat(salesResult?.total || '0')

  // Previous month revenue
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const prevMonthSalesResult = await db
    .selectFrom('sales')
    .select(
      sql<string>`COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0)`.as('total'),
    )
    .where('date', '>=', prevMonthStart)
    .where('date', '<=', prevMonthEnd)
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst()
  const prevMonthRevenue = parseFloat(prevMonthSalesResult?.total || '0')
  const revenueChange =
    prevMonthRevenue > 0
      ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : 0

  // Monthly expenses
  const expensesResult = await db
    .selectFrom('expenses')
    .select(sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`.as('total'))
    .where('date', '>=', startOfMonth)
    .where('date', '<=', endOfMonth)
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst()
  const monthlyExpenses = parseFloat(expensesResult?.total || '0')

  // Previous month expenses
  const prevMonthExpensesResult = await db
    .selectFrom('expenses')
    .select(sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`.as('total'))
    .where('date', '>=', prevMonthStart)
    .where('date', '<=', prevMonthEnd)
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst()
  const prevMonthExpenses = parseFloat(prevMonthExpensesResult?.total || '0')
  const expensesChange =
    prevMonthExpenses > 0
      ? ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) * 100
      : 0

  // Egg production this month
  const eggsQuery = await db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      sql<number>`COALESCE(SUM("quantityCollected"), 0)`.as('totalEggs'),
    ])
    .where('egg_records.date', '>=', startOfMonth)
    .where('egg_records.date', '<=', endOfMonth)
    .where('batches.farmId', 'in', targetFarmIds)
    .executeTakeFirst()

  const eggsThisMonth = Number(eggsQuery?.totalEggs || 0)

  // Calculate laying percentage (eggs / layer birds)
  const layerBirdsQuery = await db
    .selectFrom('batches')
    .select(sql<number>`COALESCE(SUM("currentQuantity"), 0)`.as('total'))
    .where('species', 'ilike', '%layer%')
    .where('status', '=', 'active')
    .where('farmId', 'in', targetFarmIds)
    .executeTakeFirst()

  const layerBirds = Number(layerBirdsQuery?.total || 0)
  const daysInMonth = endOfMonth.getDate()
  const layingPercentage =
    layerBirds > 0 ? (eggsThisMonth / (layerBirds * daysInMonth)) * 100 : 0

  // Get centralized alerts
  const { getAllBatchAlerts } = await import('~/features/monitoring/alerts')
  const alerts = await getAllBatchAlerts(userId, farmId)

  // Top customers - join with sales to filter by farmId
  const topCustomers = await db
    .selectFrom('customers')
    .leftJoin('sales', 'sales.customerId', 'customers.id')
    .select([
      'customers.id',
      'customers.name',
      sql<string>`COALESCE(SUM(CAST(sales."totalAmount" AS DECIMAL)), 0)`.as(
        'totalSpent',
      ),
    ])
    .where((eb) =>
      eb.or([
        eb('sales.farmId', 'in', targetFarmIds),
        eb('sales.farmId', 'is', null),
      ]),
    )
    .groupBy(['customers.id', 'customers.name'])
    .orderBy(
      sql`COALESCE(SUM(CAST(sales."totalAmount" AS DECIMAL)), 0)`,
      'desc',
    )
    .limit(5)
    .execute()

  // Recent transactions
  const recentSales = await db
    .selectFrom('sales')
    .select([
      'id',
      sql<'sale'>`'sale'`.as('type'),
      sql<string>`CONCAT("livestockType", ' sale - ', quantity, ' units')`.as(
        'description',
      ),
      'totalAmount as amount',
      'date',
    ])
    .where('farmId', 'in', targetFarmIds)
    .orderBy('date', 'desc')
    .limit(5)
    .execute()

  const recentExpenses = await db
    .selectFrom('expenses')
    .select([
      'id',
      sql<'expense'>`'expense'`.as('type'),
      'description',
      'amount',
      'date',
    ])
    .where('farmId', 'in', targetFarmIds)
    .orderBy('date', 'desc')
    .limit(5)
    .execute()

  const recentTransactions = [...recentSales, ...recentExpenses]
    .map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: parseFloat(String(t.amount)),
      date: t.date,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return {
    inventory: {
      totalPoultry,
      totalFish,
      totalCattle,
      totalGoats,
      totalSheep,
      totalBees,
      activeBatches,
    },
    financial: {
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
      revenueChange: Math.round(revenueChange * 10) / 10,
      expensesChange: Math.round(expensesChange * 10) / 10,
    },
    production: {
      eggsThisMonth,
      layingPercentage: Math.round(layingPercentage * 10) / 10,
    },
    alerts,
    topCustomers: topCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      totalSpent: parseFloat(String(c.totalSpent)),
    })),
    recentTransactions,
  }
}
