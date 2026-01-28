/**
 * Scheduled Worker for Extension Worker Mode
 * Handles cron-triggered tasks for access management and outbreak detection
 */

import { EXTENSION_DEFAULTS } from './constants'
import type { Database } from '~/lib/db/types'
import type { Kysely } from 'kysely'

interface ScheduledEvent {
    cron: string
    scheduledTime: number
}

/**
 * Main scheduled event handler - dispatches to specific functions based on cron
 */
export async function handleScheduled(event: ScheduledEvent): Promise<void> {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
        switch (event.cron) {
            case '0 */6 * * *': // Every 6 hours
                await expireAccessGrants(db)
                await expireAccessRequests(db)
                break

            case '0 0 * * *': // Daily at midnight
                await sendExpirationWarnings(db)
                break

            case '0 9 * * *': // Daily at 9 AM
                await runOutbreakDetectionTask(db)
                break

            default:
                console.warn(`Unknown cron schedule: ${event.cron}`)
        }
    } catch (error) {
        console.error('Scheduled task failed:', error)
        throw error
    }
}

/**
 * Expire access grants that have passed their expiry date
 */
export async function expireAccessGrants(db: Kysely<Database>): Promise<void> {
    const now = new Date()

    const expired = await db
        .selectFrom('access_grants')
        .select(['id', 'userId', 'farmId'])
        .where('revokedAt', 'is', null)
        .where('expiresAt', '<', now)
        .execute()

    if (expired.length > 0) {
        await db
            .updateTable('access_grants')
            .set({
                revokedAt: now,
                revokedReason: 'automatic_expiry',
            })
            .where('revokedAt', 'is', null)
            .where('expiresAt', '<', now)
            .execute()

        console.log(`Expired ${expired.length} access grants`)

        for (const grant of expired) {
            await db
                .insertInto('audit_logs')
                .values({
                    userId: grant.userId,
                    action: 'expire_access_grant',
                    entityType: 'access_grant',
                    entityId: grant.id,
                    details: JSON.stringify({
                        farmId: grant.farmId,
                        reason: 'automatic_expiry',
                    }),
                })
                .execute()
        }
    }
}

/**
 * Expire pending access requests after 30 days
 */
export async function expireAccessRequests(
    db: Kysely<Database>,
): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(
        cutoffDate.getDate() - EXTENSION_DEFAULTS.ACCESS_REQUEST_EXPIRY_DAYS,
    )

    const expired = await db
        .selectFrom('access_requests')
        .select(['id', 'requesterId', 'farmId'])
        .where('status', '=', 'pending')
        .where('createdAt', '<', cutoffDate)
        .execute()

    if (expired.length > 0) {
        await db
            .updateTable('access_requests')
            .set({ status: 'expired' })
            .where('status', '=', 'pending')
            .where('createdAt', '<', cutoffDate)
            .execute()

        console.log(`Expired ${expired.length} pending access requests`)

        for (const request of expired) {
            await db
                .insertInto('audit_logs')
                .values({
                    userId: request.requesterId,
                    action: 'expire_access_request',
                    entityType: 'access_request',
                    entityId: request.id,
                    details: JSON.stringify({
                        farmId: request.farmId,
                        reason: 'automatic_expiry',
                    }),
                })
                .execute()
        }
    }
}

/**
 * Send expiration warnings 7 days before access grants expire
 */
export async function sendExpirationWarnings(
    db: Kysely<Database>,
): Promise<void> {
    const warningDate = new Date()
    warningDate.setDate(
        warningDate.getDate() + EXTENSION_DEFAULTS.ACCESS_EXPIRY_WARNING_DAYS,
    )

    const today = new Date()

    const expiringGrants = await db
        .selectFrom('access_grants')
        .innerJoin('users', 'users.id', 'access_grants.userId')
        .innerJoin('farms', 'farms.id', 'access_grants.farmId')
        .select([
            'access_grants.id',
            'access_grants.userId',
            'access_grants.farmId',
            'access_grants.expiresAt',
            'users.name as userName',
            'farms.name as farmName',
        ])
        .where('access_grants.revokedAt', 'is', null)
        .where('access_grants.expiresAt', '>', today)
        .where('access_grants.expiresAt', '<=', warningDate)
        .execute()

    if (expiringGrants.length > 0) {
        console.log(
            `Found ${expiringGrants.length} grants expiring within ${EXTENSION_DEFAULTS.ACCESS_EXPIRY_WARNING_DAYS} days`,
        )

        const { createNotification } = await import(
            '~/features/notifications/server'
        )

        for (const grant of expiringGrants) {
            const daysUntilExpiry = Math.ceil(
                (grant.expiresAt.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24),
            )

            await createNotification({
                userId: grant.userId,
                farmId: grant.farmId,
                type: 'accessExpiring',
                title: 'Access Expiring Soon',
                message: `Your access to ${grant.farmName} will expire in ${daysUntilExpiry} days`,
                actionUrl: `/extension/farm/${grant.farmId}`,
            })
        }
    }
}

/**
 * Run outbreak detection across all districts
 */
export async function runOutbreakDetectionTask(
    db: Kysely<Database>,
): Promise<void> {
    // Get all active districts with farms
    const districts = await db
        .selectFrom('regions')
        .select(['id', 'name'])
        .where('level', '=', 2)
        .where('isActive', '=', true)
        .execute()

    console.log(`Running outbreak detection for ${districts.length} districts`)

    // Get species thresholds
    const thresholds = await db
        .selectFrom('species_thresholds')
        .selectAll()
        .execute()

    // Build threshold map
    const thresholdMap: Record<string, { amber: number; red: number }> = {}
    for (const t of thresholds) {
        thresholdMap[t.species] = {
            amber: Number(t.amberThreshold),
            red: Number(t.redThreshold),
        }
    }

    // R9.4: Exclude batches <7 days old
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    for (const district of districts) {
        // Get farms in district with mortality data
        // R9.3: Only include batches with >= 50 animals
        // R9.4: Exclude batches acquired less than 7 days ago
        const farmData = await db
            .selectFrom('farms')
            .innerJoin('batches', 'batches.farmId', 'farms.id')
            .leftJoin(
                'mortality_records',
                'mortality_records.batchId',
                'batches.id',
            )
            .select([
                'farms.id as farmId',
                'farms.name as farmName',
                'batches.species',
                'batches.initialQuantity',
                db.fn.sum('mortality_records.quantity').as('totalMortality'),
            ])
            .where('farms.districtId', '=', district.id)
            .where('batches.status', '=', 'active')
            .where('batches.initialQuantity', '>=', 50)
            .where('batches.acquisitionDate', '<=', sevenDaysAgo)
            .groupBy(['farms.id', 'farms.name', 'batches.species', 'batches.initialQuantity'])
            .execute()

        if (farmData.length === 0) continue

        // Check for high mortality by species
        const speciesMortality: Record<string, { total: number; count: number }> = {}
        
        for (const f of farmData) {
            const mortalityRate = f.initialQuantity > 0
                ? (Number(f.totalMortality || 0) / f.initialQuantity) * 100
                : 0
            
            if (f.species in speciesMortality) {
                speciesMortality[f.species].total += mortalityRate
                speciesMortality[f.species].count += 1
            } else {
                speciesMortality[f.species] = { total: mortalityRate, count: 1 }
            }
        }

        // Check each species against thresholds
        for (const [species, speciesData] of Object.entries(speciesMortality)) {
            const avgMortality = speciesData.total / speciesData.count
            const threshold = thresholdMap[species] ?? { amber: 5, red: 10 }
            
            let severity: 'watch' | 'alert' | 'critical' | null = null
            if (avgMortality >= threshold.red) {
                severity = 'critical'
            } else if (avgMortality >= threshold.amber) {
                severity = 'alert'
            }

            if (severity) {
                // Check if alert already exists
                const existing = await db
                    .selectFrom('outbreak_alerts')
                    .select('id')
                    .where('districtId', '=', district.id)
                    .where('species', '=', species)
                    .where('status', 'in', ['active', 'monitoring'])
                    .executeTakeFirst()

                if (!existing) {
                    await db
                        .insertInto('outbreak_alerts')
                        .values({
                            districtId: district.id,
                            species,
                            livestockType: species.includes('broiler') || species.includes('layer') ? 'poultry' : 'fish',
                            severity,
                            status: 'active',
                            createdBy: 'system',
                            updatedBy: 'system',
                        })
                        .execute()

                    console.log(
                        `Created ${severity} outbreak alert for ${species} in ${district.name}`,
                    )
                }
            }
        }
    }
}
