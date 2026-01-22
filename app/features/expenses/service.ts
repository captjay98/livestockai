/**
 * Pure business logic for expense operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateExpenseInput, UpdateExpenseInput } from './server'

/**
 * Calculate new feed inventory quantity when adding stock.
 * Pure function - no side effects, easily testable.
 *
 * @param existingQty - Current quantity in inventory (as decimal string)
 * @param addedQty - Quantity being added (in kg)
 * @returns New quantity as a number (never negative)
 *
 * @example
 * ```ts
 * const newQty = calculateNewFeedInventory('100.50', 50)
 * // Returns: 150.50
 * ```
 */
export function calculateNewFeedInventory(
  existingQty: string,
  addedQty: number,
): number {
  const current = parseFloat(existingQty)
  if (current < 0 || addedQty < 0) {
    return 0
  }
  return current + addedQty
}

/**
 * Validate expense data before creation.
 * Returns validation error message or null if valid.
 *
 * @param data - Expense creation data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateExpenseData({
 *   farmId: 'farm-1',
 *   category: 'feed',
 *   amount: 100.50,
 *   date: new Date(),
 *   description: 'Chicken feed'
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateExpenseData({
 *   ...sameData,
 *   amount: -10
 * })
 * // Returns: "Amount cannot be negative"
 * ```
 */
export function validateExpenseData(data: CreateExpenseInput): string | null {
  if (!data.farmId || data.farmId.trim() === '') {
    return 'Farm ID is required'
  }

  if (!data.description || data.description.trim() === '') {
    return 'Description is required'
  }

  if (data.amount < 0) {
    return 'Amount cannot be negative'
  }

  if (isNaN(data.date.getTime())) {
    return 'Date is required'
  }

  // Validate feed-specific fields
  if (data.category === 'feed') {
    if (data.feedQuantityKg !== undefined && data.feedQuantityKg < 0) {
      return 'Feed quantity cannot be negative'
    }
  }

  return null
}

/**
 * Build expenses summary by category.
 * Transforms raw expense records into a categorized summary.
 *
 * @param expenses - Array of expense records with category and amount
 * @returns Object with categorized totals and overall summary
 *
 * @example
 * ```ts
 * const summary = buildExpensesSummary([
 *   { category: 'feed', amount: '100.00' },
 *   { category: 'feed', amount: '50.00' },
 *   { category: 'medicine', amount: '25.00' }
 * ])
 * // Returns: {
 * //   byCategory: { feed: { count: 2, amount: 150.00 }, medicine: { count: 1, amount: 25.00 } },
 * //   total: { count: 3, amount: 175.00 }
 * // }
 * ```
 */
export function buildExpensesSummary(
  expenses: Array<{
    category: string
    amount: string
    count?: string | number
  }>,
): {
  byCategory: Record<string, { count: number; amount: number }>
  total: { count: number; amount: number }
} {
  const summary: Record<string, { count: number; amount: number }> = {}
  let totalCount = 0
  let totalAmount = 0

  for (const expense of expenses) {
    const count = expense.count ? Number(expense.count) : 1
    const amount = parseFloat(expense.amount)

    const key = expense.category
    if (!(key in summary)) {
      summary[key] = { count: 0, amount: 0 }
    }

    const entry = summary[key]
    entry.count += count
    entry.amount += amount
    totalCount += count
    totalAmount += amount
  }

  return {
    byCategory: summary,
    total: { count: totalCount, amount: totalAmount },
  }
}

/**
 * Map sort column from UI to database column name.
 * Ensures only valid columns are used for sorting.
 *
 * @param sortBy - The sort column from UI
 * @returns Database column name for sorting
 */
export function mapSortColumnToDbColumn(sortBy: string): string {
  const columnMap: Record<string, string> = {
    amount: 'expenses.amount',
    category: 'expenses.category',
    description: 'expenses.description',
    supplierName: 'suppliers.name',
    date: 'expenses.date',
  }

  return columnMap[sortBy] || 'expenses.date'
}

/**
 * Transform paginated expense results.
 * Ensures null values are properly handled for joined fields.
 *
 * @param expenses - Raw expense results from database
 * @returns Transformed expenses with null-safe fields
 */
export function transformPaginatedResults(
  expenses: Array<{
    id: string
    farmId: string
    category: string
    amount: string
    date: Date
    description: string
    isRecurring: boolean
    supplierName?: string | null
    batchSpecies?: string | null
    batchType?: string | null
    farmName?: string | null
  }>,
): Array<{
  id: string
  farmId: string
  category: string
  amount: string
  date: Date
  description: string
  isRecurring: boolean
  farmName: string | null
  supplierName: string | null
  batchSpecies: string | null
  batchType: string | null
}> {
  return expenses.map((expense) => ({
    ...expense,
    farmName: expense.farmName ?? null,
    supplierName: expense.supplierName ?? null,
    batchSpecies: expense.batchSpecies ?? null,
    batchType: expense.batchType ?? null,
  }))
}

/**
 * Validate expense update data.
 * Returns validation error message or null if valid.
 *
 * @param data - Expense update data to validate
 * @returns Validation error message, or null if data is valid
 */
export function validateUpdateData(data: UpdateExpenseInput): string | null {
  if (data.amount !== undefined && data.amount < 0) {
    return 'Amount cannot be negative'
  }

  if (data.date !== undefined && isNaN(data.date.getTime())) {
    return 'Date is invalid'
  }

  if (data.description !== undefined && data.description.trim() === '') {
    return 'Description cannot be empty'
  }

  return null
}

/**
 * Check if feed inventory update is needed.
 * Determines if an expense requires inventory tracking.
 *
 * @param category - Expense category
 * @param feedType - Optional feed type
 * @param feedQuantityKg - Optional feed quantity
 * @returns True if inventory should be updated
 */
export function shouldUpdateFeedInventory(
  category: string,
  feedType?: string,
  feedQuantityKg?: number,
): boolean {
  return (
    category === 'feed' &&
    feedType !== undefined &&
    feedQuantityKg !== undefined &&
    feedQuantityKg > 0
  )
}
