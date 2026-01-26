import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type {
  CreateExpenseInput,
  ExpenseQuery,
  PaginatedResult,
  UpdateExpenseInput,
} from './types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

// Re-export constants for backward compatibility
export { EXPENSE_CATEGORIES, type ExpenseCategory } from './constants'

// Re-export types for backward compatibility
export type {
  ExpenseInsert,
  ExpenseUpdate,
  ExpenseFilters,
  ExpenseWithJoins,
  FeedInventory,
} from './repository'

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
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { verifyFarmAccess } = await import('~/features/auth/utils')

  // Import service functions for business logic
  const {
    validateExpenseData,
    calculateNewFeedInventory,
    shouldUpdateFeedInventory,
  } = await import('./service')

  // Import repository functions for database operations
  const {
    insertExpense,
    getFeedInventory,
    updateFeedInventory,
    insertFeedInventory,
  } = await import('./repository')

  try {
    await verifyFarmAccess(userId, input.farmId)

    // Business logic: validate expense data
    const validationError = validateExpenseData(input)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', {
        metadata: { error: validationError },
      })
    }

    const result = await db.transaction().execute(async (tx) => {
      // 1. Record the expense
      const expenseId = await insertExpense(tx, {
        farmId: input.farmId,
        batchId: input.batchId ?? null,
        category: input.category,
        amount: input.amount.toString(),
        date: input.date,
        description: input.description,
        supplierId: input.supplierId || null,
        isRecurring: input.isRecurring || false,
      })

      // 2. If it's a feed expense with quantity, update inventory
      if (
        shouldUpdateFeedInventory(
          input.category,
          input.feedType,
          input.feedQuantityKg,
        )
      ) {
        const existing = await getFeedInventory(
          tx,
          input.farmId,
          input.feedType!,
        )

        if (existing) {
          // Business logic: calculate new quantity
          const newQuantity = calculateNewFeedInventory(
            existing.quantityKg,
            input.feedQuantityKg!,
          )
          await updateFeedInventory(tx, existing.id, newQuantity.toString())
        } else {
          // Create new inventory record
          await insertFeedInventory(tx, {
            farmId: input.farmId,
            feedType: input.feedType!,
            quantityKg: input.feedQuantityKg!,
            minThresholdKg: '10.00', // Default threshold
          })
        }
      }

      return expenseId
    })

    return result
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
  .inputValidator(
    z.object({
      expense: z.object({
        farmId: z.string().uuid(),
        category: z.enum([
          'feed',
          'medicine',
          'equipment',
          'utilities',
          'labor',
          'transport',
          'livestock',
          'livestock_chicken',
          'livestock_fish',
          'maintenance',
          'marketing',
          'other',
        ]),
        description: z.string(),
        amount: z.number().nonnegative(),
        date: z.coerce.date(),
        supplierId: z.string().uuid().optional(),
        notes: z.string().optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createExpense(session.user.id, data.expense)
  })

/**
 * Permanently remove an expense record.
 *
 * @param userId - ID of the user requesting deletion
 * @param expenseId - ID of the expense to delete
 * @throws {Error} If expense not found or user lacks permission
 */
export async function deleteExpense(userId: string, expenseId: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { getUserFarms } = await import('~/features/auth/utils')
  const { deleteExpense: deleteExpenseRecord, getExpenseFarmId } =
    await import('./repository')

  try {
    const userFarms = await getUserFarms(userId)
    const farmIds = userFarms

    const expenseFarmId = await getExpenseFarmId(db, expenseId)

    if (!expenseFarmId) {
      throw new AppError('EXPENSE_NOT_FOUND', {
        metadata: { resource: 'Expense', id: expenseId },
      })
    }

    if (!farmIds.includes(expenseFarmId)) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: expenseFarmId },
      })
    }

    await deleteExpenseRecord(db, expenseId)

    return true
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
  .inputValidator(z.object({ expenseId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteExpense(session.user.id, data.expenseId)
  })

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
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { getUserFarms } = await import('~/features/auth/utils')
  const { validateUpdateData } = await import('./service')
  const { updateExpense: updateExpenseRecord, getExpenseFarmId } =
    await import('./repository')

  try {
    const farmIds = await getUserFarms(userId)
    const expenseFarmId = await getExpenseFarmId(db, expenseId)

    if (!expenseFarmId) {
      throw new AppError('EXPENSE_NOT_FOUND', {
        metadata: { resource: 'Expense', id: expenseId },
      })
    }

    if (!farmIds.includes(expenseFarmId)) {
      throw new AppError('ACCESS_DENIED', {
        metadata: { farmId: expenseFarmId },
      })
    }

    // Business logic: validate update data
    const validationError = validateUpdateData(data)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', {
        metadata: { error: validationError },
      })
    }

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

    await updateExpenseRecord(db, expenseId, updateData)

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
    z.object({
      expenseId: z.string().uuid(),
      data: z.object({
        category: z
          .enum([
            'feed',
            'medicine',
            'equipment',
            'utilities',
            'labor',
            'transport',
            'livestock',
            'livestock_chicken',
            'livestock_fish',
            'maintenance',
            'marketing',
            'other',
          ])
          .optional(),
        description: z.string().optional(),
        amount: z.number().nonnegative().optional(),
        date: z.coerce.date().optional(),
        supplierId: z.string().uuid().optional(),
        notes: z.string().optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateExpense(session.user.id, data.expenseId, data.data)
  })

/**
 * Retrieve a list of expenses for a user.
 * Supports filtering by a single farm or retrieving all expenses across all accessible farms.
 *
 * @param userId - ID of the user requesting data
 * @param farmId - Optional farm filter (returns all accessible if omitted)
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
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { getExpensesByFarm } = await import('./repository')

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

    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    return await getExpensesByFarm(
      db,
      targetFarmIds,
      options
        ? {
            startDate: options.startDate,
            endDate: options.endDate,
            category: options.category,
          }
        : undefined,
    )
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
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { getExpensesByFarm } = await import('./repository')

  try {
    await verifyFarmAccess(userId, farmId)

    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const expenses = await getExpensesByFarm(db, [farmId], {
      startDate: options?.startDate,
      endDate: options?.endDate,
      category: options?.category,
    })

    // Apply limit if provided
    if (options?.limit) {
      return expenses.slice(0, options.limit)
    }

    return expenses
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
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { getExpensesSummary: getExpensesSummaryFromDb } =
    await import('./repository')
  const { buildExpensesSummary } = await import('./service')

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

    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const results = await getExpensesSummaryFromDb(db, targetFarmIds, {
      startDate: options?.startDate,
      endDate: options?.endDate,
    })

    // Business logic: build summary from raw results
    return buildExpensesSummary(results)
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
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { getTotalExpenses: getTotalExpensesFromDb } =
    await import('./repository')

  try {
    await verifyFarmAccess(userId, farmId)

    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const total = await getTotalExpensesFromDb(db, [farmId], {
      startDate: options?.startDate,
      endDate: options?.endDate,
    })

    return parseFloat(total)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to calculate total expenses',
      cause: error,
    })
  }
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
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { getExpensesPaginated: getExpensesPaginatedFromDb } =
    await import('./repository')

  try {
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
        return {
          data: [],
          total: 0,
          page: query.page || 1,
          pageSize: query.pageSize || 10,
          totalPages: 0,
        }
      }
    }

    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    return await getExpensesPaginatedFromDb(db, targetFarmIds, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.search,
      category: query.category,
      batchId: query.batchId,
    })
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
  .inputValidator(
    z.object({
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().max(100).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      search: z.string().optional(),
      farmId: z.string().uuid().optional(),
      category: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getExpensesPaginated(session.user.id, data)
  })

/**
 * Server function to retrieve expenses summary by category.
 */
export const getExpensesSummaryFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getExpensesSummary(session.user.id, data.farmId, {
      startDate: data.startDate,
      endDate: data.endDate,
    })
  })

export type { CreateExpenseInput, UpdateExpenseInput } from './types'
