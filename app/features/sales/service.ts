/**
 * Pure business logic for sales operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateSaleInput, UpdateSaleInput } from './types'
import type { SaleWithJoins } from './repository'
import { multiply, toDbString } from '~/features/settings/currency'

/**
 * Calculate sale total amount from quantity and unit price
 * Pure function - no side effects, easily testable
 *
 * @param quantity - Number of units sold
 * @param unitPrice - Price per unit in system currency
 * @returns Total cost as decimal string for database storage
 *
 * @example
 * ```ts
 * const total = calculateSaleTotal(100, 5.50)
 * // Returns: "550.00"
 * ```
 */
export function calculateSaleTotal(
    quantity: number,
    unitPrice: number,
): string {
    if (quantity <= 0 || unitPrice < 0) {
        return toDbString(0)
    }
    return toDbString(multiply(quantity, unitPrice))
}

/**
 * Validate sale data before creation
 * Returns validation error message or null if valid
 *
 * @param data - Sale creation data to validate
 * @param batchQuantity - Current batch quantity (null if no batch)
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateSaleData({
 *   farmId: 'farm-1',
 *   livestockType: 'poultry',
 *   quantity: 50,
 *   unitPrice: 5.50,
 *   date: new Date()
 * }, 100)
 * // Returns: null (valid)
 *
 * const invalidError = validateSaleData({
 *   ...sameData,
 *   quantity: 0
 * }, 100)
 * // Returns: "Quantity must be greater than 0"
 * ```
 */
export function validateSaleData(
    data: CreateSaleInput,
    batchQuantity: number | null,
): string | null {
    if (data.farmId === '' || data.farmId.trim() === '') {
        return 'Farm ID is required'
    }

    if (data.quantity <= 0) {
        return 'Quantity must be greater than 0'
    }

    if (data.unitPrice < 0) {
        return 'Unit price cannot be negative'
    }

    if (isNaN(data.date.getTime())) {
        return 'Sale date is required'
    }

    // Validate quantity against batch if provided
    if (
        data.batchId &&
        batchQuantity !== null &&
        data.livestockType !== 'eggs'
    ) {
        if (data.quantity > batchQuantity) {
            return `Insufficient stock in batch. Available: ${batchQuantity}, Requested: ${data.quantity}`
        }
    }

    // Validate payment status if provided
    if (
        data.paymentStatus &&
        !['paid', 'pending', 'partial'].includes(data.paymentStatus)
    ) {
        return 'Invalid payment status'
    }

    // Validate payment method if provided
    if (
        data.paymentMethod &&
        !['cash', 'transfer', 'credit'].includes(data.paymentMethod)
    ) {
        return 'Invalid payment method'
    }

    // Validate unit type if provided
    if (
        data.unitType &&
        !['bird', 'kg', 'crate', 'piece'].includes(data.unitType)
    ) {
        return 'Invalid unit type'
    }

    return null
}

/**
 * Calculate new batch quantity after sale
 *
 * @param currentQuantity - Current quantity in the batch
 * @param soldQuantity - Quantity being sold
 * @returns New quantity (never negative)
 *
 * @example
 * ```ts
 * const newQty = calculateNewBatchQuantity(100, 50)
 * // Returns: 50
 * ```
 */
export function calculateNewBatchQuantity(
    currentQuantity: number,
    soldQuantity: number,
): number {
    const newQuantity = currentQuantity - soldQuantity
    return Math.max(0, newQuantity)
}

/**
 * Determine batch status after a sale
 * Returns 'sold' if all units are sold, 'active' otherwise
 *
 * @param newQuantity - New batch quantity after sale
 * @param soldQuantity - Quantity that was sold
 * @returns 'active' or 'sold'
 *
 * @example
 * ```ts
 * determineBatchStatusAfterSale(0, 100)  // Returns: 'sold'
 * determineBatchStatusAfterSale(50, 50)  // Returns: 'active'
 * ```
 */
export function determineBatchStatusAfterSale(
    newQuantity: number,
    soldQuantity: number,
): 'active' | 'sold' {
    // If all units were sold, mark as sold
    if (soldQuantity > 0 && newQuantity === 0) {
        return 'sold'
    }
    return 'active'
}

/**
 * Calculate quantity difference for update operations
 * Positive means sale quantity increased, negative means decreased
 *
 * @param originalQuantity - Original sale quantity
 * @param newQuantity - New sale quantity
 * @returns Quantity difference
 *
 * @example
 * ```ts
 * calculateQuantityDifference(50, 60)  // Returns: 10 (increase)
 * calculateQuantityDifference(60, 50)  // Returns: -10 (decrease)
 * ```
 */
export function calculateQuantityDifference(
    originalQuantity: number,
    newQuantity: number,
): number {
    return newQuantity - originalQuantity
}

/**
 * Calculate new total amount after update
 *
 * @param quantity - New quantity
 * @param unitPrice - Unit price
 * @returns Total amount as database string
 *
 * @example
 * ```ts
 * const total = calculateNewTotalAmount(60, 5.50)
 * // Returns: "330.00"
 * ```
 */
export function calculateNewTotalAmount(
    quantity: number,
    unitPrice: number,
): string {
    return calculateSaleTotal(quantity, unitPrice)
}

/**
 * Build sales summary from raw sales data
 * Groups by livestock type and calculates totals
 *
 * @param sales - Array of sales with aggregations
 * @returns Summary object with counts, quantities, and revenue by type
 *
 * @example
 * ```ts
 * const summary = buildSalesSummary([
 *   { livestockType: 'poultry', count: '5', totalQuantity: '250', totalRevenue: '1250.00' },
 *   { livestockType: 'fish', count: '3', totalQuantity: '100', totalRevenue: '500.00' }
 * ])
 * ```
 */
export function buildSalesSummary(
    sales: Array<{
        livestockType: 'poultry' | 'fish' | 'eggs'
        count: string | number
        totalQuantity: string | number
        totalRevenue: string
    }>,
): {
    poultry: { count: number; quantity: number; revenue: number }
    fish: { count: number; quantity: number; revenue: number }
    eggs: { count: number; quantity: number; revenue: number }
    total: { count: number; quantity: number; revenue: number }
} {
    const summary = {
        poultry: { count: 0, quantity: 0, revenue: 0 },
        fish: { count: 0, quantity: 0, revenue: 0 },
        eggs: { count: 0, quantity: 0, revenue: 0 },
        total: { count: 0, quantity: 0, revenue: 0 },
    }

    for (const row of sales) {
        const type = row.livestockType as keyof typeof summary
        if (type in summary) {
            const count = Number(row.count)
            const quantity = Number(row.totalQuantity)
            const revenue = parseFloat(row.totalRevenue)

            summary[type] = { count, quantity, revenue }
            summary.total.count += count
            summary.total.quantity += quantity
            summary.total.revenue += revenue
        }
    }

    return summary
}

/**
 * Transform paginated sales results
 * Ensures nullable fields are properly typed
 *
 * @param sales - Raw sales data from database
 * @returns Transformed sales array
 */
export function transformPaginatedResults(
    sales: Array<SaleWithJoins>,
): Array<SaleWithJoins> {
    return sales.map((sale) => ({
        ...sale,
        farmName: sale.farmName ?? null,
        customerName: sale.customerName ?? null,
        batchSpecies: sale.batchSpecies ?? null,
    }))
}

/**
 * Validate update sale data
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 */
export function validateUpdateData(data: UpdateSaleInput): string | null {
    if (data.quantity !== undefined && data.quantity <= 0) {
        return 'Quantity must be greater than 0'
    }

    if (data.unitPrice !== undefined && data.unitPrice < 0) {
        return 'Unit price cannot be negative'
    }

    if (data.date !== undefined && isNaN(data.date.getTime())) {
        return 'Sale date is invalid'
    }

    // Validate payment status if provided
    if (
        data.paymentStatus &&
        !['paid', 'pending', 'partial'].includes(data.paymentStatus)
    ) {
        return 'Invalid payment status'
    }

    // Validate payment method if provided
    if (
        data.paymentMethod &&
        !['cash', 'transfer', 'credit'].includes(data.paymentMethod)
    ) {
        return 'Invalid payment method'
    }

    // Validate unit type if provided
    if (
        data.unitType &&
        !['bird', 'kg', 'crate', 'piece'].includes(data.unitType)
    ) {
        return 'Invalid unit type'
    }

    return null
}
