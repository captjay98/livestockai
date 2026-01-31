import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { ModulePermission } from '~/lib/db/types'
import { AppError } from '~/lib/errors'

// Worker Profile schemas
const createWorkerProfileSchema = z.object({
  userId: z.string().uuid(),
  farmId: z.string().uuid(),
  phone: z.string().min(1).max(20),
  wageRateAmount: z.number().positive(),
  wageRateType: z.enum(['hourly', 'daily', 'monthly']),
  wageCurrency: z.string().length(3).default('USD'),
  permissions: z.array(z.string()).default([]),
  structureIds: z.array(z.string().uuid()).default([]),
  emergencyContactName: z.string().max(100).nullish(),
  emergencyContactPhone: z.string().max(20).nullish(),
})

const updateWorkerProfileSchema = z.object({
  profileId: z.string().uuid(),
  phone: z.string().min(1).max(20).optional(),
  employmentStatus: z.enum(['active', 'inactive', 'terminated']).optional(),
  wageRateAmount: z.number().positive().optional(),
  wageRateType: z.enum(['hourly', 'daily', 'monthly']).optional(),
  permissions: z.array(z.string()).optional(),
})

const checkInSchema = z.object({
  farmId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
})

const checkOutSchema = z.object({
  checkInId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

const getAttendanceSchema = z.object({
  farmId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
})

// Worker Profile Functions
export const createWorkerProfileFn = createServerFn({ method: 'POST' })
  .inputValidator(createWorkerProfileSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { insertWorkerProfile } = await import('./repository')

    return insertWorkerProfile(db, {
      userId: data.userId,
      farmId: data.farmId,
      phone: data.phone,
      employmentStatus: 'active',
      employmentStartDate: new Date(),
      wageRateAmount: data.wageRateAmount.toFixed(2),
      wageRateType: data.wageRateType,
      wageCurrency: data.wageCurrency,
      permissions: data.permissions as Array<ModulePermission>,
      structureIds: data.structureIds,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
    })
  })

export const updateWorkerProfileFn = createServerFn({ method: 'POST' })
  .inputValidator(updateWorkerProfileSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { updateWorkerProfile } = await import('./repository')
    const { logAudit } = await import('~/lib/logging/audit')

    interface WorkerProfileUpdates {
      phone?: string
      employmentStatus?: 'active' | 'inactive' | 'terminated'
      wageRateAmount?: string
      wageRateType?: 'hourly' | 'daily' | 'monthly'
      permissions?: Array<ModulePermission>
    }

    const updates: WorkerProfileUpdates = {}
    if (data.phone) updates.phone = data.phone
    if (data.employmentStatus) updates.employmentStatus = data.employmentStatus
    if (data.wageRateAmount)
      updates.wageRateAmount = data.wageRateAmount.toFixed(2)
    if (data.wageRateType) updates.wageRateType = data.wageRateType
    if (data.permissions)
      updates.permissions = data.permissions as Array<ModulePermission>

    await updateWorkerProfile(db, data.profileId, updates)

    await logAudit({
      userId: session.user.id,
      userName: session.user.name,
      action: 'update',
      entityType: 'worker_profile',
      entityId: data.profileId,
      details: updates,
    })
  })

export const getWorkersByFarmFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getWorkersByFarm } = await import('./repository')
    return getWorkersByFarm(db, data.farmId)
  })

export const getWorkerProfileByUserIdFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      farmId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getWorkerProfileByUserId } = await import('./repository')
    return getWorkerProfileByUserId(db, data.userId, data.farmId)
  })

// Attendance Functions
export const checkInFn = createServerFn({ method: 'POST' })
  .inputValidator(checkInSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const {
      getWorkerProfileByUserId,
      getGeofenceByFarm,
      getOpenCheckIn,
      insertCheckIn,
    } = await import('./repository')
    const { verifyLocationInGeofence } = await import('./geofence-service')
    const { isDuplicateCheckIn } = await import('./attendance-service')
    const { logAudit } = await import('~/lib/logging/audit')
    const { createDigitalForemanNotification } = await import('./notifications')

    // Get worker profile
    const profile = await getWorkerProfileByUserId(
      db,
      session.user.id,
      data.farmId,
    )
    if (!profile) throw new AppError('WORKER_PROFILE_NOT_FOUND')

    // Check for existing open check-in
    const openCheckIn = await getOpenCheckIn(db, profile.id, data.farmId)
    if (
      openCheckIn &&
      isDuplicateCheckIn(openCheckIn.checkInTime, new Date())
    ) {
      throw new AppError('DUPLICATE_CHECK_IN')
    }

    // Verify geofence
    const geofence = await getGeofenceByFarm(db, data.farmId)
    let verificationStatus: 'verified' | 'outside_geofence' | 'manual' =
      'manual'
    if (geofence) {
      const geoData =
        geofence.geofenceType === 'circle'
          ? {
              type: 'circle' as const,
              centerLat: Number(geofence.centerLat),
              centerLng: Number(geofence.centerLng),
              radiusMeters: Number(geofence.radiusMeters),
              toleranceMeters: Number(geofence.toleranceMeters),
            }
          : {
              type: 'polygon' as const,
              vertices: geofence.vertices || [],
              toleranceMeters: Number(geofence.toleranceMeters),
            }
      const result = verifyLocationInGeofence(
        { lat: data.latitude, lng: data.longitude },
        geoData,
      )
      verificationStatus = result.verified ? 'verified' : 'outside_geofence'
    }

    const checkInId = await insertCheckIn(db, {
      workerId: profile.id,
      farmId: data.farmId,
      checkInTime: new Date(),
      checkInLat: data.latitude.toFixed(7),
      checkInLng: data.longitude.toFixed(7),
      checkInAccuracy: data.accuracy?.toFixed(2),
      verificationStatus,
      syncStatus: 'synced',
    })

    // Log audit
    await logAudit({
      userId: session.user.id,
      userName: session.user.name,
      action: 'create',
      entityType: 'worker_check_in',
      entityId: checkInId,
      details: {
        verificationStatus,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    })

    // Notify farm owner if outside geofence
    if (verificationStatus === 'outside_geofence') {
      const farmOwner = await db
        .selectFrom('user_farms')
        .select('userId')
        .where('farmId', '=', data.farmId)
        .where('role', '=', 'owner')
        .executeTakeFirst()

      if (farmOwner) {
        await createDigitalForemanNotification(db, {
          userId: farmOwner.userId,
          farmId: data.farmId,
          type: 'flaggedCheckIn',
          title: 'Flagged Check-In',
          message: `Worker ${session.user.name} checked in outside the geofence`,
          actionUrl: `/attendance?date=${new Date().toISOString().split('T')[0]}`,
        })
      }
    }

    return checkInId
  })

export const checkOutFn = createServerFn({ method: 'POST' })
  .inputValidator(checkOutSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { updateCheckOut } = await import('./repository')
    const { calculateHoursWorked } = await import('./attendance-service')
    const { logAudit } = await import('~/lib/logging/audit')

    const checkIn = await db
      .selectFrom('worker_check_ins')
      .select([
        'id',
        'workerId',
        'farmId',
        'checkInTime',
        'checkInLat',
        'checkInLng',
        'checkInAccuracy',
        'verificationStatus',
        'checkOutTime',
        'checkOutLat',
        'checkOutLng',
        'checkOutAccuracy',
        'hoursWorked',
        'syncStatus',
        'createdAt',
      ])
      .where('id', '=', data.checkInId)
      .executeTakeFirst()
    if (!checkIn) throw new AppError('CHECK_IN_NOT_FOUND')
    if (checkIn.checkOutTime)
      throw new AppError('VALIDATION_ERROR', {
        metadata: { error: 'Already checked out' },
      })

    const checkOutTime = new Date()
    const hoursWorked = calculateHoursWorked(checkIn.checkInTime, checkOutTime)

    await updateCheckOut(db, data.checkInId, {
      checkOutTime,
      checkOutLat: data.latitude.toFixed(7),
      checkOutLng: data.longitude.toFixed(7),
      hoursWorked: hoursWorked.toFixed(2),
    })

    // Log audit
    await logAudit({
      userId: session.user.id,
      userName: session.user.name,
      action: 'update',
      entityType: 'worker_check_in',
      entityId: data.checkInId,
      details: { hoursWorked, checkOutTime },
    })
  })

export const getAttendanceByFarmFn = createServerFn({ method: 'GET' })
  .inputValidator(getAttendanceSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getCheckInsByFarm, getCheckInsByFarms } =
      await import('./repository')
    const { getUserFarms } = await import('~/features/auth/utils')

    const date = data.date || new Date()

    if (data.farmId) {
      return getCheckInsByFarm(db, data.farmId, date)
    }

    // Get all farms for user
    const farmIds = await getUserFarms(session.user.id)
    if (farmIds.length === 0) return []

    return getCheckInsByFarms(db, farmIds, date)
  })

// Get open check-in for current user (used by worker dashboard)
export const getOpenCheckInForCurrentUserFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getWorkerProfileByUserId, getOpenCheckIn } =
      await import('./repository')
    const { calculateHoursWorked } = await import('./attendance-service')

    const profile = await getWorkerProfileByUserId(
      db,
      session.user.id,
      data.farmId,
    )
    if (!profile) return null

    const openCheckIn = await getOpenCheckIn(db, profile.id, data.farmId)
    if (!openCheckIn) return null

    // Calculate hours worked so far if still checked in
    const hoursWorked = openCheckIn.checkOutTime
      ? openCheckIn.hoursWorked
      : calculateHoursWorked(openCheckIn.checkInTime, new Date()).toFixed(2)

    return {
      id: openCheckIn.id,
      checkInTime: openCheckIn.checkInTime,
      checkOutTime: openCheckIn.checkOutTime,
      hoursWorked,
    }
  })

// Remove worker from farm (soft delete)
export const removeWorkerFromFarmFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ profileId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const { getWorkerProfileById, updateWorkerProfile } =
      await import('./repository')
    const { logAudit } = await import('~/lib/logging/audit')

    const profile = await getWorkerProfileById(db, data.profileId)
    if (!profile) throw new AppError('WORKER_PROFILE_NOT_FOUND')

    // Soft delete by setting employment status to terminated
    await updateWorkerProfile(db, data.profileId, {
      employmentStatus: 'terminated',
      employmentEndDate: new Date(),
    })

    // Remove from user_farms (hard delete since no soft delete column)
    await db
      .deleteFrom('user_farms')
      .where('userId', '=', profile.userId)
      .where('farmId', '=', profile.farmId)
      .execute()

    await logAudit({
      userId: session.user.id,
      userName: session.user.name,
      action: 'delete',
      entityType: 'worker_profile',
      entityId: data.profileId,
      details: { reason: 'Worker removed from farm' },
    })
  })

// Sync offline check-ins (batch process)
const offlineCheckInSchema = z.object({
  localId: z.string(),
  farmId: z.string().uuid(),
  checkInTime: z.coerce.date(),
  checkInLat: z.number().min(-90).max(90),
  checkInLng: z.number().min(-180).max(180),
  checkInAccuracy: z.number().positive().optional(),
  checkOutTime: z.coerce.date().optional(),
  checkOutLat: z.number().min(-90).max(90).optional(),
  checkOutLng: z.number().min(-180).max(180).optional(),
})

export const syncOfflineCheckInsFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ checkIns: z.array(offlineCheckInSchema) }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const {
      getWorkerProfileByUserId,
      getGeofenceByFarm,
      insertCheckIn,
      updateCheckOut,
    } = await import('./repository')
    const { verifyLocationInGeofence } = await import('./geofence-service')
    const { calculateHoursWorked } = await import('./attendance-service')
    const { createDigitalForemanNotification } = await import('./notifications')

    const results: Array<{
      localId: string
      success: boolean
      serverId?: string
      error?: string
    }> = []

    for (const checkIn of data.checkIns) {
      try {
        // Get worker profile for this farm
        const profile = await getWorkerProfileByUserId(
          db,
          session.user.id,
          checkIn.farmId,
        )
        if (!profile) {
          results.push({
            localId: checkIn.localId,
            success: false,
            error: 'Worker profile not found',
          })
          continue
        }

        // Verify geofence
        const geofence = await getGeofenceByFarm(db, checkIn.farmId)
        let verificationStatus:
          | 'verified'
          | 'outside_geofence'
          | 'manual'
          | 'pending_sync' = 'manual'
        if (geofence) {
          const geoData =
            geofence.geofenceType === 'circle'
              ? {
                  type: 'circle' as const,
                  centerLat: Number(geofence.centerLat),
                  centerLng: Number(geofence.centerLng),
                  radiusMeters: Number(geofence.radiusMeters),
                  toleranceMeters: Number(geofence.toleranceMeters),
                }
              : {
                  type: 'polygon' as const,
                  vertices: geofence.vertices || [],
                  toleranceMeters: Number(geofence.toleranceMeters),
                }
          const result = verifyLocationInGeofence(
            { lat: checkIn.checkInLat, lng: checkIn.checkInLng },
            geoData,
          )
          verificationStatus = result.verified ? 'verified' : 'outside_geofence'
        }

        // Insert check-in
        const serverId = await insertCheckIn(db, {
          workerId: profile.id,
          farmId: checkIn.farmId,
          checkInTime: checkIn.checkInTime,
          checkInLat: checkIn.checkInLat.toFixed(7),
          checkInLng: checkIn.checkInLng.toFixed(7),
          checkInAccuracy: checkIn.checkInAccuracy?.toFixed(2),
          verificationStatus,
          syncStatus: 'synced',
        })

        // If check-out data provided, update
        if (
          checkIn.checkOutTime &&
          checkIn.checkOutLat &&
          checkIn.checkOutLng
        ) {
          const hoursWorked = calculateHoursWorked(
            checkIn.checkInTime,
            checkIn.checkOutTime,
          )
          await updateCheckOut(db, serverId, {
            checkOutTime: checkIn.checkOutTime,
            checkOutLat: checkIn.checkOutLat.toFixed(7),
            checkOutLng: checkIn.checkOutLng.toFixed(7),
            hoursWorked: hoursWorked.toFixed(2),
          })
        }

        // Send notification if outside geofence
        if (verificationStatus === 'outside_geofence') {
          // Get farm owner to notify
          const farmOwner = await db
            .selectFrom('user_farms')
            .select('userId')
            .where('farmId', '=', checkIn.farmId)
            .where('role', '=', 'owner')
            .executeTakeFirst()

          if (farmOwner) {
            await createDigitalForemanNotification(db, {
              userId: farmOwner.userId,
              farmId: checkIn.farmId,
              type: 'flaggedCheckIn',
              title: 'Flagged Check-In',
              message: `Worker ${session.user.name} checked in outside the geofence`,
              actionUrl: `/attendance?date=${checkIn.checkInTime.toISOString().split('T')[0]}`,
            })
          }
        }

        results.push({
          localId: checkIn.localId,
          success: true,
          serverId,
        })
      } catch (error) {
        results.push({
          localId: checkIn.localId,
          success: false,
          error: String(error),
        })
      }
    }

    return results
  })
