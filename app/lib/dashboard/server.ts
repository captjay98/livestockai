import { db } from '~/lib/db'
import { sql } from 'kysely'

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
  }
  production: {
    eggsThisMonth: number
    layingPercentage: number
  }
  alerts: {
    highMortality: Array<{ batchId: string; species: string; rate: number }>
    upcomingVaccinations: Array<{ batchId: string; species: string; vaccineName: string; dueDate: Date }>
    overdueVaccinations: Array<{ batchId: string; species: string; vaccineName: string; dueDate: Date }>
    waterQualityAlerts: Array<{ batchId: string; parameter: string; value: number }>
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

export async function getDashboardStats(farmId?: string): Promise<DashboardStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Inventory summary
  let batchQuery = db
    .selectFrom('batches')
    .select([
      'livestockType',
      sql<number>`SUM(CAST("currentQuantity" AS INTEGER))`.as('total'),
    ])
    .where('status', '=', 'active')
    .groupBy('livestockType')

  if (farmId) {
    batchQuery = batchQuery.where('farmId', '=', farmId)
  }

  const inventoryByType = await batchQuery.execute()

  const totalPoultry = inventoryByType.find(i => i.livestockType === 'poultry')?.total || 0
  const totalFish = inventoryByType.find(i => i.livestockType === 'fish')?.total || 0

  let activeBatchesQuery = db
    .selectFrom('batches')
    .select(sql<number>`COUNT(*)`.as('count'))
    .where('status', '=', 'active')

  if (farmId) {
    activeBatchesQuery = activeBatchesQuery.where('farmId', '=', farmId)
  }

  const activeBatchesResult = await activeBatchesQuery.executeTakeFirst()
  const activeBatches = Number(activeBatchesResult?.count || 0)

  // Monthly revenue
  let salesQuery = db
    .selectFrom('sales')
    .select(sql<string>`COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0)`.as('total'))
    .where('date', '>=', startOfMonth)
    .where('date', '<=', endOfMonth)

  if (farmId) {
    salesQuery = salesQuery.where('farmId', '=', farmId)
  }

  const salesResult = await salesQuery.executeTakeFirst()
  const monthlyRevenue = parseFloat(salesResult?.total || '0')

  // Monthly expenses
  let expensesQuery = db
    .selectFrom('expenses')
    .select(sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`.as('total'))
    .where('date', '>=', startOfMonth)
    .where('date', '<=', endOfMonth)

  if (farmId) {
    expensesQuery = expensesQuery.where('farmId', '=', farmId)
  }

  const expensesResult = await expensesQuery.executeTakeFirst()
  const monthlyExpenses = parseFloat(expensesResult?.total || '0')

  // Egg production this month
  const eggsQuery = await db
    .selectFrom('egg_records')
    .innerJoin('batches', 'batches.id', 'egg_records.batchId')
    .select([
      sql<number>`COALESCE(SUM("quantityCollected"), 0)`.as('totalEggs'),
    ])
    .where('egg_records.date', '>=', startOfMonth)
    .where('egg_records.date', '<=', endOfMonth)
    .$if(!!farmId, (qb) => qb.where('batches.farmId', '=', farmId!))
    .executeTakeFirst()

  const eggsThisMonth = Number(eggsQuery?.totalEggs || 0)

  // Calculate laying percentage (eggs / layer birds)
  const layerBirdsQuery = await db
    .selectFrom('batches')
    .select(sql<number>`COALESCE(SUM("currentQuantity"), 0)`.as('total'))
    .where('species', 'ilike', '%layer%')
    .where('status', '=', 'active')
    .$if(!!farmId, (qb) => qb.where('farmId', '=', farmId!))
    .executeTakeFirst()

  const layerBirds = Number(layerBirdsQuery?.total || 0)
  const daysInMonth = endOfMonth.getDate()
  const layingPercentage = layerBirds > 0 
    ? (eggsThisMonth / (layerBirds * daysInMonth)) * 100 
    : 0

  // High mortality batches (>5% mortality rate)
  const mortalityQuery = await db
    .selectFrom('batches')
    .leftJoin('mortality_records', 'mortality_records.batchId', 'batches.id')
    .select([
      'batches.id as batchId',
      'batches.species',
      'batches.initialQuantity',
      sql<number>`COALESCE(SUM(mortality_records.quantity), 0)`.as('totalDeaths'),
    ])
    .where('batches.status', '=', 'active')
    .$if(!!farmId, (qb) => qb.where('batches.farmId', '=', farmId!))
    .groupBy(['batches.id', 'batches.species', 'batches.initialQuantity'])
    .execute()

  const highMortality = mortalityQuery
    .map(b => ({
      batchId: b.batchId,
      species: b.species,
      rate: (Number(b.totalDeaths) / b.initialQuantity) * 100,
    }))
    .filter(b => b.rate > 5)
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
    .$if(!!farmId, (qb) => qb.where('batches.farmId', '=', farmId!))
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
    .$if(!!farmId, (qb) => qb.where('batches.farmId', '=', farmId!))
    .orderBy('vaccinations.nextDueDate', 'asc')
    .limit(5)
    .execute()

  // Water quality alerts
  const waterAlerts: Array<{ batchId: string; parameter: string; value: number }> = []
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
    .$if(!!farmId, (qb) => qb.where('batches.farmId', '=', farmId!))
    .orderBy('water_quality.date', 'desc')
    .limit(10)
    .execute()

  for (const record of recentWaterRecords) {
    const ph = parseFloat(record.ph)
    const temp = parseFloat(record.temperatureCelsius)
    const oxygen = parseFloat(record.dissolvedOxygenMgL)
    const ammonia = parseFloat(record.ammoniaMgL)

    if (ph < 6.5 || ph > 9.0) {
      waterAlerts.push({ batchId: record.batchId, parameter: 'pH', value: ph })
    }
    if (temp < 25 || temp > 30) {
      waterAlerts.push({ batchId: record.batchId, parameter: 'Temperature', value: temp })
    }
    if (oxygen < 5) {
      waterAlerts.push({ batchId: record.batchId, parameter: 'Dissolved Oxygen', value: oxygen })
    }
    if (ammonia > 0.02) {
      waterAlerts.push({ batchId: record.batchId, parameter: 'Ammonia', value: ammonia })
    }
  }

  // Top customers
  const topCustomers = await db
    .selectFrom('customers')
    .leftJoin('sales', 'sales.customerId', 'customers.id')
    .select([
      'customers.id',
      'customers.name',
      sql<string>`COALESCE(SUM(CAST(sales."totalAmount" AS DECIMAL)), 0)`.as('totalSpent'),
    ])
    .groupBy(['customers.id', 'customers.name'])
    .orderBy(sql`COALESCE(SUM(CAST(sales."totalAmount" AS DECIMAL)), 0)`, 'desc')
    .limit(5)
    .execute()

  // Recent transactions
  const recentSales = await db
    .selectFrom('sales')
    .select([
      'id',
      sql<'sale'>`'sale'`.as('type'),
      sql<string>`CONCAT("livestockType", ' sale - ', quantity, ' units')`.as('description'),
      'totalAmount as amount',
      'date',
    ])
    .$if(!!farmId, (qb) => qb.where('farmId', '=', farmId!))
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
    .$if(!!farmId, (qb) => qb.where('farmId', '=', farmId!))
    .orderBy('date', 'desc')
    .limit(5)
    .execute()

  const recentTransactions = [...recentSales, ...recentExpenses]
    .map(t => ({
      id: t.id,
      type: t.type as 'sale' | 'expense',
      description: t.description,
      amount: parseFloat(t.amount),
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
    },
    production: {
      eggsThisMonth,
      layingPercentage: Math.round(layingPercentage * 10) / 10,
    },
    alerts: {
      highMortality,
      upcomingVaccinations: upcomingVaccinations.map(v => ({
        ...v,
        dueDate: v.dueDate!,
      })).filter(v => v.dueDate),
      overdueVaccinations: overdueVaccinations.map(v => ({
        ...v,
        dueDate: v.dueDate!,
      })).filter(v => v.dueDate),
      waterQualityAlerts: waterAlerts.slice(0, 5),
    },
    topCustomers: topCustomers.map(c => ({
      id: c.id,
      name: c.name,
      totalSpent: parseFloat(c.totalSpent),
    })),
    recentTransactions,
  }
}
