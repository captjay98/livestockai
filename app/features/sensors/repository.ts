import type { Kysely } from 'kysely'
import type { Database, SensorType } from '~/lib/db/types'

interface SensorInsert {
    farmId: string
    structureId: string | null
    name: string
    sensorType: SensorType
    apiKeyHash: string
    pollingIntervalMinutes: number
}

interface SensorUpdate {
    name?: string
    structureId?: string | null
    pollingIntervalMinutes?: number
    isActive?: boolean
    apiKeyHash?: string
}

export async function insertSensor(
    db: Kysely<Database>,
    data: SensorInsert,
): Promise<string> {
    const result = await db
        .insertInto('sensors')
        .values(data)
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getSensorById(db: Kysely<Database>, id: string) {
    return db
        .selectFrom('sensors')
        .select([
            'id',
            'farmId',
            'structureId',
            'name',
            'sensorType',
            'apiKeyHash',
            'pollingIntervalMinutes',
            'isActive',
            'lastReadingAt',
            'lastUsedAt',
            'requestCount',
            'thresholds',
            'trendConfig',
            'createdAt',
        ])
        .where('id', '=', id)
        .where('deletedAt', 'is', null)
        .executeTakeFirst()
}

export async function getSensorsByFarm(
    db: Kysely<Database>,
    farmIds: Array<string>,
) {
    return db
        .selectFrom('sensors')
        .leftJoin('structures', 'structures.id', 'sensors.structureId')
        .select([
            'sensors.id',
            'sensors.farmId',
            'sensors.structureId',
            'sensors.name',
            'sensors.sensorType',
            'sensors.pollingIntervalMinutes',
            'sensors.isActive',
            'sensors.lastReadingAt',
            'sensors.createdAt',
            'structures.name as structureName',
        ])
        .where('sensors.farmId', 'in', farmIds)
        .where('sensors.deletedAt', 'is', null)
        .orderBy('sensors.name')
        .execute()
}

export async function getSensorByApiKeyHash(
    db: Kysely<Database>,
    apiKeyHash: string,
) {
    return db
        .selectFrom('sensors')
        .select([
            'id',
            'farmId',
            'structureId',
            'name',
            'sensorType',
            'pollingIntervalMinutes',
            'isActive',
            'thresholds',
            'trendConfig',
        ])
        .where('apiKeyHash', '=', apiKeyHash)
        .where('deletedAt', 'is', null)
        .executeTakeFirst()
}

export async function updateSensor(
    db: Kysely<Database>,
    id: string,
    data: SensorUpdate,
) {
    await db.updateTable('sensors').set(data).where('id', '=', id).execute()
}

export async function updateLastReadingAt(db: Kysely<Database>, id: string) {
    await db
        .updateTable('sensors')
        .set({ lastReadingAt: new Date() })
        .where('id', '=', id)
        .execute()
}

export async function incrementApiUsage(db: Kysely<Database>, id: string) {
    await db
        .updateTable('sensors')
        .set((eb) => ({
            lastUsedAt: new Date(),
            requestCount: eb('requestCount', '+', 1),
        }))
        .where('id', '=', id)
        .execute()
}

export async function getSensorSummaryByFarm(
    db: Kysely<Database>,
    farmId: string,
) {
    const sensors = await db
        .selectFrom('sensors')
        .select([
            'id',
            'name',
            'sensorType',
            'isActive',
            'lastReadingAt',
            'pollingIntervalMinutes',
        ])
        .where('farmId', '=', farmId)
        .where('deletedAt', 'is', null)
        .execute()

    const alertCount = await db
        .selectFrom('sensor_alerts')
        .innerJoin('sensors', 'sensors.id', 'sensor_alerts.sensorId')
        .select(db.fn.count('sensor_alerts.id').as('count'))
        .where('sensors.farmId', '=', farmId)
        .where('sensor_alerts.acknowledgedAt', 'is', null)
        .executeTakeFirst()

    return { sensors, alertCount: Number(alertCount?.count ?? 0) }
}

export async function softDeleteSensor(db: Kysely<Database>, id: string) {
    await db
        .updateTable('sensors')
        .set({ deletedAt: new Date() })
        .where('id', '=', id)
        .execute()
}
