import { createServerFn } from '@tanstack/react-start'
import { db } from '~/lib/db'
import { requireAuth, verifyFarmAccess } from '~/lib/auth/middleware'

// Re-export constants for backward compatibility
export { EXPENSE_CATEGORIES, type ExpenseCategory } from './constants'

export interface CreateExpenseInput {
  farmId: string
  batchId?: string | null
  category:
    | 'feed'
    | 'medicine'
    | 'equipment'
    | 'utilities'
    | 'labor'
    | 'transport'
    | 'other'
  amount: number
  date: Date
  description: string
  supplierId?: string | null
  isRecurring?: boolean
  // Optional feed details for inventory tracking
  feedType?: 'starter' | 'grower' | 'finisher' | 'layer_mash' | 'fish_feed'
  feedQuantityKg?: number
}

export async function createExpense(
  userId: string,
  input: CreateExpenseInput,
): Promise<string> {
  await verifyFarmAccess(userId, input.farmId)

  const result = await db.transaction().execute(async (tx) => {
    // 1. Record the expense
    const expense = await tx
      .insertInto('expenses')
      .values({
        farmId: input.farmId,
        batchId: input.batchId || null,
        category: input.category,
        amount: input.amount.toString(),
        date: input.date,
        description: input.description,
        supplierId: input.supplierId || null,
        isRecurring: input.isRecurring || false,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    // 2. If it's a feed expense with quantity, update inventory
    if (input.category === 'feed' && input.feedType && input.feedQuantityKg) {
      // Check if inventory record exists
      const existing = await tx
        .selectFrom('feed_inventory')
        .select(['id', 'quantityKg'])
        .where('farmId', '=', input.farmId)
        .where('feedType', '=', input.feedType)
        .executeTakeFirst()

      if (existing) {
        // Update existing stock
        const newQuantity = (
          parseFloat(existing.quantityKg) + input.feedQuantityKg
        ).toString()
        await tx
          .updateTable('feed_inventory')
          .set({
            quantityKg: newQuantity,
            updatedAt: new Date(),
          })
          .where('id', '=', existing.id)
          .execute()
      } else {
        // Create new inventory record
        await tx
          .insertInto('feed_inventory')
          .values({
            farmId: input.farmId,
            feedType: input.feedType,
            quantityKg: input.feedQuantityKg.toString(),
            minThresholdKg: '10.00', // Default threshold
            updatedAt: new Date(),
          })
          .execute()
      }
    }

    return expense
  })

  return result.id
}

// Server function for client-side calls
export const createExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { expense: CreateExpenseInput }) => data)
  .handler(async ({ data }) => {
    const session = await requireAuth()
    return createExpense(session.user.id, data.expense)
  })

export async function getExpensesForFarm(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    category?: string
  },
) {
  await verifyFarmAccess(userId, farmId)

  let query = db
    .selectFrom('expenses')
    .leftJoin('suppliers', 'suppliers.id', 'expenses.supplierId')
    .leftJoin('batches', 'batches.id', 'expenses.batchId')
    .select([
      'expenses.id',
      'expenses.farmId',
      'expenses.batchId',
      'expenses.category',
      'expenses.amount',
      'expenses.date',
      'expenses.description',
      'expenses.supplierId',
      'expenses.isRecurring',
      'expenses.createdAt',
      'suppliers.name as supplierName',
      'batches.species as batchSpecies',
      'batches.livestockType as batchType',
    ])
    .where('expenses.farmId', '=', farmId)

  if (options?.startDate) {
    query = query.where('expenses.date', '>=', options.startDate)
  }
  if (options?.endDate) {
    query = query.where('expenses.date', '<=', options.endDate)
  }
  if (options?.category) {
    query = query.where('expenses.category', '=', options.category as any)
  }

  return query.orderBy('expenses.date', 'desc').execute()
}

export async function getExpensesSummary(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
) {
  await verifyFarmAccess(userId, farmId)

  let query = db
    .selectFrom('expenses')
    .select([
      'category',
      db.fn.count('id').as('count'),
      db.fn.sum<string>('amount').as('totalAmount'),
    ])
    .where('farmId', '=', farmId)
    .groupBy('category')

  if (options?.startDate) {
    query = query.where('date', '>=', options.startDate)
  }
  if (options?.endDate) {
    query = query.where('date', '<=', options.endDate)
  }

  const results = await query.execute()

  const summary: Record<string, { count: number; amount: number }> = {}
  let totalCount = 0
  let totalAmount = 0

  for (const row of results) {
    const count = Number(row.count)
    const amount = parseFloat(row.totalAmount)
    summary[row.category] = { count, amount }
    totalCount += count
    totalAmount += amount
  }

  return {
    byCategory: summary,
    total: { count: totalCount, amount: totalAmount },
  }
}

export async function getTotalExpenses(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
): Promise<number> {
  await verifyFarmAccess(userId, farmId)

  let query = db
    .selectFrom('expenses')
    .select(db.fn.sum<string>('amount').as('total'))
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
