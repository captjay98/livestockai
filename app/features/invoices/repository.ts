/**
 * Database operations for invoice management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

/**
 * Data for inserting a new invoice
 */
export interface InvoiceInsert {
  invoiceNumber: string
  customerId: string
  farmId: string
  totalAmount: string
  status: 'unpaid' | 'partial' | 'paid'
  date: Date
  dueDate: Date | null
  notes: string | null
}

/**
 * Data for inserting invoice items
 */
export interface InvoiceItemInsert {
  invoiceId: string
  description: string
  quantity: number
  unitPrice: string
  total: string
}

/**
 * Invoice with customer information
 */
export interface InvoiceWithCustomer {
  id: string
  invoiceNumber: string
  totalAmount: string
  status: 'unpaid' | 'partial' | 'paid'
  date: Date
  dueDate: Date | null
  notes: string | null
  customerId: string
  customerName: string
}

/**
 * Full invoice with customer and farm details
 */
export interface InvoiceWithDetails {
  id: string
  invoiceNumber: string
  totalAmount: string
  status: 'unpaid' | 'partial' | 'paid'
  date: Date
  dueDate: Date | null
  notes: string | null
  customerId: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  customerLocation: string | null
  farmId: string
  farmName: string
  farmLocation: string | null
}

/**
 * Invoice line item
 */
export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: string
  total: string
}

/**
 * Sale record for invoice creation
 */
export interface SaleForInvoice {
  id: string
  farmId: string
  customerId: string | null
  livestockType: string
  quantity: number
  unitPrice: string
  totalAmount: string
}

/**
 * Filters for invoice queries
 */
export interface InvoiceFilters extends BasePaginatedQuery {
  status?: 'unpaid' | 'partial' | 'paid'
}

/**
 * Get the last invoice number for a given prefix and farm.
 * Used to generate the next sequential invoice number.
 *
 * @param db - Kysely database instance
 * @param prefix - Invoice number prefix (e.g., "INV-2024-")
 * @param farmId - Farm ID to filter by
 * @returns The last invoice number or null if no invoices exist
 *
 * @example
 * ```ts
 * const lastNumber = await getLastInvoiceNumber(db, "INV-2024-", "farm-1")
 * // Returns: "INV-2024-0001" or null
 * ```
 */
export async function getLastInvoiceNumber(
  db: Kysely<Database>,
  prefix: string,
  farmId: string,
): Promise<string | null> {
  const result = await db
    .selectFrom('invoices')
    .select('invoiceNumber')
    .where('farmId', '=', farmId)
    .where('invoiceNumber', 'like', `${prefix}%`)
    .orderBy('invoiceNumber', 'desc')
    .limit(1)
    .executeTakeFirst()

  return result?.invoiceNumber ?? null
}

/**
 * Insert a new invoice into the database.
 *
 * @param db - Kysely database instance
 * @param data - Invoice data to insert
 * @returns The ID of the created invoice
 *
 * @example
 * ```ts
 * const invoiceId = await insertInvoice(db, {
 *   invoiceNumber: "INV-2024-0001",
 *   customerId: "customer-1",
 *   farmId: "farm-1",
 *   totalAmount: "550.00",
 *   status: "unpaid",
 *   date: new Date(),
 *   dueDate: null,
 *   notes: null
 * })
 * ```
 */
export async function insertInvoice(
  db: Kysely<Database>,
  data: InvoiceInsert,
): Promise<string> {
  const result = await db
    .insertInto('invoices')
    .values(data)
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Insert multiple invoice items in a single transaction.
 *
 * @param db - Kysely database instance
 * @param items - Array of invoice item data to insert
 *
 * @example
 * ```ts
 * await insertInvoiceItems(db, [
 *   { invoiceId: "invoice-1", description: "Item 1", quantity: 10, unitPrice: "5.50", total: "55.00" },
 *   { invoiceId: "invoice-1", description: "Item 2", quantity: 5, unitPrice: "10.00", total: "50.00" }
 * ])
 * ```
 */
export async function insertInvoiceItems(
  db: Kysely<Database>,
  items: Array<InvoiceItemInsert>,
): Promise<void> {
  if (items.length === 0) return

  await db.insertInto('invoice_items').values(items).execute()
}

/**
 * Get a single invoice by ID with customer details.
 *
 * @param db - Kysely database instance
 * @param invoiceId - ID of the invoice to retrieve
 * @returns The invoice data or null if not found
 */
export async function getInvoiceById(
  db: Kysely<Database>,
  invoiceId: string,
): Promise<InvoiceWithDetails | null> {
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
      'invoices.farmId',
      'farms.name as farmName',
      'farms.location as farmLocation',
    ])
    .where('invoices.id', '=', invoiceId)
    .executeTakeFirst()

  return (invoice as InvoiceWithDetails | null) ?? null
}

/**
 * Get all invoices for a specific farm with customer names.
 *
 * @param db - Kysely database instance
 * @param farmId - Farm ID to filter by
 * @returns Array of invoices with customer names
 */
export async function getInvoicesByFarm(
  db: Kysely<Database>,
  farmId: string,
): Promise<Array<InvoiceWithCustomer>> {
  return (await db
    .selectFrom('invoices')
    .innerJoin('customers', 'customers.id', 'invoices.customerId')
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
    ])
    .where('invoices.farmId', '=', farmId)
    .orderBy('invoices.date', 'desc')
    .execute()) as unknown as Array<InvoiceWithCustomer>
}

/**
 * Get all line items for a specific invoice.
 *
 * @param db - Kysely database instance
 * @param invoiceId - Invoice ID
 * @returns Array of invoice items
 */
export async function getInvoiceItems(
  db: Kysely<Database>,
  invoiceId: string,
): Promise<Array<InvoiceItem>> {
  return await db
    .selectFrom('invoice_items')
    .select(['id', 'description', 'quantity', 'unitPrice', 'total'])
    .where('invoiceId', '=', invoiceId)
    .execute()
}

/**
 * Update the payment status of an invoice.
 *
 * @param db - Kysely database instance
 * @param invoiceId - ID of the invoice to update
 * @param status - New payment status
 */
export async function updateInvoiceStatus(
  db: Kysely<Database>,
  invoiceId: string,
  status: 'unpaid' | 'partial' | 'paid',
): Promise<void> {
  await db
    .updateTable('invoices')
    .set({ status })
    .where('id', '=', invoiceId)
    .execute()
}

/**
 * Delete all invoice items for a specific invoice.
 * Must be called before deleting the invoice itself due to foreign key constraints.
 *
 * @param db - Kysely database instance
 * @param invoiceId - Invoice ID
 */
export async function deleteInvoiceItems(
  db: Kysely<Database>,
  invoiceId: string,
): Promise<void> {
  await db
    .deleteFrom('invoice_items')
    .where('invoiceId', '=', invoiceId)
    .execute()
}

/**
 * Delete an invoice by ID.
 * Note: Invoice items should be deleted first due to foreign key constraints.
 *
 * @param db - Kysely database instance
 * @param invoiceId - ID of the invoice to delete
 */
export async function deleteInvoice(
  db: Kysely<Database>,
  invoiceId: string,
): Promise<void> {
  await db.deleteFrom('invoices').where('id', '=', invoiceId).execute()
}

/**
 * Get sale data for creating an invoice from a sale.
 *
 * @param db - Kysely database instance
 * @param saleId - ID of the sale
 * @returns Sale data or null if not found
 */
export async function getSaleForInvoice(
  db: Kysely<Database>,
  saleId: string,
): Promise<SaleForInvoice | null> {
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

  return (sale as SaleForInvoice | null) ?? null
}

/**
 * Get paginated invoices with optional filtering and sorting.
 *
 * @param db - Kysely database instance
 * @param filters - Query filters and pagination parameters
 * @returns Paginated result with invoice data
 */
export async function getInvoicesPaginated(
  db: Kysely<Database>,
  filters: InvoiceFilters = {},
): Promise<
  PaginatedResult<{
    id: string
    invoiceNumber: string
    totalAmount: string
    status: 'unpaid' | 'partial' | 'paid'
    date: Date
    dueDate: Date | null
    customerName: string
  }>
> {
  const { sql } = await import('kysely')

  const page = filters.page || 1
  const pageSize = filters.pageSize || 10
  const offset = (page - 1) * pageSize

  let baseQuery = db
    .selectFrom('invoices')
    .innerJoin('customers', 'customers.id', 'invoices.customerId')

  if (filters.farmId) {
    baseQuery = baseQuery.where('invoices.farmId', '=', filters.farmId)
  }

  if (filters.status) {
    baseQuery = baseQuery.where('invoices.status', '=', filters.status)
  }

  if (filters.search) {
    const searchLower = `%${filters.search.toLowerCase()}%`
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('invoices.invoiceNumber', 'ilike', searchLower),
        eb('customers.name', 'ilike', searchLower),
      ]),
    )
  }

  // Count total records
  const countResult = await baseQuery
    .select(sql<number>`count(invoices.id)`.as('count'))
    .executeTakeFirst()

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Build data query with sorting
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

  // Apply sorting - validate columns to prevent SQL injection
  const sortBy = filters.sortBy
  const sortOrder = filters.sortOrder || 'desc'
  const allowedCols: Record<string, string> = {
    invoiceNumber: 'invoices."invoiceNumber"',
    totalAmount: 'invoices."totalAmount"',
    status: 'invoices.status',
    date: 'invoices.date',
    dueDate: 'invoices."dueDate"',
    createdAt: 'invoices."createdAt"',
    customerName: 'customers.name',
  }
  const sortCol = sortBy ? allowedCols[sortBy] : null
  if (sortCol) {
    dataQuery = dataQuery.orderBy(sql.raw(sortCol), sortOrder)
  } else {
    dataQuery = dataQuery.orderBy('invoices.date', 'desc')
  }

  const data = await dataQuery.execute()

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}
