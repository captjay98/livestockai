import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

interface ReadingInsert {
    sensorId: string
    value: number
    recordedAt: Date
    isAnomaly?: boolean
    metadata?: Record<string, any> | null
}

export async function insertReading(
    db: Kysely<Database>,
    data: ReadingInsert,
): Promise<string> {
    const result = await db
        .insertInto('sensor_readings')
        .values({
            sensorId: data.sensorId,
            value: String(data.value),
            recordedAt: data.recordedAt,
            isAnomaly: data.isAnomaly ?? false,
            metadata: data.metadata ?? null,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function insertReadingsBatch(
    db: Kysely<Database>,
    readings: Array<ReadingInsert>,
): Promise<number> {
    if (readings.length === 0) return 0

    const result = await db
        .insertInto('sensor_readings')
        .values(
            readings.map((r) => ({
                sensorId: r.sensorId,
                value: String(r.value),
                recordedAt: r.recordedAt,
                isAnomaly: r.isAnomaly ?? false,
                metadata: r.metadata ?? null,
            })),
        )
        .onConflict((oc) => oc.columns(['sensorId', 'recordedAt']).doNothing())
        .execute()

    return result.length
}

export async function getLatestReading(db: Kysely<Database>, sensorId: string) {
    const row = await db
        .selectFrom('sensor_readings')
        .select(['id', 'sensorId', 'value', 'recordedAt', 'isAnomaly'])
        .where('sensorId', '=', sensorId)
        .orderBy('recordedAt', 'desc')
        .limit(1)
        .executeTakeFirst()

    if (!row) return null
    return { ...row, value: Number(row.value) }
}

export async function getReadingsInRange(
    db: Kysely<Database>,
    sensorId: string,
    startDate: Date,
    endDate: Date,
    limit = 1000,
) {
    const rows = await db
        .selectFrom('sensor_readings')
        .select([
            'id',
            'sensorId',
            'value',
            'recordedAt',
            'isAnomaly',
            'metadata',
        ])
        .where('sensorId', '=', sensorId)
        .where('recordedAt', '>=', startDate)
        .where('recordedAt', '<=', endDate)
        .orderBy('recordedAt', 'desc')
        .limit(limit)
        .execute()

    return rows.map((r) => ({ ...r, value: Number(r.value) }))
}
