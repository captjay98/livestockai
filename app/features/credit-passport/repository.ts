/**
 * Database operations for credit passport management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Data for inserting a new credit report
 */
export interface CreditReportInsert {
  userId: string
  farmIds: Array<string>
  batchIds: Array<string>
  reportType: 'credit_assessment' | 'production_certificate' | 'impact_report'
  startDate: Date
  endDate: Date
  validityDays: 30 | 60 | 90
  expiresAt: Date
  reportHash: string
  signature: string
  publicKey: string
  pdfUrl: string | null
  metricsSnapshot: Record<string, any>
  status: 'active' | 'expired' | 'revoked'
  customNotes: string | null
  whiteLabel: boolean
}

/**
 * Data for inserting a new report request
 */
export interface ReportRequestInsert {
  farmerId: string
  reportType: string
  requesterName: string
  requesterEmail: string
  requesterOrganization: string | null
  purpose: string
  status: 'pending' | 'approved' | 'denied'
}

/**
 * Data for inserting an access log entry
 */
export interface AccessLogInsert {
  reportId: string
  accessType: 'view' | 'download' | 'verify'
  accessorIp: string | null
  accessorUserAgent: string | null
  verificationResult: Record<string, any> | null
}

/**
 * Credit report with user details
 */
export interface CreditReport {
  id: string
  userId: string
  farmIds: Array<string>
  batchIds: Array<string>
  reportType: string
  startDate: Date
  endDate: Date
  validityDays: number
  expiresAt: Date
  reportHash: string
  signature: string
  publicKey: string
  pdfUrl: string | null
  metricsSnapshot: Record<string, any>
  status: string
  customNotes: string | null
  whiteLabel: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  userName?: string
  farmName?: string
}

/**
 * Report request with user details
 */
export interface ReportRequest {
  id: string
  farmerId: string
  reportType: string
  requesterName: string
  requesterEmail: string
  requesterOrganization: string | null
  purpose: string
  status: string
  requestedAt: Date
  respondedAt: Date | null
  responseNotes: string | null
}

/**
 * Access log entry
 */
export interface AccessLog {
  id: string
  reportId: string
  accessType: string
  accessorIp: string | null
  accessorUserAgent: string | null
  verificationResult: Record<string, any> | null
  accessedAt: Date
}

// Credit Report Operations

/**
 * Insert a new credit report
 */
export async function insertCreditReport(
  db: Kysely<Database>,
  report: CreditReportInsert,
): Promise<string> {
  const result = await db
    .insertInto('credit_reports')
    .values(report)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a credit report by ID
 */
export async function getCreditReportById(
  db: Kysely<Database>,
  id: string,
): Promise<CreditReport | null> {
  const result = await db
    .selectFrom('credit_reports')
    .leftJoin('users', 'users.id', 'credit_reports.userId')
    .select([
      'credit_reports.id',
      'credit_reports.userId',
      'credit_reports.farmIds',
      'credit_reports.batchIds',
      'credit_reports.reportType',
      'credit_reports.startDate',
      'credit_reports.endDate',
      'credit_reports.validityDays',
      'credit_reports.expiresAt',
      'credit_reports.reportHash',
      'credit_reports.signature',
      'credit_reports.publicKey',
      'credit_reports.pdfUrl',
      'credit_reports.metricsSnapshot',
      'credit_reports.status',
      'credit_reports.customNotes',
      'credit_reports.whiteLabel',
      'credit_reports.createdAt',
      'credit_reports.updatedAt',
      'credit_reports.deletedAt',
      'users.name as userName',
    ])
    .where('credit_reports.id', '=', id)
    .executeTakeFirst()
  return (result as CreditReport | undefined) ?? null
}

/**
 * Get all credit reports for a user
 */
export async function getCreditReportsByUser(
  db: Kysely<Database>,
  userId: string,
): Promise<Array<CreditReport>> {
  return await db
    .selectFrom('credit_reports')
    .select([
      'credit_reports.id',
      'credit_reports.userId',
      'credit_reports.farmIds',
      'credit_reports.batchIds',
      'credit_reports.reportType',
      'credit_reports.startDate',
      'credit_reports.endDate',
      'credit_reports.validityDays',
      'credit_reports.expiresAt',
      'credit_reports.reportHash',
      'credit_reports.signature',
      'credit_reports.publicKey',
      'credit_reports.pdfUrl',
      'credit_reports.metricsSnapshot',
      'credit_reports.status',
      'credit_reports.customNotes',
      'credit_reports.whiteLabel',
      'credit_reports.createdAt',
      'credit_reports.updatedAt',
      'credit_reports.deletedAt',
    ])
    .where('credit_reports.userId', '=', userId)
    .orderBy('credit_reports.createdAt', 'desc')
    .execute()
}

/**
 * Update credit report status
 */
export async function updateCreditReportStatus(
  db: Kysely<Database>,
  id: string,
  status: 'active' | 'expired' | 'revoked',
): Promise<void> {
  await db
    .updateTable('credit_reports')
    .set({ status, updatedAt: new Date() })
    .where('id', '=', id)
    .execute()
}

// Report Request Operations

/**
 * Insert a new report request
 */
export async function insertReportRequest(
  db: Kysely<Database>,
  request: ReportRequestInsert,
): Promise<string> {
  const result = await db
    .insertInto('report_requests')
    .values(request)
    .returning('id')
    .executeTakeFirstOrThrow()
  return result.id
}

/**
 * Get a report request by ID
 */
export async function getReportRequestById(
  db: Kysely<Database>,
  id: string,
): Promise<ReportRequest | null> {
  const result = await db
    .selectFrom('report_requests')
    .select([
      'report_requests.id',
      'report_requests.farmerId',
      'report_requests.reportType',
      'report_requests.requesterName',
      'report_requests.requesterEmail',
      'report_requests.requesterOrganization',
      'report_requests.purpose',
      'report_requests.status',
      'report_requests.requestedAt',
      'report_requests.respondedAt',
      'report_requests.responseNotes',
    ])
    .where('report_requests.id', '=', id)
    .executeTakeFirst()
  return (result as ReportRequest | undefined) ?? null
}

/**
 * Get pending report requests for a user
 */
export async function getPendingRequestsForUser(
  db: Kysely<Database>,
  userId: string,
): Promise<Array<ReportRequest>> {
  return await db
    .selectFrom('report_requests')
    .select([
      'report_requests.id',
      'report_requests.farmerId',
      'report_requests.reportType',
      'report_requests.requesterName',
      'report_requests.requesterEmail',
      'report_requests.requesterOrganization',
      'report_requests.purpose',
      'report_requests.status',
      'report_requests.requestedAt',
      'report_requests.respondedAt',
      'report_requests.responseNotes',
    ])
    .where('report_requests.farmerId', '=', userId)
    .where('report_requests.status', '=', 'pending')
    .orderBy('report_requests.requestedAt', 'desc')
    .execute()
}

/**
 * Update report request status
 */
export async function updateReportRequestStatus(
  db: Kysely<Database>,
  id: string,
  status: 'pending' | 'approved' | 'denied',
  responseNotes?: string,
): Promise<void> {
  await db
    .updateTable('report_requests')
    .set({
      status,
      responseNotes: responseNotes || null,
      respondedAt: new Date(),
    })
    .where('id', '=', id)
    .execute()
}

// Access Log Operations

/**
 * Log report access
 */
export async function logReportAccess(
  db: Kysely<Database>,
  log: AccessLogInsert,
): Promise<void> {
  await db.insertInto('report_access_logs').values(log).execute()
}

/**
 * Get access logs for a report
 */
export async function getAccessLogsForReport(
  db: Kysely<Database>,
  reportId: string,
): Promise<Array<AccessLog>> {
  return await db
    .selectFrom('report_access_logs')
    .select([
      'report_access_logs.id',
      'report_access_logs.reportId',
      'report_access_logs.accessType',
      'report_access_logs.accessorIp',
      'report_access_logs.accessorUserAgent',
      'report_access_logs.verificationResult',
      'report_access_logs.accessedAt',
    ])
    .where('report_access_logs.reportId', '=', reportId)
    .orderBy('report_access_logs.accessedAt', 'desc')
    .execute()
}

// Metrics Data Queries

/**
 * Get financial data for credit scoring
 */
export async function getFinancialData(
  db: Kysely<Database>,
  farmIds: Array<string>,
  startDate: Date,
  endDate: Date,
): Promise<{
  sales: Array<{ totalAmount: string; date: Date; customerId: string | null }>
  expenses: Array<{ amount: string; category: string; date: Date }>
}> {
  const sales = await db
    .selectFrom('sales')
    .select(['totalAmount', 'date', 'customerId'])
    .where('farmId', 'in', farmIds)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .execute()

  const expenses = await db
    .selectFrom('expenses')
    .select(['amount', 'category', 'date'])
    .where('farmId', 'in', farmIds)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .execute()

  return { sales, expenses }
}

/**
 * Get operational data for credit scoring
 */
export async function getOperationalData(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<{
  batches: Array<{
    id: string
    initialQuantity: number
    currentQuantity: number
    status: string
    acquisitionDate: Date
  }>
  feedRecords: Array<{
    batchId: string
    quantityKg: string
    costPerKg: string
    feedDate: Date
  }>
  weightSamples: Array<{
    batchId: string
    averageWeightG: number
    sampleDate: Date
  }>
}> {
  const batches = await db
    .selectFrom('batches')
    .select([
      'id',
      'initialQuantity',
      'currentQuantity',
      'status',
      'acquisitionDate',
    ])
    .where('farmId', 'in', farmIds)
    .execute()

  const batchIds = batches.map((b) => b.id)

  const feedRecords = await db
    .selectFrom('feed_records')
    .select(['batchId', 'quantityKg', 'cost', 'date'])
    .where('batchId', 'in', batchIds)
    .execute()

  const weightSamples = await db
    .selectFrom('weight_samples')
    .select(['batchId', 'averageWeightKg', 'date'])
    .where('batchId', 'in', batchIds)
    .execute()

  return {
    batches,
    feedRecords: feedRecords.map((f) => ({
      batchId: f.batchId,
      quantityKg: f.quantityKg,
      costPerKg: (Number(f.cost) / Number(f.quantityKg)).toFixed(2),
      feedDate: f.date,
    })),
    weightSamples: weightSamples.map((w) => ({
      batchId: w.batchId,
      averageWeightG: Number(w.averageWeightKg) * 1000,
      sampleDate: w.date,
    })),
  }
}

/**
 * Get track record data for credit scoring
 */
export async function getTrackRecordData(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<{
  batches: Array<{
    id: string
    acquisitionDate: Date
    status: string
    initialQuantity: number
    currentQuantity: number
    targetWeightG: number | null
    livestockType: string
  }>
  sales: Array<{
    totalAmount: string
    date: Date
    customerId: string | null
    livestockType: string
  }>
}> {
  const batches = await db
    .selectFrom('batches')
    .select([
      'id',
      'acquisitionDate',
      'status',
      'initialQuantity',
      'currentQuantity',
      'target_weight_g',
      'livestockType',
    ])
    .where('farmId', 'in', farmIds)
    .execute()

  const sales = await db
    .selectFrom('sales')
    .select(['totalAmount', 'date', 'customerId', 'livestockType'])
    .where('farmId', 'in', farmIds)
    .execute()

  return {
    batches: batches.map((b) => ({
      id: b.id,
      acquisitionDate: b.acquisitionDate,
      status: b.status,
      initialQuantity: b.initialQuantity,
      currentQuantity: b.currentQuantity,
      targetWeightG: b.target_weight_g,
      livestockType: b.livestockType,
    })),
    sales,
  }
}

/**
 * Get asset data for credit scoring
 */
export async function getAssetData(
  db: Kysely<Database>,
  farmIds: Array<string>,
): Promise<{
  batches: Array<{
    farmId: string
    livestockType: string
    currentQuantity: number
    totalCost: string
  }>
  structures: Array<{
    farmId: string
    type: string
    capacity: number | null
    areaSqm: string | null
  }>
  marketPrices: Array<{
    species: string
    pricePerKg: string
    updatedAt: Date
  }>
}> {
  const batches = await db
    .selectFrom('batches')
    .select(['farmId', 'livestockType', 'currentQuantity', 'totalCost'])
    .where('farmId', 'in', farmIds)
    .where('status', '=', 'active')
    .execute()

  const structures = await db
    .selectFrom('structures')
    .select(['farmId', 'type', 'capacity', 'areaSqm'])
    .where('farmId', 'in', farmIds)
    .where('status', '=', 'active')
    .execute()

  const marketPrices = await db
    .selectFrom('market_prices')
    .select(['species', 'price_per_unit', 'updated_at'])
    .execute()

  return {
    batches,
    structures,
    marketPrices: marketPrices.map((m) => ({
      species: m.species,
      pricePerKg: m.price_per_unit,
      updatedAt: m.updated_at,
    })),
  }
}
