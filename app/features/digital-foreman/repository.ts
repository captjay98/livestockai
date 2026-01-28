import type { Kysely } from 'kysely'
import type { Database, ModulePermission } from '~/lib/db/types'

// Worker Profiles
export async function insertWorkerProfile(
    db: Kysely<Database>,
    data: {
        userId: string
        farmId: string
        phone: string
        employmentStatus: 'active' | 'inactive' | 'terminated'
        employmentStartDate: Date
        wageRateAmount: string
        wageRateType: 'hourly' | 'daily' | 'monthly'
        wageCurrency: string
        permissions: Array<ModulePermission>
        structureIds: Array<string>
        emergencyContactName?: string | null
        emergencyContactPhone?: string | null
    },
): Promise<string> {
    const result = await db
        .insertInto('worker_profiles')
        .values(data)
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getWorkerProfileById(db: Kysely<Database>, id: string) {
    return db
        .selectFrom('worker_profiles')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()
}

export async function getWorkerProfileByUserId(
    db: Kysely<Database>,
    userId: string,
    farmId: string,
) {
    return db
        .selectFrom('worker_profiles')
        .selectAll()
        .where('userId', '=', userId)
        .where('farmId', '=', farmId)
        .executeTakeFirst()
}

export async function getWorkersByFarm(db: Kysely<Database>, farmId: string) {
    return db
        .selectFrom('worker_profiles as wp')
        .leftJoin('users as u', 'u.id', 'wp.userId')
        .select([
            'wp.id',
            'wp.userId',
            'wp.farmId',
            'wp.phone',
            'wp.employmentStatus',
            'wp.wageRateAmount',
            'wp.wageRateType',
            'wp.permissions',
            'u.name as userName',
            'u.email as userEmail',
        ])
        .where('wp.farmId', '=', farmId)
        .execute()
}

export async function updateWorkerProfile(
    db: Kysely<Database>,
    id: string,
    data: Partial<{
        phone: string
        employmentStatus: 'active' | 'inactive' | 'terminated'
        employmentEndDate: Date | null
        wageRateAmount: string
        wageRateType: 'hourly' | 'daily' | 'monthly'
        permissions: Array<ModulePermission>
        structureIds: Array<string>
    }>,
): Promise<void> {
    await db
        .updateTable('worker_profiles')
        .set({ ...data, updatedAt: new Date() })
        .where('id', '=', id)
        .execute()
}

// Check-ins
export async function insertCheckIn(
    db: Kysely<Database>,
    data: {
        workerId: string
        farmId: string
        checkInTime: Date
        checkInLat: string
        checkInLng: string
        checkInAccuracy?: string | null
        verificationStatus:
            | 'verified'
            | 'outside_geofence'
            | 'manual'
            | 'pending_sync'
        syncStatus: 'synced' | 'pending_sync' | 'sync_failed'
    },
): Promise<string> {
    const result = await db
        .insertInto('worker_check_ins')
        .values(data)
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getOpenCheckIn(
    db: Kysely<Database>,
    workerId: string,
    farmId: string,
) {
    return db
        .selectFrom('worker_check_ins')
        .selectAll()
        .where('workerId', '=', workerId)
        .where('farmId', '=', farmId)
        .where('checkOutTime', 'is', null)
        .executeTakeFirst()
}

export async function updateCheckOut(
    db: Kysely<Database>,
    checkInId: string,
    data: {
        checkOutTime: Date
        checkOutLat: string
        checkOutLng: string
        hoursWorked: string
    },
): Promise<void> {
    await db
        .updateTable('worker_check_ins')
        .set(data)
        .where('id', '=', checkInId)
        .execute()
}

export async function getCheckInsByWorker(
    db: Kysely<Database>,
    workerId: string,
    startDate: Date,
    endDate: Date,
) {
    return db
        .selectFrom('worker_check_ins')
        .selectAll()
        .where('workerId', '=', workerId)
        .where('checkInTime', '>=', startDate)
        .where('checkInTime', '<=', endDate)
        .orderBy('checkInTime', 'desc')
        .execute()
}

export async function getCheckInsByFarm(
    db: Kysely<Database>,
    farmId: string,
    date: Date,
) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    return db
        .selectFrom('worker_check_ins as wc')
        .leftJoin('worker_profiles as wp', 'wp.id', 'wc.workerId')
        .leftJoin('users as u', 'u.id', 'wp.userId')
        .select([
            'wc.id',
            'wc.checkInTime',
            'wc.checkOutTime',
            'wc.hoursWorked',
            'wc.verificationStatus',
            'u.name as workerName',
        ])
        .where('wc.farmId', '=', farmId)
        .where('wc.checkInTime', '>=', startOfDay)
        .where('wc.checkInTime', '<=', endOfDay)
        .execute()
}

// Geofences
export async function upsertGeofence(
    db: Kysely<Database>,
    data: {
        farmId: string
        geofenceType: 'circle' | 'polygon'
        centerLat?: string | null
        centerLng?: string | null
        radiusMeters?: string | null
        vertices?: Array<{ lat: number; lng: number }> | null
        toleranceMeters: string
    },
): Promise<string> {
    const result = await db
        .insertInto('farm_geofences')
        .values(data)
        .onConflict((oc) =>
            oc.column('farmId').doUpdateSet({
                geofenceType: data.geofenceType,
                centerLat: data.centerLat,
                centerLng: data.centerLng,
                radiusMeters: data.radiusMeters,
                vertices: data.vertices,
                toleranceMeters: data.toleranceMeters,
                updatedAt: new Date(),
            }),
        )
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getGeofenceByFarm(db: Kysely<Database>, farmId: string) {
    return db
        .selectFrom('farm_geofences')
        .selectAll()
        .where('farmId', '=', farmId)
        .executeTakeFirst()
}

// Task Assignments
export async function insertTaskAssignment(
    db: Kysely<Database>,
    data: {
        taskId: string
        workerId: string
        assignedBy: string
        farmId: string
        dueDate?: Date | null
        priority: 'low' | 'medium' | 'high' | 'urgent'
        requiresPhoto: boolean
        requiresApproval: boolean
        notes?: string | null
    },
): Promise<string> {
    const result = await db
        .insertInto('task_assignments')
        .values({ ...data, status: 'pending' })
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getTaskAssignmentById(db: Kysely<Database>, id: string) {
    return db
        .selectFrom('task_assignments')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()
}

export async function getAssignmentsByWorker(
    db: Kysely<Database>,
    workerId: string,
    status?: string,
) {
    let query = db
        .selectFrom('task_assignments')
        .selectAll()
        .where('workerId', '=', workerId)
    if (status) query = query.where('status', '=', status as any)
    return query.orderBy('dueDate', 'asc').execute()
}

export async function getAssignmentsByFarm(
    db: Kysely<Database>,
    farmId: string,
) {
    return db
        .selectFrom('task_assignments as ta')
        .leftJoin('worker_profiles as wp', 'wp.id', 'ta.workerId')
        .leftJoin('users as u', 'u.id', 'wp.userId')
        .select([
            'ta.id',
            'ta.taskId',
            'ta.workerId',
            'ta.priority',
            'ta.status',
            'ta.dueDate',
            'ta.requiresPhoto',
            'ta.requiresApproval',
            'ta.completedAt',
            'u.name as workerName',
        ])
        .where('ta.farmId', '=', farmId)
        .orderBy('ta.dueDate', 'asc')
        .execute()
}

export async function updateTaskAssignment(
    db: Kysely<Database>,
    id: string,
    data: Partial<{
        status:
            | 'pending'
            | 'in_progress'
            | 'completed'
            | 'pending_approval'
            | 'verified'
            | 'rejected'
        completedAt: Date | null
        completionNotes: string | null
        approvedBy: string | null
        approvedAt: Date | null
        rejectionReason: string | null
    }>,
): Promise<void> {
    await db
        .updateTable('task_assignments')
        .set({ ...data, updatedAt: new Date() })
        .where('id', '=', id)
        .execute()
}

export async function getPendingApprovals(
    db: Kysely<Database>,
    farmId: string,
) {
    return db
        .selectFrom('task_assignments as ta')
        .leftJoin('worker_profiles as wp', 'wp.id', 'ta.workerId')
        .leftJoin('users as u', 'u.id', 'wp.userId')
        .select([
            'ta.id',
            'ta.taskId',
            'ta.completedAt',
            'ta.completionNotes',
            'u.name as workerName',
        ])
        .where('ta.farmId', '=', farmId)
        .where('ta.status', '=', 'pending_approval')
        .orderBy('ta.completedAt', 'desc')
        .execute()
}

// Task Photos
export async function insertTaskPhoto(
    db: Kysely<Database>,
    data: {
        assignmentId: string
        photoUrl: string
        capturedLat?: string | null
        capturedLng?: string | null
        capturedAt: Date
    },
): Promise<string> {
    const result = await db
        .insertInto('task_photos')
        .values(data)
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getPhotosByAssignment(
    db: Kysely<Database>,
    assignmentId: string,
) {
    return db
        .selectFrom('task_photos')
        .selectAll()
        .where('assignmentId', '=', assignmentId)
        .orderBy('capturedAt', 'desc')
        .execute()
}

// Payroll Periods
export async function insertPayrollPeriod(
    db: Kysely<Database>,
    data: {
        farmId: string
        periodType: 'weekly' | 'bi-weekly' | 'monthly'
        startDate: Date
        endDate: Date
    },
): Promise<string> {
    const result = await db
        .insertInto('payroll_periods')
        .values({ ...data, status: 'open' })
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getPayrollPeriodsByFarm(
    db: Kysely<Database>,
    farmId: string,
) {
    return db
        .selectFrom('payroll_periods')
        .selectAll()
        .where('farmId', '=', farmId)
        .orderBy('startDate', 'desc')
        .execute()
}

export async function getOverlappingPeriods(
    db: Kysely<Database>,
    farmId: string,
    startDate: Date,
    endDate: Date,
) {
    return db
        .selectFrom('payroll_periods')
        .selectAll()
        .where('farmId', '=', farmId)
        .where((eb) =>
            eb.or([
                eb.and([
                    eb('startDate', '<=', startDate),
                    eb('endDate', '>=', startDate),
                ]),
                eb.and([
                    eb('startDate', '<=', endDate),
                    eb('endDate', '>=', endDate),
                ]),
                eb.and([
                    eb('startDate', '>=', startDate),
                    eb('endDate', '<=', endDate),
                ]),
            ]),
        )
        .execute()
}

// Wage Payments
export async function insertWagePayment(
    db: Kysely<Database>,
    data: {
        workerId: string
        payrollPeriodId: string
        farmId: string
        amount: string
        paymentDate: Date
        paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money'
        notes?: string | null
    },
): Promise<string> {
    const result = await db
        .insertInto('wage_payments')
        .values(data)
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

export async function getPaymentsByPeriod(
    db: Kysely<Database>,
    payrollPeriodId: string,
) {
    return db
        .selectFrom('wage_payments as wp')
        .leftJoin('worker_profiles as wpr', 'wpr.id', 'wp.workerId')
        .leftJoin('users as u', 'u.id', 'wpr.userId')
        .select([
            'wp.id',
            'wp.amount',
            'wp.paymentDate',
            'wp.paymentMethod',
            'u.name as workerName',
        ])
        .where('wp.payrollPeriodId', '=', payrollPeriodId)
        .execute()
}

export async function getTotalPaymentsByWorkerAndPeriod(
    db: Kysely<Database>,
    workerId: string,
    payrollPeriodId: string,
) {
    const { sql } = await import('kysely')
    return db
        .selectFrom('wage_payments')
        .select([
            sql<string>`COALESCE(SUM(amount::decimal), 0)`.as('totalAmount'),
        ])
        .where('workerId', '=', workerId)
        .where('payrollPeriodId', '=', payrollPeriodId)
        .executeTakeFirst()
}
