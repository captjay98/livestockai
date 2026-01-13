import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

export interface InvoiceRecord {
  id: string
  invoiceNumber: string
  totalAmount: number
  status: 'unpaid' | 'partial' | 'paid'
  date: Date
  dueDate: Date | null
  customerName: string
}

export interface CreateInvoiceInput {
  customerId: string
  farmId: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
  }>
  dueDate?: Date | null
  notes?: string | null
}

export interface InvoiceQuery extends BasePaginatedQuery {
  status?: 'unpaid' | 'partial' | 'paid'
}

export async function generateInvoiceNumber(): Promise<string> {
  const { db } = await import('~/lib/db')
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  const lastInvoice = await db
    .selectFrom('invoices')
    .select('invoiceNumber')
    .where('invoiceNumber', 'like', `${prefix}%`)
    .orderBy('invoiceNumber', 'desc')
    .limit(1)
    .executeTakeFirst()

  let nextNumber = 1
  if (lastInvoice) {
    const lastNumber = parseInt(
      lastInvoice.invoiceNumber.replace(prefix, ''),
      10,
    )
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const invoiceNumber = await generateInvoiceNumber()
  const totalAmount = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )

  const result = await db
    .insertInto('invoices')
    .values({
      invoiceNumber,
      customerId: input.customerId,
      farmId: input.farmId,
      totalAmount: totalAmount.toString(),
      status: 'unpaid',
      date: new Date(),
      dueDate: input.dueDate || null,
      notes: input.notes || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  // Insert invoice items
  for (const item of input.items) {
    await db
      .insertInto('invoice_items')
      .values({
        invoiceId: result.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        total: (item.quantity * item.unitPrice).toString(),
      })
      .execute()
  }

  return result.id
}

export const createInvoiceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateInvoiceInput) => data)
  .handler(async ({ data }) => {
    return createInvoice(data)
  })

export async function getInvoices(farmId?: string) {
  const { db } = await import('~/lib/db')
  let query = db
    .selectFrom('invoices')
    .innerJoin('customers', 'customers.id', 'invoices.customerId')
    .select([
      'invoices.id',
      'invoices.invoiceNumber',
      'invoices.totalAmount',
      'invoices.status',
      'invoices.date',
      'invoices.dueDate',
      'customers.name as customerName',
    ])
    .orderBy('invoices.date', 'desc')

  if (farmId) {
    query = query.where('invoices.farmId', '=', farmId)
  }

  return query.execute()
}

export async function getInvoiceById(invoiceId: string) {
  const { db } = await import('~/lib/db')
  const invoice = await db
    .selectFrom('invoices')
    .innerJoin('customers', 'customers.id', 'invoices.customerId')
    .innerJoin('farms', 'farms.id', 'invoices.farmId')
    .select([
      'invoices.id',
      'invoices.invoiceNumber',
      'invoices.totalAmount',
      'invoices.status',
      'invoices.date',
      'invoices.dueDate',
      'invoices.notes',
      'customers.id as customerId',
      'customers.name as customerName',
      'customers.phone as customerPhone',
      'customers.email as customerEmail',
      'customers.location as customerLocation',
      'farms.name as farmName',
      'farms.location as farmLocation',
    ])
    .where('invoices.id', '=', invoiceId)
    .executeTakeFirst()

  if (!invoice) return null

  const items = await db
    .selectFrom('invoice_items')
    .select(['id', 'description', 'quantity', 'unitPrice', 'total'])
    .where('invoiceId', '=', invoiceId)
    .execute()

  return {
    ...invoice,
    items: items.map((item) => ({
      ...item,
      unitPrice: parseFloat(item.unitPrice),
      total: parseFloat(item.total),
    })),
  }
}

export const getInvoiceByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { invoiceId: string }) => data)
  .handler(async ({ data }) => {
    return getInvoiceById(data.invoiceId)
  })

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'unpaid' | 'partial' | 'paid',
) {
  const { db } = await import('~/lib/db')
  await db
    .updateTable('invoices')
    .set({ status })
    .where('id', '=', invoiceId)
    .execute()
}

export const updateInvoiceStatusFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { invoiceId: string; status: 'unpaid' | 'partial' | 'paid' }) =>
      data,
  )
  .handler(async ({ data }) => {
    return updateInvoiceStatus(data.invoiceId, data.status)
  })

export async function deleteInvoice(invoiceId: string) {
  const { db } = await import('~/lib/db')
  await db
    .deleteFrom('invoice_items')
    .where('invoiceId', '=', invoiceId)
    .execute()

  await db.deleteFrom('invoices').where('id', '=', invoiceId).execute()
}

export async function createInvoiceFromSale(
  saleId: string,
): Promise<string | null> {
  const { db } = await import('~/lib/db')
  const sale = await db
    .selectFrom('sales')
    .select([
      'id',
      'farmId',
      'customerId',
      'livestockType',
      'quantity',
      'unitPrice',
      'totalAmount',
    ])
    .where('id', '=', saleId)
    .executeTakeFirst()

  if (!sale || !sale.customerId) return null

  return createInvoice({
    customerId: sale.customerId,
    farmId: sale.farmId,
    items: [
      {
        description: `${sale.livestockType} - ${sale.quantity} units`,
        quantity: sale.quantity,
        unitPrice: parseFloat(sale.unitPrice),
      },
    ],
  })
}

export async function getInvoicesPaginated(query: InvoiceQuery = {}) {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')

  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const offset = (page - 1) * pageSize

  let baseQuery = db
    .selectFrom('invoices')
    .innerJoin('customers', 'customers.id', 'invoices.customerId')

  if (query.farmId) {
    baseQuery = baseQuery.where('invoices.farmId', '=', query.farmId)
  }

  if (query.status) {
    baseQuery = baseQuery.where('invoices.status', '=', query.status)
  }

  if (query.search) {
    const searchLower = `%${query.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('invoices.invoiceNumber', 'ilike', searchLower),
        eb('customers.name', 'ilike', searchLower),
      ]),
    )
  }

  // Count
  const countResult = await baseQuery
    .select(sql<number>`count(invoices.id)`.as('count'))
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Data
  let dataQuery = baseQuery
    .select([
      'invoices.id',
      'invoices.invoiceNumber',
      'invoices.totalAmount',
      'invoices.status',
      'invoices.date',
      'invoices.dueDate',
      'customers.name as customerName',
    ])
    .limit(pageSize)
    .offset(offset)

  if (query.sortBy) {
    const sortOrder = query.sortOrder || 'desc'
    const sortCol = query.sortBy
    if (
      ['invoiceNumber', 'totalAmount', 'status', 'date', 'dueDate'].includes(
        sortCol,
      )
    ) {
      dataQuery = dataQuery.orderBy(sql.raw(`invoices.${sortCol}`), sortOrder)
    } else if (sortCol === 'customerName') {
      dataQuery = dataQuery.orderBy('customers.name', sortOrder)
    } else {
      dataQuery = dataQuery.orderBy('invoices.date', 'desc')
    }
  } else {
    dataQuery = dataQuery.orderBy('invoices.date', 'desc')
  }

  const rawData = await dataQuery.execute()

  return {
    data: rawData.map((d) => ({
      ...d,
      totalAmount: parseFloat(d.totalAmount),
    })),
    total,
    page,
    pageSize,
    totalPages,
  }
}

export const getInvoicesPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: InvoiceQuery) => data)
  .handler(async ({ data }) => {
    return getInvoicesPaginated(data)
  })
