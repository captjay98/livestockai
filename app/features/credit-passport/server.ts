/**
 * Credit Passport Server Functions
 *
 * CSV export implementation for credit reports.
 * PDF generation disabled to stay within Cloudflare Workers free tier.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { format } from 'date-fns'
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

const FEATURE_DISABLED_MESSAGE =
  'Credit Passport feature is temporarily unavailable. Please try again later.'

/**
 * Generate CSV report for credit assessment
 */
export const generateCSVReportFn = createServerFn({ method: 'POST' })
  .inputValidator(generateReportSchema)
  .handler(async ({ data }) => {
    await import('../auth/server-middleware').then(({ requireAuth }) =>
      requireAuth(),
    )
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Fetch farm data
    const farms = await db
      .selectFrom('farms')
      .selectAll()
      .where('id', 'in', data.farmIds)
      .execute()

    // Fetch batch data
    const batches = await db
      .selectFrom('batches')
      .selectAll()
      .where('farmId', 'in', data.farmIds)
      .where(
        'id',
        'in',
        data.batchIds.length > 0 ? data.batchIds : ['no-match'],
      )
      .execute()

    // Fetch sales data
    const sales = await db
      .selectFrom('sales')
      .selectAll()
      .where('farmId', 'in', data.farmIds)
      .where('date', '>=', data.startDate)
      .where('date', '<=', data.endDate)
      .execute()

    // Fetch expenses data
    const expenses = await db
      .selectFrom('expenses')
      .selectAll()
      .where('farmId', 'in', data.farmIds)
      .where('date', '>=', data.startDate)
      .where('date', '<=', data.endDate)
      .execute()

    // Calculate summary metrics
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    )
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    )
    const netProfit = totalRevenue - totalExpenses

    // Generate CSV content
    const csvLines: Array<string> = []

    // Header
    csvLines.push('LivestockAI Credit Passport Report')
    csvLines.push(`Report Type: ${data.reportType}`)
    csvLines.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
    csvLines.push(
      `Period: ${format(data.startDate, 'yyyy-MM-dd')} to ${format(data.endDate, 'yyyy-MM-dd')}`,
    )
    csvLines.push('')

    // Farm Summary
    csvLines.push('FARM INFORMATION')
    csvLines.push('Farm Name,Location,Type')
    farms.forEach((farm) => {
      csvLines.push(`"${farm.name}","${farm.location}","${farm.type}"`)
    })
    csvLines.push('')

    // Financial Summary
    csvLines.push('FINANCIAL SUMMARY')
    csvLines.push('Metric,Amount')
    csvLines.push(`Total Revenue,${totalRevenue.toFixed(2)}`)
    csvLines.push(`Total Expenses,${totalExpenses.toFixed(2)}`)
    csvLines.push(`Net Profit,${netProfit.toFixed(2)}`)
    csvLines.push(
      `Profit Margin,${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0}%`,
    )
    csvLines.push('')

    // Batch Summary
    csvLines.push('BATCH INFORMATION')
    csvLines.push(
      'Batch Name,Species,Initial Quantity,Current Quantity,Status,Acquisition Date',
    )
    batches.forEach((batch) => {
      csvLines.push(
        `"${batch.batchName || 'N/A'}","${batch.species}",${batch.initialQuantity},${batch.currentQuantity},"${batch.status}","${format(new Date(batch.acquisitionDate), 'yyyy-MM-dd')}"`,
      )
    })
    csvLines.push('')

    // Sales Details
    csvLines.push('SALES TRANSACTIONS')
    csvLines.push('Date,Type,Quantity,Unit Price,Total Amount')
    sales.forEach((sale) => {
      csvLines.push(
        `"${format(new Date(sale.date), 'yyyy-MM-dd')}","${sale.livestockType}",${sale.quantity},${Number(sale.unitPrice).toFixed(2)},${Number(sale.totalAmount).toFixed(2)}`,
      )
    })
    csvLines.push('')

    // Expenses Details
    csvLines.push('EXPENSE TRANSACTIONS')
    csvLines.push('Date,Category,Description,Amount')
    expenses.forEach((expense) => {
      csvLines.push(
        `"${format(new Date(expense.date), 'yyyy-MM-dd')}","${expense.category}","${expense.description}",${Number(expense.amount).toFixed(2)}`,
      )
    })

    if (data.customNotes) {
      csvLines.push('')
      csvLines.push('ADDITIONAL NOTES')
      csvLines.push(`"${data.customNotes}"`)
    }

    return {
      csv: csvLines.join('\n'),
      filename: `credit-passport-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    }
  })

export const generateReportFn = createServerFn({ method: 'POST' })
  .inputValidator(generateReportSchema)
  .handler(() => {
    throw new AppError('FEATURE_DISABLED', {
      message: FEATURE_DISABLED_MESSAGE,
    })
  })

export const deleteReportFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteReportSchema)
  .handler(() => {
    throw new AppError('FEATURE_DISABLED', {
      message: FEATURE_DISABLED_MESSAGE,
    })
  })

export const downloadReportFn = createServerFn({ method: 'POST' })
  .inputValidator(downloadReportSchema)
  .handler(() => {
    throw new AppError('FEATURE_DISABLED', {
      message: FEATURE_DISABLED_MESSAGE,
    })
  })

export const getReportsHistoryFn = createServerFn({ method: 'GET' })
  .inputValidator(getReportsHistorySchema)
  .handler(() => {
    return { reports: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  })

export const approveRequestFn = createServerFn({ method: 'POST' })
  .inputValidator(approveRequestSchema)
  .handler(() => {
    throw new AppError('FEATURE_DISABLED', {
      message: FEATURE_DISABLED_MESSAGE,
    })
  })

export const denyRequestFn = createServerFn({ method: 'POST' })
  .inputValidator(denyRequestSchema)
  .handler(() => {
    throw new AppError('FEATURE_DISABLED', {
      message: FEATURE_DISABLED_MESSAGE,
    })
  })

export const getReportRequestsFn = createServerFn({ method: 'GET' })
  .inputValidator(getReportRequestsSchema)
  .handler(() => {
    return { requests: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  })

export const verifyReportFn = createServerFn({ method: 'GET' })
  .inputValidator(verifyReportSchema)
  .handler(() => {
    throw new AppError('FEATURE_DISABLED', {
      message: FEATURE_DISABLED_MESSAGE,
    })
  })
