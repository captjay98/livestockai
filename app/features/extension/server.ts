import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

// Zod validation schemas
const createAccessRequestSchema = z.object({
    farmId: z.string().uuid(),
    purpose: z.string().min(1).max(500),
    durationDays: z.number().int().positive().max(365),
})

const respondToAccessRequestSchema = z.object({
    requestId: z.string().uuid(),
    approved: z.boolean(),
    reason: z.string().optional(),
})

const revokeAccessSchema = z.object({
    grantId: z.string().uuid(),
    reason: z.string().optional(),
})

const getAccessRequestsSchema = z.object({
    farmId: z.string().uuid(),
})

const getDistrictDashboardSchema = z.object({
    districtId: z.string().uuid(),
    page: z.number().int().positive().optional().default(1),
    pageSize: z.number().int().positive().max(100).optional().default(20),
    livestockType: z
        .enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees'])
        .optional(),
    healthStatus: z.enum(['healthy', 'warning', 'critical']).optional(),
    search: z.string().optional(),
})

const createVisitRecordSchema = z.object({
    farmId: z.string().uuid(),
    visitDate: z.coerce.date(),
    visitType: z.enum(['routine', 'emergency', 'follow_up']),
    findings: z.string().min(1),
    recommendations: z.string().min(1),
    attachments: z
        .array(
            z.object({
                name: z.string(),
                url: z.string(),
                type: z.string(),
                size: z.number(),
            }),
        )
        .optional(),
    followUpDate: z.coerce.date().optional(),
})

const updateVisitRecordSchema = z.object({
    id: z.string().uuid(),
    visitDate: z.coerce.date().optional(),
    visitType: z.enum(['routine', 'emergency', 'follow_up']).optional(),
    findings: z.string().min(1).optional(),
    recommendations: z.string().min(1).optional(),
    attachments: z
        .array(
            z.object({
                name: z.string(),
                url: z.string(),
                type: z.string(),
                size: z.number(),
            }),
        )
        .optional(),
    followUpDate: z.coerce.date().optional(),
})

const getVisitRecordsSchema = z.object({
    farmId: z.string().uuid().optional(),
    agentId: z.string().uuid().optional(),
})

const acknowledgeVisitSchema = z.object({
    id: z.string().uuid(),
})

const getSupervisorDashboardSchema = z.object({
    page: z.number().int().positive().optional().default(1),
    pageSize: z.number().int().positive().max(100).optional().default(20),
})

const updateOutbreakAlertSchema = z.object({
    alertId: z.string().uuid(),
    status: z
        .enum(['active', 'monitoring', 'resolved', 'false_positive'])
        .optional(),
    notes: z.string().optional(),
})

// Access workflow functions
export const createAccessRequestFn = createServerFn({ method: 'POST' })
    .inputValidator(createAccessRequestSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { createAccessRequest } = await import('./repository')
        const result = await createAccessRequest(
            db,
            session.user.id,
            data.farmId,
            data.purpose,
            data.durationDays,
        )

        // Get farm owner for notification
        const farm = await db
            .selectFrom('farms')
            .innerJoin('user_farms', 'user_farms.farmId', 'farms.id')
            .select(['user_farms.userId', 'farms.name'])
            .where('farms.id', '=', data.farmId)
            .where('user_farms.role', '=', 'owner')
            .executeTakeFirst()

        if (farm) {
            const { createNotification } =
                await import('../notifications/server')
            await createNotification({
                userId: farm.userId,
                farmId: data.farmId,
                type: 'accessRequest',
                title: 'Extension Access Request',
                message: `${session.user.name} has requested access to ${farm.name}`,
                actionUrl: `/extension/access-requests?farmId=${data.farmId}`,
            })
        }

        return result
    })

export const respondToAccessRequestFn = createServerFn({ method: 'POST' })
    .inputValidator(respondToAccessRequestSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { respondToAccessRequest } = await import('./repository')
        const { checkFarmOwnership } = await import('./service')

        // Verify user owns the farm for this request
        const hasAccess = await checkFarmOwnership(
            db,
            session.user.id,
            data.requestId,
        )
        if (!hasAccess) {
            throw new AppError('EXTENSION_ACCESS_DENIED')
        }

        // Get request details for notification
        const request = await db
            .selectFrom('access_requests')
            .innerJoin('farms', 'farms.id', 'access_requests.farmId')
            .select([
                'access_requests.requesterId',
                'farms.name as farmName',
            ])
            .where('access_requests.id', '=', data.requestId)
            .executeTakeFirst()

        const result = await respondToAccessRequest(
            db,
            data.requestId,
            session.user.id,
            data.approved,
            data.reason,
        )

        if (request) {
            const { createNotification } =
                await import('../notifications/server')
            if (data.approved) {
                await createNotification({
                    userId: request.requesterId,
                    type: 'accessGranted',
                    title: 'Access Granted',
                    message: `Your access request for ${request.farmName} has been approved`,
                    actionUrl: '/extension/my-access',
                })
            } else {
                await createNotification({
                    userId: request.requesterId,
                    type: 'accessDenied',
                    title: 'Access Denied',
                    message: `Your access request for ${request.farmName} has been denied${data.reason ? `: ${data.reason}` : ''}`,
                })
            }
        }

        return result
    })

export const revokeAccessFn = createServerFn({ method: 'POST' })
    .inputValidator(revokeAccessSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { revokeAccess } = await import('./repository')
        const { checkGrantOwnership } = await import('./service')

        // Verify user owns the farm for this grant
        const hasAccess = await checkGrantOwnership(
            db,
            session.user.id,
            data.grantId,
        )
        if (!hasAccess) {
            throw new AppError('EXTENSION_ACCESS_DENIED')
        }

        // Get grant details for notification
        const grant = await db
            .selectFrom('access_grants')
            .innerJoin('farms', 'farms.id', 'access_grants.farmId')
            .select([
                'access_grants.userId',
                'farms.name as farmName',
            ])
            .where('access_grants.id', '=', data.grantId)
            .executeTakeFirst()

        const result = await revokeAccess(db, data.grantId, session.user.id, data.reason || 'Revoked by farm owner')

        if (grant) {
            const { createNotification } =
                await import('../notifications/server')
            await createNotification({
                userId: grant.userId,
                type: 'accessExpired',
                title: 'Access Revoked',
                message: `Your access to ${grant.farmName} has been revoked`,
            })
        }

        return result
    })

export const getAccessRequestsFn = createServerFn({ method: 'POST' })
    .inputValidator(getAccessRequestsSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { checkFarmAccess } = await import('../auth/utils')

        // Verify user has access to farm
        const hasAccess = await checkFarmAccess(session.user.id, data.farmId)
        if (!hasAccess) {
            throw new AppError('EXTENSION_ACCESS_DENIED')
        }

        const { getAccessRequests } = await import('./repository')
        return getAccessRequests(db, data.farmId)
    })

export const getMyAccessGrantsFn = createServerFn({ method: 'GET' }).handler(
    async () => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getMyAccessGrants } = await import('./repository')
        return getMyAccessGrants(db, session.user.id)
    },
)

// District dashboard function
export const getDistrictDashboardFn = createServerFn({ method: 'POST' })
    .inputValidator(getDistrictDashboardSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        // Rate limiting check - max 1000 queries per day
        const { checkAndIncrementQueryLimit } = await import('./rate-limiter')
        if (!checkAndIncrementQueryLimit(session.user.id)) {
            throw new AppError('ACCESS_REQUEST_RATE_LIMITED')
        }

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { checkDistrictMembership } = await import('./service')

        // Verify user is assigned to district
        const isMember = await checkDistrictMembership(
            db,
            session.user.id,
            data.districtId,
        )
        if (!isMember) {
            throw new AppError('NOT_DISTRICT_MEMBER')
        }

        // Log audit entry
        await db
            .insertInto('audit_logs')
            .values({
                userId: session.user.id,
                userName: session.user.name,
                action: 'extension.district.view',
                entityType: 'district',
                entityId: data.districtId,
                details: JSON.stringify({
                    page: data.page,
                    pageSize: data.pageSize,
                    livestockType: data.livestockType,
                    healthStatus: data.healthStatus,
                }),
            })
            .execute()
            .catch(() => {}) // Fail silently

        const { getDistrictDashboard } = await import('./repository')
        return getDistrictDashboard(db, data)
    })

export const getUserDistrictsFn = createServerFn({ method: 'GET' }).handler(
    async () => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getUserDistricts } = await import('./repository')
        return getUserDistricts(db, session.user.id)
    },
)

// Visit Records functions
export const createVisitRecordFn = createServerFn({ method: 'POST' })
    .inputValidator(createVisitRecordSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { createVisitRecord } = await import('./visit-repository')
        const result = await createVisitRecord(db, {
            ...data,
            agentId: session.user.id,
        })

        // Get farm owner for notification
        const farm = await db
            .selectFrom('farms')
            .innerJoin('user_farms', 'user_farms.farmId', 'farms.id')
            .select(['user_farms.userId', 'farms.name'])
            .where('farms.id', '=', data.farmId)
            .where('user_farms.role', '=', 'owner')
            .executeTakeFirst()

        if (farm) {
            const { createNotification } =
                await import('../notifications/server')
            await createNotification({
                userId: farm.userId,
                farmId: data.farmId,
                type: 'visitRecordCreated',
                title: 'Visit Record Created',
                message: `${session.user.name} has created a ${data.visitType} visit record for ${farm.name}`,
                actionUrl: `/extension/visit-records?farmId=${data.farmId}`,
            })
        }

        return result
    })

export const updateVisitRecordFn = createServerFn({ method: 'POST' })
    .inputValidator(updateVisitRecordSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getVisitRecord, updateVisitRecord } =
            await import('./visit-repository')
        const { isWithinEditWindow } = await import('./access-service')

        // Get visit record to check ownership and edit window
        const visit = await getVisitRecord(db, data.id)
        if (!visit || visit.agentId !== session.user.id) {
            throw new AppError('EXTENSION_ACCESS_DENIED')
        }

        // Check edit window (24 hours from EXTENSION_DEFAULTS)
        if (!isWithinEditWindow(visit.createdAt, 24)) {
            throw new AppError('EDIT_WINDOW_EXPIRED')
        }

        const { id, ...updateData } = data
        return updateVisitRecord(db, id, updateData)
    })

export const getVisitRecordsFn = createServerFn({ method: 'POST' })
    .inputValidator(getVisitRecordsSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getVisitRecordsForFarm, getVisitRecordsByAgent } =
            await import('./visit-repository')

        if (data.farmId) {
            // Check farm access
            const { checkFarmAccess } = await import('../auth/utils')
            const hasAccess = await checkFarmAccess(
                session.user.id,
                data.farmId,
            )
            if (!hasAccess) {
                throw new AppError('EXTENSION_ACCESS_DENIED')
            }

            // Log audit entry for farm view
            await db
                .insertInto('audit_logs')
                .values({
                    userId: session.user.id,
                    userName: session.user.name,
                    action: 'extension.visits.view',
                    entityType: 'farm',
                    entityId: data.farmId,
                })
                .execute()
                .catch(() => {}) // Fail silently

            return getVisitRecordsForFarm(db, data.farmId)
        }

        if (data.agentId) {
            // Only allow agents to see their own records
            if (data.agentId !== session.user.id) {
                throw new AppError('EXTENSION_ACCESS_DENIED')
            }

            // Log audit entry for agent view
            await db
                .insertInto('audit_logs')
                .values({
                    userId: session.user.id,
                    userName: session.user.name,
                    action: 'extension.visits.view',
                    entityType: 'agent',
                    entityId: data.agentId,
                })
                .execute()
                .catch(() => {}) // Fail silently

            return getVisitRecordsByAgent(db, data.agentId)
        }

        // Default to user's own records
        await db
            .insertInto('audit_logs')
            .values({
                userId: session.user.id,
                userName: session.user.name,
                action: 'extension.visits.view',
                entityType: 'agent',
                entityId: session.user.id,
            })
            .execute()
            .catch(() => {}) // Fail silently

        return getVisitRecordsByAgent(db, session.user.id)
    })

export const acknowledgeVisitFn = createServerFn({ method: 'POST' })
    .inputValidator(acknowledgeVisitSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { getVisitRecord, acknowledgeVisit } =
            await import('./visit-repository')
        const { checkFarmAccess } = await import('../auth/utils')

        // Get visit record to check farm ownership
        const visit = await getVisitRecord(db, data.id)
        if (!visit) {
            throw new AppError('VISIT_NOT_FOUND')
        }

        // Check farm access
        const hasAccess = await checkFarmAccess(session.user.id, visit.farmId)
        if (!hasAccess) {
            throw new AppError('EXTENSION_ACCESS_DENIED')
        }

        return acknowledgeVisit(db, data.id)
    })

export const getSupervisorDashboardFn = createServerFn({ method: 'POST' })
    .inputValidator(getSupervisorDashboardSchema)
    .handler(async ({ data: _data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        // Check if user is supervisor in any district
        const supervisedDistricts = await db
            .selectFrom('user_districts')
            .innerJoin('regions', 'regions.id', 'user_districts.districtId')
            .select([
                'regions.id',
                'regions.name',
            ])
            .where('user_districts.userId', '=', session.user.id)
            .where('user_districts.isSupervisor', '=', true)
            .execute()

        if (supervisedDistricts.length === 0) {
            throw new AppError('NOT_SUPERVISOR')
        }

        // Get stats for each supervised district
        const districtStats = await Promise.all(
            supervisedDistricts.map(async (district: { id: string; name: string }) => {
                // Get farm count in district
                const farmCount = await db
                    .selectFrom('farms')
                    .select(db.fn.count('id').as('count'))
                    .where('districtId', '=', district.id)
                    .executeTakeFirst()

                // Get livestock count in district
                const livestockCount = await db
                    .selectFrom('batches')
                    .innerJoin('farms', 'farms.id', 'batches.farmId')
                    .select(db.fn.sum('batches.currentQuantity').as('total'))
                    .where('farms.districtId', '=', district.id)
                    .where('batches.status', '=', 'active')
                    .executeTakeFirst()

                // Get health distribution - simplified without mortalityRate column
                const healthStats = await db
                    .selectFrom('batches')
                    .innerJoin('farms', 'farms.id', 'batches.farmId')
                    .select([
                        db.fn.count('batches.id').as('total'),
                    ])
                    .where('farms.districtId', '=', district.id)
                    .where('batches.status', '=', 'active')
                    .executeTakeFirst()

                // Get active outbreak alerts
                const outbreakCount = await db
                    .selectFrom('outbreak_alerts')
                    .select(db.fn.count('outbreak_alerts.id').as('count'))
                    .where('outbreak_alerts.districtId', '=', district.id)
                    .where('outbreak_alerts.status', '=', 'active')
                    .executeTakeFirst()

                return {
                    ...district,
                    farmCount: Number(farmCount?.count || 0),
                    livestockCount: Number(livestockCount?.total || 0),
                    healthStats: {
                        total: Number(healthStats?.total || 0),
                        healthy: Number(healthStats?.total || 0), // Simplified
                        warning: 0,
                        critical: 0,
                    },
                    outbreakCount: Number(outbreakCount?.count || 0),
                }
            }),
        )

        return {
            districts: districtStats,
            totalDistricts: supervisedDistricts.length,
        }
    })

export const updateOutbreakAlertFn = createServerFn({ method: 'POST' })
    .inputValidator(updateOutbreakAlertSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { checkDistrictMembership } = await import('./service')
        const { updateAlertStatus } = await import('./outbreak-repository')

        // Get alert to verify district access
        const alert = await db
            .selectFrom('outbreak_alerts')
            .select(['districtId'])
            .where('id', '=', data.alertId)
            .executeTakeFirst()

        if (!alert) {
            throw new AppError('ALERT_NOT_FOUND')
        }

        // Verify user is assigned to district
        const isMember = await checkDistrictMembership(
            db,
            session.user.id,
            alert.districtId,
        )
        if (!isMember) {
            throw new AppError('NOT_DISTRICT_MEMBER')
        }

        // Update alert status if provided
        if (data.status) {
            await updateAlertStatus(
                db,
                data.alertId,
                data.status,
                session.user.id,
                data.notes,
            )
        }

        // Log to audit_logs
        await db
            .insertInto('audit_logs')
            .values({
                userId: session.user.id,
                userName: session.user.name,
                action: 'update_outbreak_alert',
                entityType: 'outbreak_alert',
                entityId: data.alertId,
                details: JSON.stringify({ status: data.status, notes: data.notes }),
            })
            .execute()
            .catch(() => {}) // Fail silently

        return { success: true }
    })

// Export functions
const exportDistrictDataSchema = z.object({
    districtId: z.string().uuid(),
})

const exportOutbreakHistorySchema = z.object({
    districtId: z.string().uuid(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
})

export const exportDistrictDataFn = createServerFn({ method: 'POST' })
    .inputValidator(exportDistrictDataSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { checkDistrictMembership } = await import('./service')

        // Verify user has access to district
        const isMember = await checkDistrictMembership(
            db,
            session.user.id,
            data.districtId,
        )
        if (!isMember) {
            throw new AppError('NOT_DISTRICT_MEMBER')
        }

        // Query farms with active access grants
        const farms = await db
            .selectFrom('farms')
            .leftJoin('access_grants', 'access_grants.farmId', 'farms.id')
            .leftJoin('batches', 'batches.farmId', 'farms.id')
            .select([
                'farms.name as farmName',
                'farms.location',
                'batches.species',
                db.fn.count('batches.id').as('batchCount'),
                'access_grants.financialVisibility',
            ])
            .where('farms.districtId', '=', data.districtId)
            .where('access_grants.revokedAt', 'is', null)
            .where('access_grants.expiresAt', '>', new Date())
            .where('batches.status', '=', 'active')
            .groupBy([
                'farms.id',
                'farms.name',
                'farms.location',
                'batches.species',
                'access_grants.financialVisibility',
            ])
            .execute()

        const csvData = farms.map((farm) => ({
            farmName: farm.farmName,
            location: farm.location,
            species: farm.species || 'N/A',
            batchCount: Number(farm.batchCount || 0),
            healthStatus: 'green', // Simplified - would need mortality calculation
        }))

        // Log export to audit_logs
        await db
            .insertInto('audit_logs')
            .values({
                userId: session.user.id,
                userName: session.user.name,
                action: 'export_district_data',
                entityType: 'district',
                entityId: data.districtId,
                details: JSON.stringify({ recordCount: csvData.length }),
            })
            .execute()

        return csvData
    })

export const exportOutbreakHistoryFn = createServerFn({ method: 'POST' })
    .inputValidator(exportOutbreakHistorySchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const { checkDistrictMembership } = await import('./service')

        // Verify user has access to district
        const isMember = await checkDistrictMembership(
            db,
            session.user.id,
            data.districtId,
        )
        if (!isMember) {
            throw new AppError('NOT_DISTRICT_MEMBER')
        }

        let query = db
            .selectFrom('outbreak_alerts')
            .leftJoin(
                'outbreak_alert_farms',
                'outbreak_alert_farms.alertId',
                'outbreak_alerts.id',
            )
            .select([
                'outbreak_alerts.detectedAt',
                'outbreak_alerts.species',
                'outbreak_alerts.severity',
                'outbreak_alerts.status',
                db.fn
                    .count('outbreak_alert_farms.farmId')
                    .as('affectedFarmCount'),
            ])
            .where('outbreak_alerts.districtId', '=', data.districtId)
            .groupBy([
                'outbreak_alerts.id',
                'outbreak_alerts.detectedAt',
                'outbreak_alerts.species',
                'outbreak_alerts.severity',
                'outbreak_alerts.status',
            ])
            .orderBy('outbreak_alerts.detectedAt', 'desc')

        if (data.startDate) {
            query = query.where(
                'outbreak_alerts.detectedAt',
                '>=',
                data.startDate,
            )
        }

        if (data.endDate) {
            query = query.where(
                'outbreak_alerts.detectedAt',
                '<=',
                data.endDate,
            )
        }

        const outbreaks = await query.execute()

        const csvData = outbreaks.map((outbreak) => ({
            detectedAt: outbreak.detectedAt.toISOString().split('T')[0],
            species: outbreak.species,
            severity: outbreak.severity,
            status: outbreak.status,
            affectedFarmCount: Number(outbreak.affectedFarmCount || 0),
        }))

        // Log export to audit_logs
        await db
            .insertInto('audit_logs')
            .values({
                userId: session.user.id,
                userName: session.user.name,
                action: 'export_outbreak_history',
                entityType: 'district',
                entityId: data.districtId,
                details: JSON.stringify({
                    recordCount: csvData.length,
                    dateRange: {
                        startDate: data.startDate,
                        endDate: data.endDate,
                    },
                }),
            })
            .execute()

        return csvData
    })
