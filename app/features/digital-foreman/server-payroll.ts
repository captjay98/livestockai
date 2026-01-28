import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

const createPayrollPeriodSchema = z.object({
    farmId: z.string().uuid(),
    periodType: z.enum(['weekly', 'bi-weekly', 'monthly']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
})

const getPayrollSummarySchema = z.object({
    farmId: z.string().uuid(),
    payrollPeriodId: z.string().uuid(),
})

const recordPaymentSchema = z.object({
    workerId: z.string().uuid(),
    payrollPeriodId: z.string().uuid(),
    amount: z.number().positive(),
    paymentMethod: z.enum(['cash', 'bank_transfer', 'mobile_money']),
    paymentDate: z.coerce.date(),
    notes: z.string().max(500).optional(),
})

const saveGeofenceSchema = z.object({
    farmId: z.string().uuid(),
    geofenceType: z.enum(['circle', 'polygon']),
    centerLat: z.number().min(-90).max(90).optional(),
    centerLng: z.number().min(-180).max(180).optional(),
    radiusMeters: z.number().positive().optional(),
    vertices: z
        .array(z.object({ lat: z.number(), lng: z.number() }))
        .max(20)
        .optional(),
    toleranceMeters: z.number().positive().default(100),
})

export const createPayrollPeriodFn = createServerFn({ method: 'POST' })
    .inputValidator(createPayrollPeriodSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { insertPayrollPeriod, getOverlappingPeriods } =
            await import('./repository')
        const { validatePayrollPeriod } = await import('./payroll-service')

        const existing = await getOverlappingPeriods(
            db,
            data.farmId,
            data.startDate,
            data.endDate,
        )
        const validation = validatePayrollPeriod(
            data.startDate,
            data.endDate,
            existing,
        )
        if (!validation.valid) throw new AppError('OVERLAPPING_PAYROLL_PERIOD')

        return insertPayrollPeriod(db, data)
    })

export const getPayrollSummaryFn = createServerFn({ method: 'GET' })
    .inputValidator(getPayrollSummarySchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { getWorkersByFarm, getCheckInsByWorker, getPaymentsByPeriod } =
            await import('./repository')
        const { calculateGrossWages, calculateOutstandingBalance } =
            await import('./payroll-service')

        const period = await db
            .selectFrom('payroll_periods')
            .selectAll()
            .where('id', '=', data.payrollPeriodId)
            .executeTakeFirst()
        if (!period) throw new AppError('PAYROLL_PERIOD_NOT_FOUND')

        const farm = await db
            .selectFrom('farms')
            .select(['name'])
            .where('id', '=', data.farmId)
            .executeTakeFirst()
        const workers = await getWorkersByFarm(db, data.farmId)
        const payments = await getPaymentsByPeriod(db, data.payrollPeriodId)

        const workerSummaries = await Promise.all(
            workers.map(async (w) => {
                const checkIns = await getCheckInsByWorker(
                    db,
                    w.id,
                    period.startDate,
                    period.endDate,
                )
                const totalHours = checkIns.reduce(
                    (sum, c) => sum + Number(c.hoursWorked || 0),
                    0,
                )
                const grossWages = calculateGrossWages(totalHours, {
                    rateAmount: Number(w.wageRateAmount),
                    rateType: w.wageRateType,
                    currency: 'USD',
                })
                const paid = payments
                    .filter((p) => p.workerName === w.userName)
                    .reduce((sum, p) => sum + Number(p.amount), 0)
                return {
                    ...w,
                    totalHours,
                    grossWages,
                    paid,
                    balance: calculateOutstandingBalance(grossWages, paid),
                    wageRate: Number(w.wageRateAmount),
                    wageRateType: w.wageRateType,
                }
            }),
        )

        return {
            period,
            workers: workerSummaries,
            farmName: farm?.name || 'Farm',
        }
    })

export const recordPaymentFn = createServerFn({ method: 'POST' })
    .inputValidator(recordPaymentSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { insertWagePayment, getWorkerProfileById } =
            await import('./repository')

        const worker = await getWorkerProfileById(db, data.workerId)
        if (!worker) throw new AppError('WORKER_PROFILE_NOT_FOUND')

        const paymentId = await insertWagePayment(db, {
            workerId: data.workerId,
            payrollPeriodId: data.payrollPeriodId,
            farmId: worker.farmId,
            amount: data.amount.toFixed(2),
            paymentDate: data.paymentDate,
            paymentMethod: data.paymentMethod,
            notes: data.notes,
        })

        // Create expense record for the payment (Req 13.6)
        await db
            .insertInto('expenses')
            .values({
                farmId: worker.farmId,
                category: 'labor',
                amount: data.amount.toFixed(2),
                date: data.paymentDate,
                description: `Wage payment - ${data.paymentMethod}`,
                isRecurring: false,
            })
            .execute()

        return paymentId
    })

export const getPayrollHistoryFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { getPayrollPeriodsByFarm } = await import('./repository')
        return getPayrollPeriodsByFarm(db, data.farmId)
    })

export const saveGeofenceFn = createServerFn({ method: 'POST' })
    .inputValidator(saveGeofenceSchema)
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { upsertGeofence } = await import('./repository')

        return upsertGeofence(db, {
            farmId: data.farmId,
            geofenceType: data.geofenceType,
            centerLat: data.centerLat?.toFixed(7),
            centerLng: data.centerLng?.toFixed(7),
            radiusMeters: data.radiusMeters?.toFixed(2),
            vertices: data.vertices,
            toleranceMeters: data.toleranceMeters.toFixed(2),
        })
    })

export const getGeofenceFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ farmId: z.string().uuid() }))
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { getGeofenceByFarm } = await import('./repository')
        return getGeofenceByFarm(db, data.farmId)
    })

// CSV Export Functions
export const exportAttendanceCsvFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            farmId: z.string().uuid(),
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

        const records = await db
            .selectFrom('worker_check_ins as wc')
            .leftJoin('worker_profiles as wp', 'wp.id', 'wc.workerId')
            .leftJoin('users as u', 'u.id', 'wp.userId')
            .select([
                'u.name as workerName',
                'wc.checkInTime',
                'wc.checkOutTime',
                'wc.hoursWorked',
                'wc.verificationStatus',
            ])
            .where('wc.farmId', '=', data.farmId)
            .where('wc.checkInTime', '>=', data.startDate)
            .where('wc.checkInTime', '<=', data.endDate)
            .orderBy('wc.checkInTime', 'desc')
            .execute()

        let csv = 'Worker,Check In,Check Out,Hours Worked,Status\n'
        for (const r of records) {
            csv += `"${r.workerName || 'Unknown'}",${r.checkInTime.toISOString()},${r.checkOutTime?.toISOString() || ''},${r.hoursWorked || ''},${r.verificationStatus}\n`
        }
        return {
            csv,
            filename: `attendance-${data.startDate.toISOString().split('T')[0]}-${data.endDate.toISOString().split('T')[0]}.csv`,
        }
    })

export const exportPayrollCsvFn = createServerFn({ method: 'GET' })
    .inputValidator(
        z.object({
            farmId: z.string().uuid(),
            payrollPeriodId: z.string().uuid(),
        }),
    )
    .handler(async ({ data }) => {
        const { requireAuth } =
            await import('~/features/auth/server-middleware')
        await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { getWorkersByFarm, getCheckInsByWorker, getPaymentsByPeriod } =
            await import('./repository')
        const { calculateGrossWages } = await import('./payroll-service')

        const period = await db
            .selectFrom('payroll_periods')
            .selectAll()
            .where('id', '=', data.payrollPeriodId)
            .executeTakeFirst()
        if (!period) throw new AppError('PAYROLL_PERIOD_NOT_FOUND')

        const workers = await getWorkersByFarm(db, data.farmId)
        const payments = await getPaymentsByPeriod(db, data.payrollPeriodId)

        let csv =
            'Worker,Hours Worked,Wage Rate,Rate Type,Gross Wages,Paid,Balance\n'
        for (const w of workers) {
            const checkIns = await getCheckInsByWorker(
                db,
                w.id,
                period.startDate,
                period.endDate,
            )
            const totalHours = checkIns.reduce(
                (sum, c) => sum + Number(c.hoursWorked || 0),
                0,
            )
            const grossWages = calculateGrossWages(totalHours, {
                rateAmount: Number(w.wageRateAmount),
                rateType: w.wageRateType,
                currency: 'USD',
            })
            const paid = payments
                .filter((p) => p.workerName === w.userName)
                .reduce((sum, p) => sum + Number(p.amount), 0)
            csv += `"${w.userName || 'Unknown'}",${totalHours.toFixed(1)},${w.wageRateAmount},${w.wageRateType},${grossWages.toFixed(2)},${paid.toFixed(2)},${(grossWages - paid).toFixed(2)}\n`
        }
        return {
            csv,
            filename: `payroll-${period.startDate.toISOString().split('T')[0]}-${period.endDate.toISOString().split('T')[0]}.csv`,
        }
    })
