import { db } from '~/lib/db'
import { verifyFarmAccess } from '~/lib/auth/middleware'

// Re-export constants for backward compatibility
export { EXPENSE_CATEGORIES, type ExpenseCategory } from './constants'

export interface CreateExpenseInput {
  farmId: string
  category: 'feed' | 'medicine' | 'equipment' | 'utilities' | 'labor' | 'transport' | 'other'
  amount: number
  date: Date
  description: string
  supplierId?: string | null
  isRecurring?: boolean
}

export async function createExpense(
  userId: string,
  input: CreateExpenseInput
): Promise<string> {
  await verifyFarmAccess(userId, input.farmId)

  const result = await db
    .insertInto('expenses')
    .values({
      farmId: input.farmId,
      category: input.category,
      amount: input.amount.toString(),
      date: input.date,
      description: input.description,
      supplierId: input.supplierId || null,
      isRecurring: input.isRecurring || false,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

export async function getExpensesForFarm(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    category?: string
  }
) {
  await verifyFarmAccess(userId, farmId)

  let query = db
    .selectFrom('expenses')
    .leftJoin('suppliers', 'suppliers.id', 'expenses.supplierId')
    .select([
      'expenses.id',
      'expenses.farmId',
      'expenses.category',
      'expenses.amount',
      'expenses.date',
      'expenses.description',
      'expenses.supplierId',
      'expenses.isRecurring',
      'expenses.createdAt',
      'suppliers.name as supplierName',
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
  }
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
    const amount = parseFloat(row.totalAmount as string)
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
  }
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
