import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { sql } from 'kysely'
import { z } from 'zod'
import type { DashboardData, DashboardStats } from './types'

/**
 * @module Dashboard
 *
 * Aggregates high-level farm statistics for the main dashboard view.
 * Combines data from inventory, finance, production, and monitoring modules.
 */

/**
 * Computes comprehensive dashboard statistics for a user or a specific farm.
 * Aggregates data from inventory, sales, expenses, production, and monitoring.
 *
 * @param userId - ID of the user requesting the dashboard
 * @param farmId - Optional specific farm filter (returns combined stats if omitted)
 * @returns Promise resolving to the complete breakdown of dashboard metrics
 */
export async function getDashboardStats(
    userId: string,
    farmId?: string,
): Promise<DashboardStats> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getUserFarms } = await import('../auth/utils')
    const { AppError } = await import('~/lib/errors')

    try {
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
                    mortality: { totalDeaths: 0, mortalityRate: 0 },
                    feed: { totalCost: 0, totalKg: 0, fcr: 0 },
                    alerts: [],
                    topCustomers: [],
                    recentTransactions: [],
                }
            }
        }

        // Prepare date ranges for queries
        const prevMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1,
        )
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        // Parallel Batch 1: Core metrics
        const [
            inventoryByType,
            activeBatchesResult,
            salesResult,
            prevMonthSalesResult,
            expensesResult,
            prevMonthExpensesResult,
        ] = await Promise.all([
            // Inventory summary
            db
                .selectFrom('batches')
                .select([
                    'livestockType',
                    sql<number>`SUM(CAST("currentQuantity" AS INTEGER))`.as(
                        'total',
                    ),
                ])
                .where('status', '=', 'active')
                .where('farmId', 'in', targetFarmIds)
                .groupBy('livestockType')
                .execute(),

            // Active batches count
            db
                .selectFrom('batches')
                .select(sql<number>`COUNT(*)`.as('count'))
                .where('status', '=', 'active')
                .where('farmId', 'in', targetFarmIds)
                .executeTakeFirst(),

            // Monthly revenue
            db
                .selectFrom('sales')
                .select(
                    sql<string>`COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0)`.as(
                        'total',
                    ),
                )
                .where('date', '>=', startOfMonth)
                .where('date', '<=', endOfMonth)
                .where('farmId', 'in', targetFarmIds)
                .executeTakeFirst(),

            // Previous month revenue
            db
                .selectFrom('sales')
                .select(
                    sql<string>`COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0)`.as(
                        'total',
                    ),
                )
                .where('date', '>=', prevMonthStart)
                .where('date', '<=', prevMonthEnd)
                .where('farmId', 'in', targetFarmIds)
                .executeTakeFirst(),

            // Monthly expenses
            db
                .selectFrom('expenses')
                .select(
                    sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`.as(
                        'total',
                    ),
                )
                .where('date', '>=', startOfMonth)
                .where('date', '<=', endOfMonth)
                .where('farmId', 'in', targetFarmIds)
                .executeTakeFirst(),

            // Previous month expenses
            db
                .selectFrom('expenses')
                .select(
                    sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`.as(
                        'total',
                    ),
                )
                .where('date', '>=', prevMonthStart)
                .where('date', '<=', prevMonthEnd)
                .where('farmId', 'in', targetFarmIds)
                .executeTakeFirst(),
        ])

        const totalPoultry =
            inventoryByType.find((i) => i.livestockType === 'poultry')?.total ||
            0
        const totalFish =
            inventoryByType.find((i) => i.livestockType === 'fish')?.total || 0
        const totalCattle =
            inventoryByType.find((i) => i.livestockType === 'cattle')?.total ||
            0
        const totalGoats =
            inventoryByType.find((i) => i.livestockType === 'goats')?.total || 0
        const totalSheep =
            inventoryByType.find((i) => i.livestockType === 'sheep')?.total || 0
        const totalBees =
            inventoryByType.find((i) => i.livestockType === 'bees')?.total || 0

        const activeBatches = Number(activeBatchesResult?.count || 0)
        const monthlyRevenue = parseFloat(salesResult?.total || '0')
        const prevMonthRevenue = parseFloat(prevMonthSalesResult?.total || '0')
        const revenueChange =
            prevMonthRevenue > 0
                ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
                : 0

        const monthlyExpenses = parseFloat(expensesResult?.total || '0')
        const prevMonthExpenses = parseFloat(
            prevMonthExpensesResult?.total || '0',
        )
        const expensesChange =
            prevMonthExpenses > 0
                ? ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) *
                  100
                : 0

        // Parallel Batch 2: Production & health metrics
        const [
            eggsQuery,
            layerBirdsQuery,
            mortalityQuery,
            initialQuantityQuery,
            feedQuery,
            totalWeightQuery,
        ] = await Promise.all([
            // Eggs this month
            db
                .selectFrom('egg_records')
                .innerJoin('batches', 'batches.id', 'egg_records.batchId')
                .select([
                    sql<number>`COALESCE(SUM("quantityCollected"), 0)`.as(
                        'totalEggs',
                    ),
                ])
                .where('egg_records.date', '>=', startOfMonth)
                .where('egg_records.date', '<=', endOfMonth)
                .where('batches.farmId', 'in', targetFarmIds)
                .executeTakeFirst(),

            // Layer birds count
            db
                .selectFrom('batches')
                .select(
                    sql<number>`COALESCE(SUM("currentQuantity"), 0)`.as(
                        'total',
                    ),
                )
                .where('species', 'ilike', '%layer%')
                .where('status', '=', 'active')
                .where('farmId', 'in', targetFarmIds)
                .executeTakeFirst(),

            // Mortality this month
            db
                .selectFrom('mortality_records')
                .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
                .select([
                    sql<number>`COALESCE(SUM(quantity), 0)`.as('totalDeaths'),
                ])
                .where('mortality_records.date', '>=', startOfMonth)
                .where('mortality_records.date', '<=', endOfMonth)
                .where('batches.farmId', 'in', targetFarmIds)
                .executeTakeFirst(),

            // Initial quantity for mortality rate
            db
                .selectFrom('batches')
                .select([
                    sql<number>`COALESCE(SUM("initialQuantity"), 0)`.as(
                        'total',
                    ),
                ])
                .where('status', '=', 'active')
                .where('farmId', 'in', targetFarmIds)
                .executeTakeFirst(),

            // Feed this month
            db
                .selectFrom('feed_records')
                .innerJoin('batches', 'batches.id', 'feed_records.batchId')
                .select([
                    sql<string>`COALESCE(SUM(CAST(cost AS DECIMAL)), 0)`.as(
                        'totalCost',
                    ),
                    sql<string>`COALESCE(SUM(CAST("quantityKg" AS DECIMAL)), 0)`.as(
                        'totalKg',
                    ),
                ])
                .where('feed_records.date', '>=', startOfMonth)
                .where('feed_records.date', '<=', endOfMonth)
                .where('batches.farmId', 'in', targetFarmIds)
                .executeTakeFirst(),

            // Total quantity for FCR
            db
                .selectFrom('batches')
                .select([
                    sql<number>`COALESCE(SUM("currentQuantity"), 0)`.as(
                        'totalQuantity',
                    ),
                ])
                .where('status', '=', 'active')
                .where('farmId', 'in', targetFarmIds)
                .executeTakeFirst(),
        ])

        const eggsThisMonth = Number(eggsQuery?.totalEggs || 0)
        const layerBirds = Number(layerBirdsQuery?.total || 0)
        const daysInMonth = endOfMonth.getDate()
        const layingPercentage =
            layerBirds > 0
                ? (eggsThisMonth / (layerBirds * daysInMonth)) * 100
                : 0

        const totalDeaths = Number(mortalityQuery?.totalDeaths || 0)
        const initialQuantity = Number(initialQuantityQuery?.total || 0)
        const mortalityRate =
            initialQuantity > 0 ? (totalDeaths / initialQuantity) * 100 : 0

        const feedTotalCost = parseFloat(feedQuery?.totalCost || '0')
        const feedTotalKg = parseFloat(feedQuery?.totalKg || '0')
        const totalQuantity = Number(totalWeightQuery?.totalQuantity || 0)
        const fcr = totalQuantity > 0 ? feedTotalKg / totalQuantity : 0

        // Parallel Batch 3: Lists (customers, transactions, alerts)
        const [topCustomers, recentSales, recentExpenses, alerts] =
            await Promise.all([
                // Top customers - join with sales to filter by farmId
                db
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
                    .execute(),

                // Recent sales
                db
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
                    .execute(),

                // Recent expenses
                db
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
                    .execute(),

                // Alerts (parallelize dynamic import and call)
                (async () => {
                    const { getAllBatchAlerts } =
                        await import('~/features/monitoring/server')
                    return getAllBatchAlerts({ data: { farmId } })
                })(),
            ])

        const recentTransactions = [...recentSales, ...recentExpenses]
            .map((t) => ({
                id: t.id,
                type: t.type,
                description: t.description,
                amount: parseFloat(String(t.amount)),
                date: t.date,
            }))
            .sort(
                (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
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
            mortality: {
                totalDeaths,
                mortalityRate: Math.round(mortalityRate * 10) / 10,
            },
            feed: {
                totalCost: feedTotalCost,
                totalKg: feedTotalKg,
                fcr: Math.round(fcr * 100) / 100,
            },
            alerts,
            topCustomers: topCustomers.map((c) => ({
                id: c.id,
                name: c.name,
                totalSpent: parseFloat(String(c.totalSpent)),
            })),
            recentTransactions,
        }
    } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('DATABASE_ERROR', {
            message: 'Failed to load dashboard statistics',
            cause: error,
        })
    }
}

/**
 * Server function to load dashboard data including stats and farms
 */
export const getDashboardDataFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z
            .object({
                farmId: z.string().uuid().nullish(),
            })
            .optional(),
    )
    .handler(async ({ data }): Promise<DashboardData> => {
        try {
            const { requireAuth } =
                await import('~/features/auth/server-middleware')
            const session = await requireAuth()
            const farmId = data?.farmId || undefined

            const { getUserFarms } = await import('~/features/auth/utils')
            const [stats, farmIds] = await Promise.all([
                getDashboardStats(session.user.id, farmId),
                getUserFarms(session.user.id),
            ])

            const { getDb } = await import('~/lib/db')
            const db = await getDb()
            const farms =
                farmIds.length > 0
                    ? await db
                          .selectFrom('farms')
                          .select(['id', 'name', 'location', 'type'])
                          .where('id', 'in', farmIds)
                          .execute()
                    : []

            // Get sensor summary across all farms
            let sensorSummary = {
                totalSensors: 0,
                activeSensors: 0,
                inactiveSensors: 0,
                alertCount: 0,
            }
            if (farmIds.length > 0) {
                const { getSensorStatus } =
                    await import('~/features/sensors/service')
                const sensors = await db
                    .selectFrom('sensors')
                    .select(['id', 'lastReadingAt', 'pollingIntervalMinutes'])
                    .where('farmId', 'in', farmIds)
                    .where('deletedAt', 'is', null)
                    .execute()

                const alertResult = await db
                    .selectFrom('sensor_alerts')
                    .innerJoin(
                        'sensors',
                        'sensors.id',
                        'sensor_alerts.sensorId',
                    )
                    .select(db.fn.count('sensor_alerts.id').as('count'))
                    .where('sensors.farmId', 'in', farmIds)
                    .where('sensor_alerts.acknowledgedAt', 'is', null)
                    .executeTakeFirst()

                const sensorsWithStatus = sensors.map((s) => ({
                    status: getSensorStatus(
                        s.lastReadingAt,
                        s.pollingIntervalMinutes,
                    ),
                }))

                sensorSummary = {
                    totalSensors: sensors.length,
                    activeSensors: sensorsWithStatus.filter(
                        (s) => s.status === 'online',
                    ).length,
                    inactiveSensors: sensorsWithStatus.filter(
                        (s) => s.status === 'offline',
                    ).length,
                    alertCount: Number(alertResult?.count ?? 0),
                }
            }

            return { stats, hasFarms: farms.length > 0, farms, sensorSummary }
        } catch (error) {
            if (error instanceof Error && error.message === 'UNAUTHORIZED') {
                throw redirect({ to: '/login' })
            }
            throw error
        }
    })
