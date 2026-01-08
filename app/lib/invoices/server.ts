import { db } from '~/lib/db'

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

export async function generateInvoiceNumber(): Promise<string> {
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
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

export async function createInvoice(input: CreateInvoiceInput): Promise<string> {
  const invoiceNumber = await generateInvoiceNumber()
  const totalAmount = input.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

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

export async function getInvoices(farmId?: string) {
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
    items: items.map(item => ({
      ...item,
      unitPrice: parseFloat(item.unitPrice),
      total: parseFloat(item.total),
    })),
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'unpaid' | 'partial' | 'paid'
) {
  await db
    .updateTable('invoices')
    .set({ status })
    .where('id', '=', invoiceId)
    .execute()
}

export async function deleteInvoice(invoiceId: string) {
  await db
    .deleteFrom('invoice_items')
    .where('invoiceId', '=', invoiceId)
    .execute()

  await db
    .deleteFrom('invoices')
    .where('id', '=', invoiceId)
    .execute()
}

export async function createInvoiceFromSale(saleId: string): Promise<string | null> {
  const sale = await db
    .selectFrom('sales')
    .select(['id', 'farmId', 'customerId', 'livestockType', 'quantity', 'unitPrice', 'totalAmount'])
    .where('id', '=', saleId)
    .executeTakeFirst()

  if (!sale || !sale.customerId) return null

  return createInvoice({
    customerId: sale.customerId,
    farmId: sale.farmId,
    items: [{
      description: `${sale.livestockType} - ${sale.quantity} units`,
      quantity: sale.quantity,
      unitPrice: parseFloat(sale.unitPrice),
    }],
  })
}
