import { sql } from 'kysely'
import { getUserFarms } from '../auth/middleware'
import { db } from '~/lib/db'

export interface DashboardStats {
  inventory: {
    totalPoultry: number
    totalFish: number
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
  alerts: {
    highMortality: Array<{ batchId: string; species: string; rate: number }>
    upcomingVaccinations: Array<{
      batchId: string
      species: string
      vaccineName: string
      dueDate: Date
    }>
    overdueVaccinations: Array<{
      batchId: string
      species: string
      vaccineName: string
      dueDate: Date
    }>
    waterQualityAlerts: Array<{
      batchId: string
      parameter: string
      value: number
    }>
  }
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
        inventory: { totalPoultry: 0, totalFish: 0, activeBatches: 0 },
        financial: { monthlyRevenue: 0, monthlyExpenses: 0, monthlyProfit: 0 },
        production: { eggsThisMonth: 0, layingPercentage: 0 },
        alerts: {
          highMortality: [],
          upcomingVaccinations: [],
          overdueVaccinations: [],
          waterQualityAlerts: [],
        },
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

  // High mortality batches (>5% mortality rate)
  const mortalityQuery = await db
    .selectFrom('batches')
    .leftJoin('mortality_records', 'mortality_records.batchId', 'batches.id')
    .select([
      'batches.id as batchId',
      'batches.species',
      'batches.initialQuantity',
      sql<number>`COALESCE(SUM(mortality_records.quantity), 0)`.as(
        'totalDeaths',
      ),
    ])
    .where('batches.status', '=', 'active')
    .where('batches.farmId', 'in', targetFarmIds)
    .groupBy(['batches.id', 'batches.species', 'batches.initialQuantity'])
    .execute()

  const highMortality = mortalityQuery
    .map((b) => ({
      batchId: b.batchId,
      species: b.species,
      rate: (Number(b.totalDeaths) / b.initialQuantity) * 100,
    }))
    .filter((b) => b.rate > 5)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5)

  // Upcoming vaccinations (next 7 days)
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const upcomingVaccinations = await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .select([
      'vaccinations.batchId',
      'batches.species',
      'vaccinations.vaccineName',
      'vaccinations.nextDueDate as dueDate',
    ])
    .where('vaccinations.nextDueDate', '>=', now)
    .where('vaccinations.nextDueDate', '<=', sevenDaysFromNow)
    .where('batches.farmId', 'in', targetFarmIds)
    .orderBy('vaccinations.nextDueDate', 'asc')
    .limit(5)
    .execute()

  // Overdue vaccinations
  const overdueVaccinations = await db
    .selectFrom('vaccinations')
    .innerJoin('batches', 'batches.id', 'vaccinations.batchId')
    .select([
      'vaccinations.batchId',
      'batches.species',
      'vaccinations.vaccineName',
      'vaccinations.nextDueDate as dueDate',
    ])
    .where('vaccinations.nextDueDate', '<', now)
    .where('batches.status', '=', 'active')
    .where('batches.farmId', 'in', targetFarmIds)
    .orderBy('vaccinations.nextDueDate', 'asc')
    .limit(5)
    .execute()

  // Water quality alerts
  const waterAlerts: Array<{
    batchId: string
    parameter: string
    value: number
  }> = []
  const recentWaterRecords = await db
    .selectFrom('water_quality')
    .innerJoin('batches', 'batches.id', 'water_quality.batchId')
    .select([
      'water_quality.batchId',
      'water_quality.ph',
      'water_quality.temperatureCelsius',
      'water_quality.dissolvedOxygenMgL',
      'water_quality.ammoniaMgL',
    ])
    .where('batches.status', '=', 'active')
    .where('batches.farmId', 'in', targetFarmIds)
    .orderBy('water_quality.date', 'desc')
    .limit(10)
    .execute()

  for (const record of recentWaterRecords) {
    const ph = parseFloat(String(record.ph))
    const temp = parseFloat(String(record.temperatureCelsius))
    const oxygen = parseFloat(String(record.dissolvedOxygenMgL))
    const ammonia = parseFloat(String(record.ammoniaMgL))

    if (ph < 6.5 || ph > 9.0) {
      waterAlerts.push({ batchId: record.batchId, parameter: 'pH', value: ph })
    }
    if (temp < 25 || temp > 30) {
      waterAlerts.push({
        batchId: record.batchId,
        parameter: 'Temperature',
        value: temp,
      })
    }
    if (oxygen < 5) {
      waterAlerts.push({
        batchId: record.batchId,
        parameter: 'Dissolved Oxygen',
        value: oxygen,
      })
    }
    if (ammonia > 0.02) {
      waterAlerts.push({
        batchId: record.batchId,
        parameter: 'Ammonia',
        value: ammonia,
      })
    }
  }

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
        eb('sales.farmId', 'is', null), // Avoid excluding customers with no sales in join if we want them? No, we want top customers for these farms.
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
    alerts: {
      highMortality,
      upcomingVaccinations: upcomingVaccinations
        .filter((v) => v.dueDate)
        .map((v) => ({
          ...v,
          dueDate: v.dueDate!,
        })),
      overdueVaccinations: overdueVaccinations
        .filter((v) => v.dueDate)
        .map((v) => ({
          ...v,
          dueDate: v.dueDate!,
        })),
      waterQualityAlerts: waterAlerts.slice(0, 5),
    },
    topCustomers: topCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      totalSpent: parseFloat(String(c.totalSpent)),
    })),
    recentTransactions,
  }
}
