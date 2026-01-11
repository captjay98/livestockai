import { createServerFn } from '@tanstack/react-start'

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
    | 'livestock'
    | 'livestock_chicken'
    | 'livestock_fish'
    | 'maintenance'
    | 'marketing'
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
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

    // Log audit inside transaction or outside? Outside is safer for performance, but inside ensures consistency.
    // However, logAudit creates its own connection usually? No, it uses `db`.
    // Kysely `tx` is different from `db`. If I use `logAudit` which imports `db`, it might not be in the transaction.
    // That's fine for audit logs (consistency is good but if the main tx succeeds and audit fails, well...)
    // Actually, `logAudit` inside `db.transaction()` callback using the global `db` handles it separately.
    // To match transaction, I would need to pass `tx` to `logAudit`.
    // For now, I'll log *after* the transaction commits.
    return expense
  })

  // Log audit
  const { logAudit } = await import('~/lib/logging/audit')
  await logAudit({
    userId,
    action: 'create',
    entityType: 'expense',
    entityId: result.id,
    details: input,
  })

  return result.id
}

// Server function for client-side calls
export const createExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { expense: CreateExpenseInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return createExpense(session.user.id, data.expense)
  })

/**
 * Delete an expense record
 */
export async function deleteExpense(userId: string, expenseId: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  const userFarms = await getUserFarms(userId)
  const farmIds = userFarms.map((f) => f.id)

  const expense = await db
    .selectFrom('expenses')
    .select(['id', 'farmId'])
    .where('id', '=', expenseId)
    .executeTakeFirst()

  if (!expense) {
    throw new Error('Expense not found')
  }

  if (!farmIds.includes(expense.farmId)) {
    throw new Error('Not authorized to delete this expense')
  }

  await db.deleteFrom('expenses').where('id', '=', expenseId).execute()

  const { logAudit } = await import('~/lib/logging/audit')
  await logAudit({
    userId,
    action: 'delete',
    entityType: 'expense',
    entityId: expenseId,
    details: { message: 'Expense deleted', snapshot: expense },
  })
}

// Server function for client-side calls
export const deleteExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { expenseId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return deleteExpense(session.user.id, data.expenseId)
    return deleteExpense(session.user.id, data.expenseId)
  })

export type UpdateExpenseInput = {
  category?: string
  amount?: number
  date?: Date
  description?: string
  batchId?: string | null
  supplierId?: string | null
  isRecurring?: boolean
}

export async function updateExpense(
  userId: string,
  expenseId: string,
  data: UpdateExpenseInput,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  const farmIds = await getUserFarms(userId)

  const expense = await db
    .selectFrom('expenses')
    .select(['id', 'farmId'])
    .where('id', '=', expenseId)
    .executeTakeFirst()

  if (!expense) throw new Error('Expense not found')
  if (!farmIds.includes(expense.farmId)) throw new Error('Unauthorized')

  // We are not handling complex feed inventory restoration on update for now
  // Assumes simple field updates.

  await db
    .updateTable('expenses')
    .set({
      ...data,
      amount: data.amount?.toString(),
    })
    .where('id', '=', expenseId)
    .execute()

  await db
    .updateTable('expenses')
    .set({
      ...data,
      amount: data.amount?.toString(),
    })
    .where('id', '=', expenseId)
    .execute()

  const { logAudit } = await import('~/lib/logging/audit')
  await logAudit({
    userId,
    action: 'update',
    entityType: 'expense',
    entityId: expenseId,
    details: data,
  })

  return true
}

export const updateExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { expenseId: string; data: UpdateExpenseInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return updateExpense(session.user.id, data.expenseId, data.data)
  })

/**
 * Get expenses for a user - optionally filtered by farm (All Farms Support)
 */
export async function getExpenses(
  userId: string,
  farmId?: string,
  options?: {
    startDate?: Date
    endDate?: Date
    category?: string
  },
) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) throw new Error('Access denied')
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  let query = db
    .selectFrom('expenses')
    .leftJoin('suppliers', 'suppliers.id', 'expenses.supplierId')
    .leftJoin('batches', 'batches.id', 'expenses.batchId')
    .leftJoin('farms', 'farms.id', 'expenses.farmId')
    .select([
      'expenses.id',
      'expenses.farmId',
      'expenses.category',
      'expenses.amount',
      'expenses.date',
      'expenses.description',
      'expenses.supplierId',
      'expenses.batchId',
      'expenses.isRecurring',
      'expenses.createdAt',
      'suppliers.name as supplierName',
      'batches.species as batchSpecies',
      'batches.livestockType as batchType',
      'farms.name as farmName',
    ])
    .where('expenses.farmId', 'in', targetFarmIds)

  if (options?.startDate) {
    query = query.where('expenses.date', '>=', options.startDate)
  }
  if (options?.category) {
    query = query.where('expenses.category', '=', options.category)
  }

  return query.orderBy('expenses.date', 'desc').execute()
}

export async function getExpensesForFarm(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    category?: string
  },
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  return query.orderBy('expenses.date', 'desc').execute()
}

export async function getExpensesSummary(
  userId: string,
  farmId?: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) throw new Error('Access denied')
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) {
      return {
        byCategory: {},
        total: { count: 0, amount: 0 },
      }
    }
  }

  let query = db
    .selectFrom('expenses')
    .select([
      'category',
      db.fn.count('id').as('count'),
      db.fn.sum<string>('amount').as('totalAmount'),
    ])
    .where('farmId', 'in', targetFarmIds)
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
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

/**
 * Paginated expenses query with sorting and search
 */
export interface PaginatedQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  farmId?: string
  batchId?: string
  category?: string
}

export interface PaginatedResult<T> {
  data: Array<T>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getExpensesPaginated(
  userId: string,
  query: PaginatedQuery = {},
): Promise<
  PaginatedResult<{
    id: string
    farmId: string
    farmName: string | null
    category: string
    amount: string
    date: Date
    description: string
    supplierName: string | null
    batchSpecies: string | null
    batchType: string | null
    isRecurring: boolean
  }>
> {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')
  const { checkFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const sortBy = query.sortBy || 'date'
  const sortOrder = query.sortOrder || 'desc'
  const search = query.search || ''
  const category = query.category

  // Determine target farms
  let targetFarmIds: Array<string> = []
  if (query.farmId) {
    const hasAccess = await checkFarmAccess(userId, query.farmId)
    if (!hasAccess) throw new Error('Access denied')
    targetFarmIds = [query.farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 }
    }
  }

  // Build base query
  let baseQuery = db
    .selectFrom('expenses')
    .leftJoin('suppliers', 'suppliers.id', 'expenses.supplierId')
    .leftJoin('batches', 'batches.id', 'expenses.batchId')
    .leftJoin('farms', 'farms.id', 'expenses.farmId')
    .where('expenses.farmId', 'in', targetFarmIds)

  // Apply search filter
  if (search) {
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('expenses.description', 'ilike', `%${search}%`),
        eb('suppliers.name', 'ilike', `%${search}%`),
        eb('batches.species', 'ilike', `%${search}%`),
      ]),
    )
  }

  // Apply category filter
  if (category) {
    baseQuery = baseQuery.where('expenses.category', '=', category as any)
  }

  // Apply batchId filter
  if (query.batchId) {
    baseQuery = baseQuery.where('expenses.batchId', '=', query.batchId)
  }

  // Get total count
  const countResult = await baseQuery
    .select(sql<number>`count(*)`.as('count'))
    .executeTakeFirst()
  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / pageSize)

  // Apply sorting
  const sortColumn =
    sortBy === 'amount'
      ? 'expenses.amount'
      : sortBy === 'category'
        ? 'expenses.category'
        : sortBy === 'description'
          ? 'expenses.description'
          : sortBy === 'supplierName'
            ? 'suppliers.name'
            : 'expenses.date'

  let dataQuery = db
    .selectFrom('expenses')
    .leftJoin('suppliers', 'suppliers.id', 'expenses.supplierId')
    .leftJoin('batches', 'batches.id', 'expenses.batchId')
    .leftJoin('farms', 'farms.id', 'expenses.farmId')
    .select([
      'expenses.id',
      'expenses.farmId',
      'expenses.category',
      'expenses.amount',
      'expenses.date',
      'expenses.description',
      'expenses.isRecurring',
      'suppliers.name as supplierName',
      'batches.species as batchSpecies',
      'batches.livestockType as batchType',
      'farms.name as farmName',
    ])
    .where('expenses.farmId', 'in', targetFarmIds)

  // Re-apply filters
  if (search) {
    dataQuery = dataQuery.where((eb) =>
      eb.or([
        eb('expenses.description', 'ilike', `%${search}%`),
        eb('suppliers.name', 'ilike', `%${search}%`),
        eb('batches.species', 'ilike', `%${search}%`),
      ]),
    )
  }
  if (category) {
    dataQuery = dataQuery.where('expenses.category', '=', category as any)
  }
  if (query.batchId) {
    dataQuery = dataQuery.where('expenses.batchId', '=', query.batchId)
  }

  // Apply sorting and pagination
  const data = await dataQuery
    .orderBy(sortColumn as any, sortOrder)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return {
    data: data.map((d) => ({
      ...d,
      farmName: d.farmName || null,
      supplierName: d.supplierName || null,
      batchSpecies: d.batchSpecies || null,
      batchType: d.batchType || null,
    })),
    total,
    page,
    pageSize,
    totalPages,
  }
}

// Server function for paginated expenses
export const getExpensesPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return getExpensesPaginated(session.user.id, data)
  })
