import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

export interface OutbreakAlertInsert {
    districtId: string
    species: string
    livestockType: string
    severity: 'watch' | 'alert' | 'critical'
    status?: 'active' | 'monitoring' | 'resolved' | 'false_positive'
    notes?: string | null
    createdBy: string
    updatedBy: string
}

export interface OutbreakAlertWithFarms {
    id: string
    districtId: string
    species: string
    livestockType: string
    severity: 'watch' | 'alert' | 'critical'
    status: 'active' | 'monitoring' | 'resolved' | 'false_positive'
    detectedAt: Date
    resolvedAt: Date | null
    notes: string | null
    createdBy: string
    updatedAt: Date
    updatedBy: string
    farms: Array<{
        farmId: string
        mortalityRate: string
        reportedAt: Date
    }>
}

export async function createOutbreakAlert(
    db: Kysely<Database>,
    data: OutbreakAlertInsert,
): Promise<string> {
    const result = await db
        .insertInto('outbreak_alerts')
        .values({
            ...data,
            status: data.status || 'active',
        })
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getOutbreakAlert(
    db: Kysely<Database>,
    alertId: string,
): Promise<OutbreakAlertWithFarms | null> {
    const alert = await db
        .selectFrom('outbreak_alerts')
        .selectAll()
        .where('id', '=', alertId)
        .executeTakeFirst()

    if (!alert) return null

    const farms = await db
        .selectFrom('outbreak_alert_farms')
        .selectAll()
        .where('alertId', '=', alertId)
        .execute()

    return {
        ...alert,
        farms,
    }
}

export async function getActiveAlerts(
    db: Kysely<Database>,
    districtId: string,
): Promise<Array<OutbreakAlertWithFarms>> {
    const alerts = await db
        .selectFrom('outbreak_alerts')
        .selectAll()
        .where('districtId', '=', districtId)
        .where('status', 'in', ['active', 'monitoring'])
        .orderBy('detectedAt', 'desc')
        .execute()

    const alertsWithFarms = await Promise.all(
        alerts.map(async (alert) => {
            const farms = await db
                .selectFrom('outbreak_alert_farms')
                .selectAll()
                .where('alertId', '=', alert.id)
                .execute()
            return { ...alert, farms }
        }),
    )

    return alertsWithFarms
}

export async function addFarmToAlert(
    db: Kysely<Database>,
    alertId: string,
    farmId: string,
    mortalityRate: number,
): Promise<void> {
    await db
        .insertInto('outbreak_alert_farms')
        .values({
            alertId,
            farmId,
            mortalityRate: mortalityRate.toFixed(2),
        })
        .execute()
}

export async function updateAlertStatus(
    db: Kysely<Database>,
    alertId: string,
    status: 'active' | 'monitoring' | 'resolved' | 'false_positive',
    updatedBy: string,
    notes?: string,
): Promise<void> {
    await db
        .updateTable('outbreak_alerts')
        .set({
            status,
            updatedBy,
            updatedAt: new Date(),
            ...(notes && { notes }),
            ...(status === 'resolved' && { resolvedAt: new Date() }),
        })
        .where('id', '=', alertId)
        .execute()
}

export async function resolveAlert(
    db: Kysely<Database>,
    alertId: string,
    updatedBy: string,
    notes?: string,
): Promise<void> {
    await updateAlertStatus(db, alertId, 'resolved', updatedBy, notes)
}
