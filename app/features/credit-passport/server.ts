import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { renderToBuffer } from '@react-pdf/renderer'
import { CreditPassportPDF } from './pdf-generator'
import { AppError } from '~/lib/errors'

const generateReportSchema = z.object({
    farmIds: z.array(z.string().uuid()).min(1),
    batchIds: z.array(z.string().uuid()).optional().default([]),
    reportType: z.enum([
        'credit_assessment',
        'production_certificate',
        'impact_report',
    ]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    validityDays: z
        .union([z.literal(30), z.literal(60), z.literal(90)])
        .optional()
        .default(30),
    customNotes: z.string().max(1000).optional(),
    whiteLabel: z.boolean().optional().default(false),
})

const deleteReportSchema = z.object({
    reportId: z.string().uuid(),
})

const downloadReportSchema = z.object({
    reportId: z.string().uuid(),
})

const getReportsHistorySchema = z.object({
    farmIds: z.array(z.string().uuid()).optional(),
    page: z.number().int().positive().optional().default(1),
    pageSize: z.number().int().positive().max(100).optional().default(10),
})

const approveRequestSchema = z.object({
    requestId: z.string().uuid(),
})

const denyRequestSchema = z.object({
    requestId: z.string().uuid(),
    reason: z.string().min(1).max(500),
})

const getReportRequestsSchema = z.object({
    page: z.number().int().positive().optional().default(1),
    pageSize: z.number().int().positive().max(100).optional().default(10),
})

const verifyReportSchema = z.object({
    reportId: z.string().uuid(),
})

// Rate limiting store (in production, use Redis or KV)
const rateLimits = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string, farmId: string): boolean {
    const now = Date.now()
    const hourKey = `${userId}:${Math.floor(now / 3600000)}`
    const dayKey = `${farmId}:${Math.floor(now / 86400000)}`

    // Check user limit (10/hour)
    const userLimit = rateLimits.get(hourKey) || {
        count: 0,
        resetTime: now + 3600000,
    }
    if (userLimit.count >= 10) return false
    userLimit.count++
    rateLimits.set(hourKey, userLimit)

    // Check farm limit (100/day)
    const farmLimit = rateLimits.get(dayKey) || {
        count: 0,
        resetTime: now + 86400000,
    }
    if (farmLimit.count >= 100) return false
    farmLimit.count++
    rateLimits.set(dayKey, farmLimit)

    return true
}

export const generateReportFn = createServerFn({ method: 'POST' })
    .inputValidator(generateReportSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()

        // Check farm access for all farms (batch operation)
        const { checkMultipleFarmAccess } = await import('../auth/utils')
        const accessMap = await checkMultipleFarmAccess(
            session.user.id,
            data.farmIds,
        )
        const deniedFarms = data.farmIds.filter((id) => !accessMap[id])
        if (deniedFarms.length > 0) {
            throw new AppError('ACCESS_DENIED', {
                metadata: { farmIds: deniedFarms },
            })
        }

        // Rate limiting (check first farm)
        if (!checkRateLimit(session.user.id, data.farmIds[0])) {
            throw new AppError('RATE_LIMIT_EXCEEDED')
        }

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const reportId = crypto.randomUUID()

        try {
            // Fetch data from repository
            const {
                getFinancialData,
                getOperationalData,
                getAssetData,
                getTrackRecordData,
            } = await import('./repository')

            const [financialData, operationalData, assetData, trackRecordData] =
                await Promise.all([
                    getFinancialData(
                        db,
                        data.farmIds,
                        data.startDate,
                        data.endDate,
                    ),
                    getOperationalData(db, data.farmIds),
                    getAssetData(db, data.farmIds),
                    getTrackRecordData(db, data.farmIds),
                ])

            // Calculate metrics
            const {
                calculateFinancialMetrics,
                calculateOperationalMetrics,
                calculateAssetSummary,
                calculateTrackRecord,
                calculateCreditScore,
            } = await import('./metrics-service')

            const financial = calculateFinancialMetrics({
                sales: financialData.sales as any,
                expenses: financialData.expenses,
                startDate: data.startDate,
                endDate: data.endDate,
            })

            const operational = calculateOperationalMetrics({
                batches: operationalData.batches as any,
                feedRecords: operationalData.feedRecords as any,
                weightSamples: operationalData.weightSamples as any,
            })

            const assets = calculateAssetSummary({
                batches: assetData.batches as any,
                structures: assetData.structures as any,
                marketPrices: assetData.marketPrices as any,
            })

            // Calculate track record from actual data
            const trackRecord = calculateTrackRecord({
                batches: trackRecordData.batches.map((b) => ({
                    acquisitionDate: b.acquisitionDate,
                    status: b.status as 'active' | 'depleted' | 'sold',
                    initialQuantity: b.initialQuantity,
                    target_weight_g: b.targetWeightG,
                })),
                sales: trackRecordData.sales.map((s) => ({
                    ...s,
                    customerId: s.customerId || '',
                })),
                reportDate: new Date(),
            })

            const creditScore = calculateCreditScore({
                financial,
                operational,
                assets,
                trackRecord,
            })

            const metrics = {
                financial,
                operational,
                assets,
                trackRecord,
                creditScore,
            }

            // Generate crypto signature
            const { hashContent, signReport, calculateExpirationDate } =
                await import('./signature-service')
            const contentHash = await hashContent(JSON.stringify(metrics))
            const privateKey = crypto.getRandomValues(new Uint8Array(32))
            const signature = await signReport(contentHash, privateKey)
            const { getPublicKey } = await import('@noble/ed25519')
            const publicKeyResult = getPublicKey(privateKey)
            const publicKeyBytes: Uint8Array =
                publicKeyResult instanceof Promise
                    ? await publicKeyResult
                    : publicKeyResult
            const publicKey = Array.from(publicKeyBytes)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')

            // Calculate expiration
            const expiresAt = calculateExpirationDate(
                new Date(),
                data.validityDays,
            )

            // Generate QR code
            const { generateVerificationQR } = await import('./qr-service')
            const baseUrl =
                process.env.BETTER_AUTH_URL || 'http://localhost:3001'
            const qrCodeDataUrl = await generateVerificationQR(
                reportId,
                baseUrl,
            )

            // Generate PDF
            const pdfElement = CreditPassportPDF({
                reportType: data.reportType,
                metrics: metrics as any,
                qrCodeDataUrl,
                branding: data.whiteLabel ? 'white-label' : 'openlivestock',
                language: 'en', // TODO: Get from user settings
            })
            const pdfBuffer = await renderToBuffer(pdfElement as any)

            // Upload to R2 private storage
            const { uploadFile } =
                await import('~/features/integrations/storage')
            const uploadResult = await uploadFile(
                `credit-reports/${reportId}.pdf`,
                pdfBuffer,
                'application/pdf',
                { access: 'private' },
            )

            if (!uploadResult.success) {
                throw new AppError('EXTERNAL_SERVICE_ERROR', {
                    message: `PDF upload failed: ${uploadResult.error}`,
                })
            }

            const pdfUrl = uploadResult.url

            // Save report
            await db
                .insertInto('credit_reports')
                .values({
                    id: reportId,
                    userId: session.user.id,
                    farmIds: data.farmIds as any,
                    batchIds: data.batchIds as any,
                    reportType: data.reportType,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    validityDays: data.validityDays as any,
                    expiresAt,
                    reportHash: contentHash,
                    signature,
                    publicKey,
                    pdfUrl,
                    metricsSnapshot: metrics as any,
                    status: 'active',
                    customNotes: data.customNotes || null,
                    whiteLabel: data.whiteLabel || false,
                })
                .execute()

            return { reportId, status: 'active', expiresAt }
        } catch (error) {
            throw new AppError('REPORT_GENERATION_FAILED', {
                message: 'Failed to generate credit report',
                cause: error,
            })
        }
    })

export const deleteReportFn = createServerFn({ method: 'POST' })
    .inputValidator(deleteReportSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const report = await db
            .selectFrom('credit_reports')
            .select(['userId', 'farmIds'])
            .where('id', '=', data.reportId)
            .executeTakeFirst()

        if (!report) {
            throw new AppError('NOT_FOUND')
        }

        if (report.userId !== session.user.id) {
            throw new AppError('ACCESS_DENIED')
        }

        // Soft delete - set deletedAt timestamp
        await db
            .updateTable('credit_reports')
            .set({ deletedAt: new Date() })
            .where('id', '=', data.reportId)
            .execute()

        return { success: true }
    })

export const downloadReportFn = createServerFn({ method: 'POST' })
    .inputValidator(downloadReportSchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const report = await db
            .selectFrom('credit_reports')
            .select(['userId', 'pdfUrl', 'status'])
            .where('id', '=', data.reportId)
            .executeTakeFirst()

        if (!report) {
            throw new AppError('NOT_FOUND')
        }

        if (report.userId !== session.user.id) {
            throw new AppError('ACCESS_DENIED')
        }

        if (report.status !== 'active') {
            throw new AppError('VALIDATION_ERROR', {
                message: 'Report not available',
            })
        }

        // Download from R2
        const { downloadFile } = await import('~/features/integrations/storage')
        const key =
            report.pdfUrl?.replace(/^https?:\/\/[^/]+\//, '') ||
            `credit-reports/${data.reportId}.pdf`

        const downloadResult = await downloadFile(key)

        if (!downloadResult.success || !downloadResult.content) {
            throw new AppError('NOT_FOUND', { message: 'PDF file not found' })
        }

        // Convert ArrayBuffer to base64 string for serialization
        const uint8Array = new Uint8Array(downloadResult.content)
        const base64 = btoa(String.fromCharCode(...uint8Array))

        return {
            content: base64,
            contentType: downloadResult.contentType || 'application/pdf',
        }
    })

export const getReportsHistoryFn = createServerFn({ method: 'GET' })
    .inputValidator(getReportsHistorySchema)
    .handler(async ({ data }) => {
        const { requireAuth } = await import('../auth/server-middleware')
        const session = await requireAuth()
        const { checkMultipleFarmAccess, getUserFarms } =
            await import('../auth/utils')

        // Determine which farms to query
        let targetFarmIds: Array<string>
        if (data.farmIds && data.farmIds.length > 0) {
            // Check access for specified farms (batch operation)
            const accessMap = await checkMultipleFarmAccess(
                session.user.id,
                data.farmIds,
            )
            const deniedFarms = data.farmIds.filter((id) => !accessMap[id])
            if (deniedFarms.length > 0) {
                throw new AppError('ACCESS_DENIED', {
                    metadata: { farmIds: deniedFarms },
                })
            }
            targetFarmIds = data.farmIds
        } else {
            // Get all user's farms
            targetFarmIds = await getUserFarms(session.user.id)
        }

        const { getDb } = await import('~/lib/db')
        const db = await getDb()
        const { sql } = await import('kysely')

        const offset = (data.page - 1) * data.pageSize

        // Query reports where farmIds array overlaps with targetFarmIds
        // Use array_to_json for proper PostgreSQL array overlap check
        const farmIdsArray = `{${targetFarmIds.map((id) => `"${id}"`).join(',')}}`

        const reports = await db
            .selectFrom('credit_reports')
            .select([
                'id',
                'reportType',
                'status',
                'startDate',
                'endDate',
                'createdAt',
                'farmIds',
            ])
            .where('userId', '=', session.user.id)
            .where(
                sql<boolean>`"farmIds"::jsonb ?| ${sql.lit(farmIdsArray)}::text[]`,
            )
            .orderBy('createdAt', 'desc')
            .limit(data.pageSize)
            .offset(offset)
            .execute()

        const total = await db
            .selectFrom('credit_reports')
            .select((eb) => eb.fn.count('id').as('count'))
            .where('userId', '=', session.user.id)
            .where(
                sql<boolean>`"farmIds"::jsonb ?| ${sql.lit(farmIdsArray)}::text[]`,
            )
            .executeTakeFirstOrThrow()

        return {
            reports,
            pagination: {
                page: data.page,
                pageSize: data.pageSize,
                total: Number(total.count),
                totalPages: Math.ceil(Number(total.count) / data.pageSize),
            },
        }
    })

export const approveRequestFn = createServerFn({ method: 'POST' })
    .inputValidator(approveRequestSchema)
    .handler(async ({ data }) => {
        const { requireAdmin } = await import('../auth/server-middleware')
        await requireAdmin()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        await db
            .updateTable('report_requests')
            .set({
                status: 'approved',
                respondedAt: new Date(),
            })
            .where('id', '=', data.requestId)
            .execute()

        return { success: true }
    })

export const denyRequestFn = createServerFn({ method: 'POST' })
    .inputValidator(denyRequestSchema)
    .handler(async ({ data }) => {
        const { requireAdmin } = await import('../auth/server-middleware')
        await requireAdmin()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        await db
            .updateTable('report_requests')
            .set({
                status: 'denied',
                respondedAt: new Date(),
                responseNotes: data.reason,
            })
            .where('id', '=', data.requestId)
            .execute()

        return { success: true }
    })

export const getReportRequestsFn = createServerFn({ method: 'GET' })
    .inputValidator(getReportRequestsSchema)
    .handler(async ({ data }) => {
        const { requireAdmin } = await import('../auth/server-middleware')
        await requireAdmin()

        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const offset = (data.page - 1) * data.pageSize

        const requests = await db
            .selectFrom('report_requests')
            .leftJoin('users', 'users.id', 'report_requests.farmerId')
            .select([
                'report_requests.id',
                'report_requests.reportType',
                'report_requests.status',
                'report_requests.requestedAt',
                'report_requests.requesterName',
                'report_requests.requesterEmail',
                'report_requests.requesterOrganization',
                'users.name as farmerName',
            ])
            .orderBy('report_requests.requestedAt', 'desc')
            .limit(data.pageSize)
            .offset(offset)
            .execute()

        const total = await db
            .selectFrom('report_requests')
            .select((eb) => eb.fn.count('id').as('count'))
            .executeTakeFirstOrThrow()

        return {
            requests,
            pagination: {
                page: data.page,
                pageSize: data.pageSize,
                total: Number(total.count),
                totalPages: Math.ceil(Number(total.count) / data.pageSize),
            },
        }
    })

export const verifyReportFn = createServerFn({ method: 'GET' })
    .inputValidator(verifyReportSchema)
    .handler(async ({ data }) => {
        const { getDb } = await import('~/lib/db')
        const db = await getDb()

        const report = await db
            .selectFrom('credit_reports')
            .select([
                'credit_reports.id',
                'credit_reports.reportType',
                'credit_reports.status',
                'credit_reports.createdAt',
                'credit_reports.expiresAt',
                'credit_reports.reportHash',
                'credit_reports.signature',
                'credit_reports.publicKey',
                'credit_reports.metricsSnapshot',
                'credit_reports.farmIds',
            ])
            .where('credit_reports.id', '=', data.reportId)
            .executeTakeFirst()

        if (!report) {
            throw new AppError('NOT_FOUND')
        }

        // Verify signature
        const { verifyReport, isExpired } = await import('./signature-service')
        const isValid = await verifyReport(
            report.reportHash,
            report.signature,
            report.publicKey,
        )

        // Check expiration
        const expired = isExpired(report.expiresAt)

        // Log access
        const { logReportAccess } = await import('./repository')
        await logReportAccess(db, {
            reportId: data.reportId,
            accessType: 'verify',
            accessorIp: null,
            accessorUserAgent: null,
            verificationResult: { isValid, expired },
        })

        // Return public metrics only (limited data for privacy)
        const metrics = report.metricsSnapshot as any

        // Get verification count
        const verificationLogs = await db
            .selectFrom('report_access_logs')
            .select(db.fn.count('id').as('count'))
            .where('reportId', '=', data.reportId)
            .where('accessType', '=', 'verify')
            .executeTakeFirst()

        return {
            id: report.id,
            isValid,
            expired,
            reportType: report.reportType,
            createdAt: report.createdAt,
            expiresAt: report.expiresAt,
            status: report.status,
            verificationCount: Number(verificationLogs?.count || 0),
            publicMetrics: {
                creditScore: metrics?.creditScore?.score,
                creditGrade: metrics?.creditScore?.grade,
                productionCapacity: metrics?.trackRecord?.productionVolume,
                sustainabilityScore:
                    metrics?.operational?.growthPerformanceIndex,
            },
        }
    })
