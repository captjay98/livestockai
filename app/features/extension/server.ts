import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

const updateOutbreakAlertSchema = z.object({
  alertId: z.string().uuid(),
  status: z
    .enum(['active', 'monitoring', 'resolved', 'false_positive'])
    .optional(),
  notes: z.string().max(1000).optional(),
})

const getDistrictDashboardSchema = z.object({
  districtId: z.string().uuid(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  livestockType: z.string().optional(),
  healthStatus: z.enum(['green', 'amber', 'red']).optional(),
  search: z.string().max(100).optional(),
})

const getAccessRequestsSchema = z.object({
  farmId: z.string().uuid(),
})

const respondToAccessRequestSchema = z.object({
  requestId: z.string().uuid(),
  approved: z.boolean(),
  financialVisibility: z.boolean().optional(),
  durationDays: z.number().int().positive().max(365).optional(),
  reason: z.string().max(500).optional(),
})

const revokeAccessSchema = z.object({
  grantId: z.string().uuid(),
  reason: z.string().max(500).optional(),
})

/**
 * Get district dashboard with farms and health status
 * Requirements: 5.1, 7.6-7.9
 */
export const getDistrictDashboardFn = createServerFn({ method: 'GET' })
  .inputValidator(getDistrictDashboardSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Import repository and service functions
    const { getUserDistricts } = await import('./user-districts-repository')
    const { getDistrictDashboard } = await import('./repository')
    const { getActiveAlerts } = await import('./outbreak-repository')
    const { calculateHealthStatus, calculateMortalityRate } =
      await import('./health-service')

    // Validate user has district access
    const userDistricts = await getUserDistricts(db, session.user.id)
    const hasAccess = userDistricts.some(
      (d) => d.districtId === data.districtId,
    )

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        message: 'You do not have access to this district',
      })
    }

    // Get district info
    const district = await db
      .selectFrom('regions')
      .select(['id', 'name'])
      .where('id', '=', data.districtId)
      .executeTakeFirst()

    if (!district) {
      throw new AppError('NOT_FOUND', {
        message: 'District not found',
      })
    }

    // Get farms with health data
    const dashboardData = await getDistrictDashboard(db, {
      districtId: data.districtId,
      page: data.page || 1,
      pageSize: data.pageSize || 20,
      livestockType: data.livestockType,
      healthStatus: data.healthStatus,
    })

    // Calculate health status for each farm by checking their batches
    const farmsWithHealth = await Promise.all(
      dashboardData.farms.map(async (farm) => {
        // Get batches for this farm to calculate mortality
        const batches = await db
          .selectFrom('batches')
          .select(['initialQuantity', 'currentQuantity', 'species'])
          .where('farmId', '=', farm.farmId)
          .where('status', '=', 'active')
          .execute()

        let overallHealthStatus: 'green' | 'amber' | 'red' = 'green'
        let totalMortalityRate = 0

        if (batches.length > 0) {
          // Calculate average mortality rate across all active batches
          const mortalityRates = batches.map((batch) =>
            calculateMortalityRate(
              batch.initialQuantity,
              batch.currentQuantity,
            ),
          )
          totalMortalityRate =
            mortalityRates.reduce((sum, rate) => sum + rate, 0) /
            mortalityRates.length

          // Use the most common species for health status
          const species = batches[0].species as any
          overallHealthStatus = calculateHealthStatus(
            totalMortalityRate,
            species,
          )
        }

        // Get owner name
        const owner = await db
          .selectFrom('user_farms')
          .innerJoin('users', 'users.id', 'user_farms.userId')
          .select('users.name')
          .where('user_farms.farmId', '=', farm.farmId)
          .where('user_farms.role', '=', 'owner')
          .executeTakeFirst()

        // Get last visit
        const lastVisit = await db
          .selectFrom('visit_records')
          .select('visitDate')
          .where('farmId', '=', farm.farmId)
          .orderBy('visitDate', 'desc')
          .executeTakeFirst()

        return {
          id: farm.farmId,
          name: farm.farmName,
          ownerName: owner?.name || 'Unknown',
          location: farm.location || '',
          batchCount: farm.batchCount,
          healthStatus: overallHealthStatus,
          mortalityRate: Number(totalMortalityRate.toFixed(2)),
          lastVisit: lastVisit?.visitDate.toISOString() || null,
        }
      }),
    )

    // Apply health status filter if provided
    const filteredFarms = data.healthStatus
      ? farmsWithHealth.filter((f) => f.healthStatus === data.healthStatus)
      : farmsWithHealth

    // Apply search filter if provided
    const searchedFarms = data.search
      ? filteredFarms.filter(
          (f) =>
            f.name.toLowerCase().includes(data.search!.toLowerCase()) ||
            f.ownerName.toLowerCase().includes(data.search!.toLowerCase()),
        )
      : filteredFarms

    // Calculate stats
    const stats = {
      totalFarms: searchedFarms.length,
      healthyFarms: searchedFarms.filter((f) => f.healthStatus === 'green')
        .length,
      warningFarms: searchedFarms.filter((f) => f.healthStatus === 'amber')
        .length,
      criticalFarms: searchedFarms.filter((f) => f.healthStatus === 'red')
        .length,
      activeAlerts: 0,
    }

    // Get active outbreak alerts count
    const activeAlerts = await getActiveAlerts(db, data.districtId)
    stats.activeAlerts = activeAlerts.length

    return {
      district: { id: district.id, name: district.name },
      stats,
      farms: searchedFarms,
      pagination: {
        currentPage: data.page || 1,
        totalPages: Math.ceil(searchedFarms.length / (data.pageSize || 20)),
        totalItems: searchedFarms.length,
      },
    }
  })

/**
 * Get supervisor dashboard with all supervised districts
 * Requirements: 5.2, 12.6-12.7
 */
export const getSupervisorDashboardFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { requireAuth } = await import('../auth/server-middleware')
  const session = await requireAuth()

  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  const { getUserDistricts } = await import('./user-districts-repository')
  const { getActiveAlerts } = await import('./outbreak-repository')

  // Get user's supervised districts
  const userDistricts = await getUserDistricts(db, session.user.id)
  const supervisedDistricts = userDistricts.filter((d) => d.isSupervisor)

  if (supervisedDistricts.length === 0) {
    throw new AppError('ACCESS_DENIED', {
      message: 'You are not a supervisor for any districts',
    })
  }

  // Aggregate stats for each district
  const districts = await Promise.all(
    supervisedDistricts.map(async (district) => {
      // Get farms count in district
      const farmsCount = await db
        .selectFrom('farms')
        .select(db.fn.countAll().as('count'))
        .where('districtId', '=', district.districtId)
        .executeTakeFirst()

      // Get extension workers count
      const workersCount = await db
        .selectFrom('user_districts')
        .select(db.fn.countAll().as('count'))
        .where('districtId', '=', district.districtId)
        .executeTakeFirst()

      // Get active alerts
      const alerts = await getActiveAlerts(db, district.districtId)

      // Calculate health distribution (simplified - would need batch data)
      const totalFarms = Number(farmsCount?.count || 0)

      return {
        id: district.districtId,
        name: district.districtName || 'Unknown District',
        totalFarms,
        healthyFarms: Math.floor(totalFarms * 0.7), // Placeholder
        warningFarms: Math.floor(totalFarms * 0.2), // Placeholder
        criticalFarms: Math.floor(totalFarms * 0.1), // Placeholder
        activeAlerts: alerts.length,
        extensionWorkers: Number(workersCount?.count || 0),
      }
    }),
  )

  const totalFarms = districts.reduce((sum, d) => sum + d.totalFarms, 0)
  const totalAlerts = districts.reduce((sum, d) => sum + d.activeAlerts, 0)

  return {
    districts,
    totalDistricts: districts.length,
    totalFarms,
    totalAlerts,
  }
})

/**
 * Get user's district assignments
 * Requirements: 5.3
 */
export const getUserDistrictsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const { getUserDistricts } = await import('./user-districts-repository')

    const districts = await getUserDistricts(db, session.user.id)

    return districts.map((d) => ({
      districtId: d.districtId,
      districtName: d.districtName || 'Unknown',
      isSupervisor: d.isSupervisor,
      assignedAt: d.assignedAt.toISOString(),
    }))
  },
)

/**
 * Get access requests and active grants for a farm
 * Requirements: 5.4, 6.1-6.3
 */
export const getAccessRequestsFn = createServerFn({ method: 'GET' })
  .inputValidator(getAccessRequestsSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const { checkFarmAccess } = await import('../auth/utils')

    // Verify farm ownership
    const hasAccess = await checkFarmAccess(session.user.id, data.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        message: 'You do not have access to this farm',
      })
    }

    const { getAccessRequestsForFarm } = await import('./access-repository')

    // Get pending requests
    const allRequests = await getAccessRequestsForFarm(db, data.farmId)
    const pendingRequests = allRequests
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        id: r.id,
        requesterName: r.requesterName || 'Unknown',
        requesterEmail: r.requesterEmail || '',
        purpose: r.purpose,
        requestedDurationDays: r.requestedDurationDays,
        createdAt: r.createdAt.toISOString(),
      }))

    // Get active grants
    const activeGrants = await db
      .selectFrom('access_grants')
      .innerJoin('users', 'users.id', 'access_grants.userId')
      .select([
        'access_grants.id',
        'users.name as agentName',
        'users.email as agentEmail',
        'access_grants.grantedAt',
        'access_grants.expiresAt',
        'access_grants.financialVisibility',
      ])
      .where('access_grants.farmId', '=', data.farmId)
      .where('access_grants.revokedAt', 'is', null)
      .where('access_grants.expiresAt', '>', new Date())
      .execute()

    return {
      pendingRequests,
      activeGrants: activeGrants.map((g) => ({
        id: g.id,
        agentName: g.agentName || 'Unknown',
        agentEmail: g.agentEmail || '',
        grantedAt: g.grantedAt.toISOString(),
        expiresAt: g.expiresAt.toISOString(),
        financialVisibility: g.financialVisibility,
      })),
    }
  })

/**
 * Respond to access request (approve or deny)
 * Requirements: 5.5, 6.4
 */
export const respondToAccessRequestFn = createServerFn({ method: 'POST' })
  .inputValidator(respondToAccessRequestSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const { checkFarmOwnership } = await import('./service')
    const { respondToAccessRequest, createAccessGrant, getAccessRequest } =
      await import('./access-repository')
    const { EXTENSION_DEFAULTS } = await import('./constants')

    // Verify farm ownership
    const isOwner = await checkFarmOwnership(
      db,
      session.user.id,
      data.requestId,
    )
    if (!isOwner) {
      throw new AppError('ACCESS_DENIED', {
        message: 'You do not have permission to respond to this request',
      })
    }

    // Get request details
    const request = await getAccessRequest(db, data.requestId)
    if (!request) {
      throw new AppError('NOT_FOUND', {
        message: 'Access request not found',
      })
    }

    if (request.status !== 'pending') {
      throw new AppError('VALIDATION_ERROR', {
        message: 'This request has already been responded to',
      })
    }

    // Respond to request
    await respondToAccessRequest(
      db,
      data.requestId,
      session.user.id,
      data.approved,
      data.reason,
    )

    // If approved, create access grant
    if (data.approved) {
      const durationDays =
        data.durationDays || EXTENSION_DEFAULTS.ACCESS_GRANT_DEFAULT_DAYS
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + durationDays)

      await createAccessGrant(
        db,
        request.requesterId,
        request.farmId,
        session.user.id,
        expiresAt,
        data.financialVisibility || false,
        data.requestId,
      )

      // Create notification for requester
      await db
        .insertInto('notifications')
        .values({
          userId: request.requesterId,
          farmId: request.farmId,
          type: 'access_granted',
          title: 'Access Request Approved',
          message: `Your access request for ${request.farmName} has been approved`,
          actionUrl: `/extension/farm/${request.farmId}`,
        })
        .execute()
    } else {
      // Create notification for denial
      await db
        .insertInto('notifications')
        .values({
          userId: request.requesterId,
          farmId: request.farmId,
          type: 'access_denied',
          title: 'Access Request Denied',
          message: `Your access request for ${request.farmName} has been denied${data.reason ? `: ${data.reason}` : ''}`,
          actionUrl: null,
        })
        .execute()
    }

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: data.approved
          ? 'access_request_approved'
          : 'access_request_denied',
        entityType: 'access_request',
        entityId: data.requestId,
        details: JSON.stringify({
          farmId: request.farmId,
          requesterId: request.requesterId,
          financialVisibility: data.financialVisibility,
          reason: data.reason,
        }),
      })
      .execute()

    return { success: true }
  })

/**
 * Revoke active access grant
 * Requirements: 5.6, 6.5
 */
export const revokeAccessFn = createServerFn({ method: 'POST' })
  .inputValidator(revokeAccessSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const { checkGrantOwnership } = await import('./service')
    const { revokeAccessGrant } = await import('./access-repository')

    // Verify farm ownership
    const isOwner = await checkGrantOwnership(db, session.user.id, data.grantId)
    if (!isOwner) {
      throw new AppError('ACCESS_DENIED', {
        message: 'You do not have permission to revoke this grant',
      })
    }

    // Get grant details before revoking
    const grant = await db
      .selectFrom('access_grants')
      .innerJoin('farms', 'farms.id', 'access_grants.farmId')
      .select([
        'access_grants.userId',
        'access_grants.farmId',
        'farms.name as farmName',
      ])
      .where('access_grants.id', '=', data.grantId)
      .executeTakeFirst()

    if (!grant) {
      throw new AppError('NOT_FOUND', {
        message: 'Access grant not found',
      })
    }

    // Revoke grant
    await revokeAccessGrant(
      db,
      data.grantId,
      session.user.id,
      data.reason || 'Revoked by farm owner',
    )

    // Create notifications for both parties
    await db
      .insertInto('notifications')
      .values({
        userId: grant.userId,
        farmId: grant.farmId,
        type: 'access_revoked',
        title: 'Farm Access Revoked',
        message: `Your access to ${grant.farmName} has been revoked${data.reason ? `: ${data.reason}` : ''}`,
        actionUrl: null,
      })
      .execute()

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: 'access_grant_revoked',
        entityType: 'access_grant',
        entityId: data.grantId,
        details: JSON.stringify({
          farmId: grant.farmId,
          agentId: grant.userId,
          reason: data.reason,
        }),
      })
      .execute()

    return { success: true }
  })

/**
 * Get active outbreak alerts for user's districts
 * Requirements: 11.6
 */
export const getOutbreakAlertsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const { getUserDistricts } = await import('./user-districts-repository')
    const { getActiveAlerts } = await import('./outbreak-repository')

    // Get user's districts
    const districts = await getUserDistricts(db, session.user.id)

    if (districts.length === 0) {
      throw new AppError('ACCESS_DENIED', {
        message: 'You are not assigned to any districts',
      })
    }

    // Get alerts for all districts
    const allAlerts = []
    for (const district of districts) {
      const alerts = await getActiveAlerts(db, district.districtId)
      allAlerts.push(...alerts)
    }

    // Sort by created date (newest first)
    allAlerts.sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    )

    return allAlerts
  },
)

/**
 * Get single outbreak alert by ID
 * Requirements: 11.9
 */
export const getOutbreakAlertFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ alertId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const { getUserDistricts } = await import('./user-districts-repository')
    const { getOutbreakAlert } = await import('./outbreak-repository')

    // Get alert
    const alert = await getOutbreakAlert(db, data.alertId)

    if (!alert) {
      throw new AppError('NOT_FOUND', {
        message: 'Alert not found',
      })
    }

    // Verify user has access to this district
    const districts = await getUserDistricts(db, session.user.id)
    const hasAccess = districts.some((d) => d.districtId === alert.districtId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        message: 'You do not have access to this district',
      })
    }

    return alert
  })

/**
 * Update outbreak alert status
 * Requirements: 5.7, 11.9-11.10
 */
export const updateOutbreakAlertFn = createServerFn({ method: 'POST' })
  .inputValidator(updateOutbreakAlertSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const { checkDistrictMembership } = await import('./service')
    const { updateAlertStatus, getOutbreakAlert } =
      await import('./outbreak-repository')

    // Get alert to verify district access
    const alert = await getOutbreakAlert(db, data.alertId)
    if (!alert) {
      throw new AppError('NOT_FOUND', {
        message: 'Outbreak alert not found',
      })
    }

    // Verify user has district access
    const hasAccess = await checkDistrictMembership(
      db,
      session.user.id,
      alert.districtId,
    )
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', {
        message: 'You do not have access to this district',
      })
    }

    // Update alert status
    if (data.status) {
      await updateAlertStatus(
        db,
        data.alertId,
        data.status,
        session.user.id,
        data.notes,
      )

      // Create notification if resolved
      if (data.status === 'resolved') {
        // Notify all extension workers in the district
        const districtUsers = await db
          .selectFrom('user_districts')
          .select('userId')
          .where('districtId', '=', alert.districtId)
          .execute()

        for (const user of districtUsers) {
          await db
            .insertInto('notifications')
            .values({
              userId: user.userId,
              farmId: null,
              type: 'outbreak_resolved',
              title: 'Outbreak Alert Resolved',
              message: `The ${alert.species} outbreak in your district has been resolved`,
              actionUrl: `/extension/alerts/${data.alertId}`,
            })
            .execute()
        }
      }
    }

    // Audit log
    await db
      .insertInto('audit_logs')
      .values({
        userId: session.user.id,
        action: 'outbreak_alert_updated',
        entityType: 'outbreak_alert',
        entityId: data.alertId,
        details: JSON.stringify({
          status: data.status,
          notes: data.notes,
        }),
      })
      .execute()

    return { success: true }
  })
