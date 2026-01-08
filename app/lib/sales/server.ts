import { db } from '~/lib/db'
import { verifyFarmAccess } from '~/lib/auth/middleware'

export interface CreateSaleInput {
  farmId: string
  batchId?: string | null
  customerId?: string | null
  livestockType: 'poultry' | 'fish' | 'eggs'
  quantity: number
  unitPrice: number
  date: Date
  notes?: string | null
}

export async function createSale(
  userId: string,
  input: CreateSaleInput
): Promise<string> {
  await verifyFarmAccess(userId, input.farmId)

  const totalAmount = input.quantity * input.unitPrice

  // If selling from a batch, update the batch quantity
  if (input.batchId && input.livestockType !== 'eggs') {
    const batch = await db
      .selectFrom('batches')
      .select(['id', 'currentQuantity', 'farmId'])
      .where('id', '=', input.batchId)
      .where('farmId', '=', input.farmId)
      .executeTakeFirst()

    if (!batch) {
      throw new Error('Batch not found or does not belong to this farm')
    }

    if (batch.currentQuantity < input.quantity) {
      throw new Error('Quantity exceeds available stock')
    }

    const newQuantity = batch.currentQuantity - input.quantity

    await db
      .updateTable('batches')
      .set({
        currentQuantity: newQuantity,
        status: newQuantity === 0 ? 'sold' : 'active',
        updatedAt: new Date(),
      })
      .where('id', '=', input.batchId)
      .execute()
  }

  const result = await db
    .insertInto('sales')
    .values({
      farmId: input.farmId,
      batchId: input.batchId || null,
      customerId: input.customerId || null,
      livestockType: input.livestockType,
      quantity: input.quantity,
      unitPrice: input.unitPrice.toString(),
      totalAmount: totalAmount.toString(),
      date: input.date,
      notes: input.notes || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export async function getSalesForFarm(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    livestockType?: 'poultry' | 'fish' | 'eggs'
  }
) {
  await verifyFarmAccess(userId, farmId)

  let query = db
    .selectFrom('sales')
    .leftJoin('customers', 'customers.id', 'sales.customerId')
    .leftJoin('batches', 'batches.id', 'sales.batchId')
    .select([
      'sales.id',
      'sales.farmId',
      'sales.batchId',
      'sales.customerId',
      'sales.livestockType',
      'sales.quantity',
      'sales.unitPrice',
      'sales.totalAmount',
      'sales.date',
      'sales.notes',
      'sales.createdAt',
      'customers.name as customerName',
      'batches.species as batchSpecies',
    ])
    .where('sales.farmId', '=', farmId)

  if (options?.startDate) {
    query = query.where('sales.date', '>=', options.startDate)
  }
  if (options?.endDate) {
    query = query.where('sales.date', '<=', options.endDate)
  }
  if (options?.livestockType) {
    query = query.where('sales.livestockType', '=', options.livestockType)
  }

  return query.orderBy('sales.date', 'desc').execute()
}

export async function getSalesSummary(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  }
) {
  await verifyFarmAccess(userId, farmId)

  let query = db
    .selectFrom('sales')
    .select([
      'livestockType',
      db.fn.count('id').as('count'),
      db.fn.sum<string>('quantity').as('totalQuantity'),
      db.fn.sum<string>('totalAmount').as('totalRevenue'),
    ])
    .where('farmId', '=', farmId)
    .groupBy('livestockType')

  if (options?.startDate) {
    query = query.where('date', '>=', options.startDate)
  }
  if (options?.endDate) {
    query = query.where('date', '<=', options.endDate)
  }

  const results = await query.execute()

  const summary = {
    poultry: { count: 0, quantity: 0, revenue: 0 },
    fish: { count: 0, quantity: 0, revenue: 0 },
    eggs: { count: 0, quantity: 0, revenue: 0 },
    total: { count: 0, quantity: 0, revenue: 0 },
  }

  for (const row of results) {
    const type = row.livestockType as keyof typeof summary
    if (type in summary) {
      summary[type] = {
        count: Number(row.count),
        quantity: Number(row.totalQuantity),
        revenue: parseFloat(row.totalRevenue as string),
      }
      summary.total.count += Number(row.count)
      summary.total.quantity += Number(row.totalQuantity)
      summary.total.revenue += parseFloat(row.totalRevenue as string)
    }
  }

  return summary
}

export async function getTotalRevenue(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  }
): Promise<number> {
  await verifyFarmAccess(userId, farmId)

  let query = db
    .selectFrom('sales')
    .select(db.fn.sum<string>('totalAmount').as('total'))
    .where('farmId', '=', farmId)

  if (options?.startDate) {
    query = query.where('date', '>=', options.startDate)
  }
  if (options?.endDate) {
    query = query.where('date', '<=', options.endDate)
  }

  const result = await query.executeTakeFirst()
  return parseFloat(result?.total || '0')
}
