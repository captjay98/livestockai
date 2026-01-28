import type { Kysely } from 'kysely'
import type { Database, SensorAlertType } from '~/lib/db/types'

interface AlertInsert {
    sensorId: string
    alertType: SensorAlertType
    severity: 'warning' | 'critical'
    triggerValue: number
    thresholdValue: number
    message: string
}

export async function insertAlert(
    db: Kysely<Database>,
    data: AlertInsert,
): Promise<string> {
    const result = await db
        .insertInto('sensor_alerts')
        .values({
            sensorId: data.sensorId,
            alertType: data.alertType,
            severity: data.severity,
            triggerValue: String(data.triggerValue),
            thresholdValue: String(data.thresholdValue),
            message: data.message,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getAlertsBySensor(
    db: Kysely<Database>,
    sensorId: string,
    limit = 50,
) {
    return db
        .selectFrom('sensor_alerts')
        .select([
            'id',
            'sensorId',
            'alertType',
            'severity',
            'triggerValue',
            'thresholdValue',
            'message',
            'acknowledged',
            'acknowledgedAt',
            'acknowledgedBy',
            'createdAt',
        ])
        .where('sensorId', '=', sensorId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .execute()
}

export async function getUnacknowledgedAlerts(
    db: Kysely<Database>,
    farmId: string,
) {
    return db
        .selectFrom('sensor_alerts')
        .innerJoin('sensors', 'sensors.id', 'sensor_alerts.sensorId')
        .select([
            'sensor_alerts.id',
            'sensor_alerts.sensorId',
            'sensor_alerts.alertType',
            'sensor_alerts.severity',
            'sensor_alerts.message',
            'sensor_alerts.createdAt',
            'sensors.name as sensorName',
        ])
        .where('sensors.farmId', '=', farmId)
        .where('sensor_alerts.acknowledged', '=', false)
        .orderBy('sensor_alerts.createdAt', 'desc')
        .execute()
}

export async function acknowledgeAlert(
    db: Kysely<Database>,
    alertId: string,
    userId: string,
) {
    await db
        .updateTable('sensor_alerts')
        .set({
            acknowledged: true,
            acknowledgedAt: new Date(),
            acknowledgedBy: userId,
        })
        .where('id', '=', alertId)
        .execute()
}

export async function getLastAlertBySensorAndType(
    db: Kysely<Database>,
    sensorId: string,
    alertType: SensorAlertType,
) {
    return db
        .selectFrom('sensor_alerts')
        .select(['id', 'createdAt'])
        .where('sensorId', '=', sensorId)
        .where('alertType', '=', alertType)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .executeTakeFirst()
}

export async function getAlertConfig(db: Kysely<Database>, sensorId: string) {
    return db
        .selectFrom('sensor_alert_config')
        .select([
            'id',
            'sensorId',
            'minThreshold',
            'maxThreshold',
            'cooldownMinutes',
            'smsEnabled',
            'emailEnabled',
        ])
        .where('sensorId', '=', sensorId)
        .executeTakeFirst()
}

export async function upsertAlertConfig(
    db: Kysely<Database>,
    sensorId: string,
    config: {
        minThreshold?: number | null
        maxThreshold?: number | null
        cooldownMinutes?: number
        smsEnabled?: boolean
        emailEnabled?: boolean
    },
) {
    await db
        .insertInto('sensor_alert_config')
        .values({
            sensorId,
            minThreshold:
                config.minThreshold != null
                    ? String(config.minThreshold)
                    : null,
            maxThreshold:
                config.maxThreshold != null
                    ? String(config.maxThreshold)
                    : null,
            cooldownMinutes: config.cooldownMinutes ?? 30,
            smsEnabled: config.smsEnabled ?? false,
            emailEnabled: config.emailEnabled ?? true,
            rateWindowMinutes: 60,
        })
        .onConflict((oc) =>
            oc.column('sensorId').doUpdateSet({
                minThreshold:
                    config.minThreshold != null
                        ? String(config.minThreshold)
                        : null,
                maxThreshold:
                    config.maxThreshold != null
                        ? String(config.maxThreshold)
                        : null,
                cooldownMinutes: config.cooldownMinutes,
                smsEnabled: config.smsEnabled,
                emailEnabled: config.emailEnabled,
                updatedAt: new Date(),
            }),
        )
        .execute()
}
