import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { SENSOR_TYPES } from './constants'
import { AppError } from '~/lib/errors'

export const createSensorFn = createServerFn({ method: 'POST' })
    .inputValidator(
        z.object({
            farmId: z.string().uuid(),
            structureId: z.string().uuid().optional(),
            name: z.string().min(1).max(100),
            sensorType: z.enum(
                SENSOR_TYPES as unknown as [string, ...Array<string>],
            ),
            pollingIntervalMinutes: z.number().int().min(5).max(60).default(15),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { generateApiKey, hashApiKey } = await import('./service')
        const { insertSensor } = await import('./repository')

        const apiKey = generateApiKey()
        const apiKeyHash = await hashApiKey(apiKey)

        const sensorId = await insertSensor(db, {
            farmId: data.farmId,
            structureId: data.structureId ?? null,
            name: data.name,
            sensorType: data.sensorType as any,
            apiKeyHash,
            pollingIntervalMinutes: data.pollingIntervalMinutes,
        })

        return { sensorId, apiKey }
    })

export const getSensorsFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid().optional() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getUserFarms } = await import('~/features/auth/utils')
        const { getSensorsByFarm } = await import('./repository')
        const { getSensorStatus } = await import('./service')

        const farmIds = data.farmId
            ? [data.farmId]
            : await getUserFarms(session.user.id)
        if (farmIds.length === 0) return []

        const sensors = await getSensorsByFarm(db, farmIds)
        return sensors.map((s) => ({
            ...s,
            status: getSensorStatus(s.lastReadingAt, s.pollingIntervalMinutes),
        }))
    })

export const getSensorFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ sensorId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getSensorById } = await import('./repository')

        const sensor = await getSensorById(db, data.sensorId)
        if (!sensor) throw new AppError('SENSOR_NOT_FOUND')
        return sensor
    })

export const updateSensorFn = createServerFn({ method: 'POST' })
    .inputValidator(
        z.object({
            sensorId: z.string().uuid(),
            name: z.string().min(1).max(100).optional(),
            structureId: z.string().uuid().nullish(),
            pollingIntervalMinutes: z.number().int().min(5).max(60).optional(),
            isActive: z.boolean().optional(),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { updateSensor } = await import('./repository')

        const { sensorId, ...updates } = data
        await updateSensor(db, sensorId, updates)
        return { success: true }
    })

export const deleteSensorFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ sensorId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { softDeleteSensor } = await import('./repository')

        await softDeleteSensor(db, data.sensorId)
        return { success: true }
    })

export const regenerateApiKeyFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ sensorId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { generateApiKey, hashApiKey } = await import('./service')
        const { updateSensor } = await import('./repository')

        const apiKey = generateApiKey()
        const apiKeyHash = await hashApiKey(apiKey)
        await updateSensor(db, data.sensorId, { apiKeyHash })
        return { apiKey }
    })

export const getSensorChartDataFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            sensorId: z.string().uuid(),
            startDate: z.coerce.date(),
            endDate: z.coerce.date(),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getReadingsInRange } = await import('./readings-repository')

        return getReadingsInRange(
            db,
            data.sensorId,
            data.startDate,
            data.endDate,
            500,
        )
    })

export const acknowledgeAlertFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ alertId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { acknowledgeAlert } = await import('./alerts-repository')

        await acknowledgeAlert(db, data.alertId, session.user.id)
        return { success: true }
    })

export const getSensorSummaryFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getSensorSummaryByFarm } = await import('./repository')
        const { getSensorStatus } = await import('./service')

        const { sensors, alertCount } = await getSensorSummaryByFarm(
            db,
            data.farmId,
        )

        const sensorsWithStatus = sensors.map((s) => ({
            ...s,
            status: getSensorStatus(s.lastReadingAt, s.pollingIntervalMinutes),
        }))

        const activeSensors = sensorsWithStatus.filter(
            (s) => s.status === 'online',
        ).length
        const inactiveSensors = sensorsWithStatus.filter(
            (s) => s.status === 'offline',
        ).length

        return {
            totalSensors: sensors.length,
            activeSensors,
            inactiveSensors,
            alertCount,
            sensors: sensorsWithStatus,
        }
    })

export const ingestReadingsFn = createServerFn({ method: 'POST' })
    .inputValidator(
        z.object({
            apiKey: z.string(),
            readings: z
                .array(
                    z.object({
                        value: z.number(),
                        recordedAt: z.coerce.date().optional(),
                    }),
                )
                .min(1)
                .max(100),
        }),
    )
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { hashApiKey } = await import('./service')
        const {
            getSensorByApiKeyHash,
            updateLastReadingAt,
            incrementApiUsage,
        } = await import('./repository')
        const { insertReadingsBatch } = await import('./readings-repository')

        const apiKeyHash = await hashApiKey(data.apiKey)
        const sensor = await getSensorByApiKeyHash(db, apiKeyHash)

        if (!sensor) throw new AppError('INVALID_API_KEY')
        if (!sensor.isActive) throw new AppError('SENSOR_INACTIVE')

        // Track API usage
        await incrementApiUsage(db, sensor.id)

        const now = new Date()
        await insertReadingsBatch(
            db,
            data.readings.map((r) => ({
                sensorId: sensor.id,
                value: r.value,
                recordedAt: r.recordedAt ?? now,
            })),
        )

        await updateLastReadingAt(db, sensor.id)

        return { success: true, count: data.readings.length }
    })

export const getMortalityForChartFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            structureId: z.string().uuid(),
            startDate: z.coerce.date(),
            endDate: z.coerce.date(),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        // Get mortality events for batches in this structure
        const events = await db
            .selectFrom('mortality_records')
            .innerJoin('batches', 'batches.id', 'mortality_records.batchId')
            .select([
                'mortality_records.date',
                'mortality_records.quantity',
                'mortality_records.cause',
                'batches.species',
            ])
            .where('batches.structureId', '=', data.structureId)
            .where('mortality_records.date', '>=', data.startDate)
            .where('mortality_records.date', '<=', data.endDate)
            .orderBy('mortality_records.date')
            .execute()

        return events.map((e) => ({
            date: e.date,
            quantity: e.quantity,
            cause: e.cause,
            species: e.species,
        }))
    })

export const getEnvironmentalScoreFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            structureId: z.string().uuid(),
            days: z.number().int().min(1).max(90).default(7),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const startDate = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000)

        // Get sensors for this structure
        const sensors = await db
            .selectFrom('sensors')
            .select(['id', 'sensorType'])
            .where('structureId', '=', data.structureId)
            .where('deletedAt', 'is', null)
            .execute()

        if (sensors.length === 0) {
            return {
                score: null,
                factors: [],
                message: 'No sensors in structure',
            }
        }

        const sensorIds = sensors.map((s) => s.id)

        // Get aggregated readings
        const readings = await db
            .selectFrom('sensor_readings')
            .select([
                'sensorId',
                db.fn.avg('value').as('avgValue'),
                db.fn.min('value').as('minValue'),
                db.fn.max('value').as('maxValue'),
            ])
            .where('sensorId', 'in', sensorIds)
            .where('recordedAt', '>=', startDate)
            .groupBy('sensorId')
            .execute()

        // Calculate score based on how well readings stay within thresholds
        const { SENSOR_TYPE_CONFIG } = await import('./constants')

        const factors: Array<{ type: string; score: number; status: string }> =
            []
        let totalScore = 0
        let factorCount = 0

        for (const sensor of sensors) {
            const reading = readings.find((r) => r.sensorId === sensor.id)
            if (!reading) continue

            const config = SENSOR_TYPE_CONFIG[sensor.sensorType]

            const avg = Number(reading.avgValue)
            const { min, max } = config.defaultThresholds
            const range = max - min
            const midpoint = (min + max) / 2

            // Score: 100 if at midpoint, decreasing as it moves toward thresholds
            const deviation = Math.abs(avg - midpoint)
            const maxDeviation = range / 2
            const score = Math.max(
                0,
                Math.round(100 - (deviation / maxDeviation) * 50),
            )

            const status = avg < min ? 'low' : avg > max ? 'high' : 'optimal'
            factors.push({ type: config.label, score, status })
            totalScore += score
            factorCount++
        }

        const overallScore =
            factorCount > 0 ? Math.round(totalScore / factorCount) : null

        return {
            score: overallScore,
            factors,
            message:
                overallScore === null
                    ? 'No data available'
                    : overallScore >= 80
                      ? 'Excellent conditions'
                      : overallScore >= 60
                        ? 'Good conditions'
                        : 'Needs attention',
        }
    })
