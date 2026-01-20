import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

// Re-export constants for backward compatibility
export { EXPENSE_CATEGORIES, type ExpenseCategory } from './constants'

/**
 * Data structure for recording a new financial expense.
 * Supports linking to specific batches, suppliers, and feed inventory.
 */
export interface CreateExpenseInput {
  /** ID of the farm incurred the expense */
  farmId: string
  /** Optional ID of a specific livestock batch for cost attribution */
  batchId?: string | null
  /** Specific expense classification */
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
  /** Monetary amount in system currency */
  amount: number
  /** Date the expense occurred */
  date: Date
  /** Brief description or item name */
  description: string
  /** Optional ID of the supplier for sourcing history */
  supplierId?: string | null
  /** Whether this is a recurring monthly/weekly cost */
  isRecurring?: boolean
  /** Specific feed category when category is 'feed' */
  feedType?: 'starter' | 'grower' | 'finisher' | 'layer_mash' | 'fish_feed'
  /** Feed weight in kilograms for inventory tracking */
  feedQuantityKg?: number
}

/**
 * Record a new expense in a transaction.
 * If the expense is for livestock feed and includes quantity, the feed inventory is automatically updated.
 *
 * @param userId - ID of the user creating the expense
 * @param input - Expense details and optional feed tracking data
 * @returns Promise resolving to the new expense ID
 * @throws {Error} If user does not have access to the specified farm
 */
export async function createExpense(
  userId: string,
  input: CreateExpenseInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
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

    // Log audit
    const { logAudit } = await import('~/features/logging/audit')
    await logAudit({
      userId,
      action: 'create',
      entityType: 'expense',
      entityId: result.id,
      details: input,
    })

    return result.id
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create expense',
      cause: error,
    })
  }
}

/**
 * Server function to create an expense record.
 */
export const createExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { expense: CreateExpenseInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createExpense(session.user.id, data.expense)
  })

/**
 * Delete an expense record
 */
/**
 * Permanently remove an expense record.
 *
 * @param userId - ID of the user requesting deletion
 * @param expenseId - ID of the expense to delete
 * @throws {Error} If expense not found or user lacks permission
 */
export async function deleteExpense(userId: string, expenseId: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

  try {
    // getUserFarms returns string[] of accessible farm IDs
    const userFarms = await getUserFarms(userId)
    const farmIds = userFarms

    const expense = await db
      .selectFrom('expenses')
      .select(['id', 'farmId'])
      .where('id', '=', expenseId)
      .executeTakeFirst()

    if (!expense) {
      throw new AppError('EXPENSE_NOT_FOUND', {
        metadata: { resource: 'Expense', id: expenseId },
      })
    }

    if (!farmIds.includes(expense.farmId)) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: expense.farmId },
      })
    }

    await db.deleteFrom('expenses').where('id', '=', expenseId).execute()

    const { logAudit } = await import('~/features/logging/audit')
    await logAudit({
      userId,
      action: 'delete',
      entityType: 'expense',
      entityId: expenseId,
      details: { message: 'Expense deleted', snapshot: expense },
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete expense',
      cause: error,
    })
  }
}

/**
 * Server function to delete an expense record.
 */
export const deleteExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { expenseId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteExpense(session.user.id, data.expenseId)
  })

/**
 * Data structure for updating an existing expense.
 */
export interface UpdateExpenseInput {
  /** Updated category */
  category?: string
  /** Updated amount */
  amount?: number
  /** Updated date */
  date?: Date
  /** Updated description */
  description?: string
  /** Updated batch association */
  batchId?: string | null
  /** Updated supplier association */
  supplierId?: string | null
  /** Updated recurring flag */
  isRecurring?: boolean
}

/**
 * Update an existing expense record.
 *
 * @param userId - ID of the user performing the update
 * @param expenseId - ID of the expense to update
 * @param data - Partial update parameters
 * @returns Promise resolving to true on successful update
 * @throws {Error} If expense not found or user unauthorized
 */
export async function updateExpense(
  userId: string,
  expenseId: string,
  data: UpdateExpenseInput,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')

  try {
    const farmIds = await getUserFarms(userId)

    const expense = await db
      .selectFrom('expenses')
      .select(['id', 'farmId'])
      .where('id', '=', expenseId)
      .executeTakeFirst()

    if (!expense)
      throw new AppError('EXPENSE_NOT_FOUND', {
        metadata: { resource: 'Expense', id: expenseId },
      })
    if (!farmIds.includes(expense.farmId))
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: expense.farmId },
      })

    // We are not handling complex feed inventory restoration on update for now
    // Assumes simple field updates.

    const updateData: Record<string, unknown> = {}
    if (data.category !== undefined) updateData.category = data.category
    if (data.amount !== undefined) updateData.amount = data.amount.toString()
    if (data.date !== undefined) updateData.date = data.date
    if (data.description !== undefined)
      updateData.description = data.description
    if (data.batchId !== undefined) updateData.batchId = data.batchId
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId
    if (data.isRecurring !== undefined)
      updateData.isRecurring = data.isRecurring

    await db
      .updateTable('expenses')
      .set(updateData)
      .where('id', '=', expenseId)
      .execute()

    const { logAudit } = await import('~/features/logging/audit')
    await logAudit({
      userId,
      action: 'update',
      entityType: 'expense',
      entityId: expenseId,
      details: data,
    })

    return true
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update expense',
      cause: error,
    })
  }
}

/**
 * Server function to update an expense record.
 */
export const updateExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { expenseId: string; data: UpdateExpenseInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateExpense(session.user.id, data.expenseId, data.data)
  })

/**
 * Get expenses for a user - optionally filtered by farm (All Farms Support)
 */
/**
 * Retrieve a list of expenses for a user.
 * Supports filtering by a single farm or retrieving all expenses across all accessible farms.
 *
 * @param userId - ID of the user requesting data
 * @param farmId - Optional farm filter (returns allaccessible if omitted)
 * @param options - Additional filters (date range, category)
 * @returns Promise resolving to an array of expense records with joined entity names
 * @throws {Error} If user does not have access to the specified farm
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
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')

  try {
    let targetFarmIds: Array<string> = []

    if (farmId) {
      const hasAccess = await checkFarmAccess(userId, farmId)
      if (!hasAccess)
        throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
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
      query = query.where('expenses.category', '=', options.category as any)
    }

    return await query.orderBy('expenses.date', 'desc').execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch expenses',
      cause: error,
    })
  }
}

/**
 * Retrieve a limited list of expenses for a specific farm.
 *
 * @param userId - ID of the user requesting data
 * @param farmId - ID of the target farm
 * @param options - Pagination and filtering options (limit, category, dates)
 * @returns Promise resolving to an array of expenses
 * @throws {Error} If user lacks access to the farm
 */
export async function getExpensesForFarm(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    category?: string
    limit?: number
  },
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
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

    return await query.orderBy('expenses.date', 'desc').execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch expenses',
      cause: error,
    })
  }
}

/**
 * Calculate categorized totals for expenses within a specific time period.
 * Useful for building financial reports and dashboard charts.
 *
 * @param userId - ID of the requesting user
 * @param farmId - Optional farm filter
 * @param options - Start and end date for the summary
 * @returns Promise resolving to an object containing categorized totals and overall sum
 */
export async function getExpensesSummary(
  userId: string,
  farmId?: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')

  try {
    let targetFarmIds: Array<string> = []

    if (farmId) {
      const hasAccess = await checkFarmAccess(userId, farmId)
      if (!hasAccess)
        throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch expenses summary',
      cause: error,
    })
  }
}

/**
 * Calculate the total aggregated spend for a specific farm.
 *
 * @param userId - ID of the requesting user
 * @param farmId - ID of the farm
 * @param options - Optional date range for the total
 * @returns Promise resolving to the total currency amount
 * @throws {Error} If user lacks access to the farm
 */
export async function getTotalExpenses(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
): Promise<number> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  try {
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to calculate total expenses',
      cause: error,
    })
  }
}

/**
 * Filter and pagination parameters for querying expenses.
 */
export interface ExpenseQuery extends BasePaginatedQuery {
  /** Filter by a specific livestock batch */
  batchId?: string
  /** Filter by an expense category */
  category?: string
}

/**
 * Retrieve a paginated list of expenses with full text search and advanced filters.
 *
 * @param userId - ID of the user requesting data
 * @param query - Sorting, pagination, and filter parameters
 * @returns Promise resolving to a paginated set of expense records with joined entity names
 */
export async function getExpensesPaginated(
  userId: string,
  query: ExpenseQuery = {},
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
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')

  try {
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
      if (!hasAccess)
        throw new AppError('ACCESS_DENIED', {
          metadata: { farmId: query.farmId },
        })
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch paginated expenses',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve paginated expense records.
 */
export const getExpensesPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ExpenseQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getExpensesPaginated(session.user.id, data)
  })
