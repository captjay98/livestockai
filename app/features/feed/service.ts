/**
 * Pure business logic for feed operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateFeedRecordInput } from './server'

/**
 * Feed summary statistics by type
 */
export interface FeedSummaryByType {
    quantityKg: number
    cost: number
}

/**
 * Feed summary result
 */
export interface FeedSummary {
    totalQuantityKg: number
    totalCost: number
    byType: Record<string, FeedSummaryByType>
    recordCount: number
}

/**
 * Feed statistics result
 */
export interface FeedStats {
    totalQuantityKg: number
    totalCost: number
    recordCount: number
}

/**
 * Calculate new inventory quantity after deduction
 *
 * @param existing - Current inventory quantity as string (from DB)
 * @param deducted - Quantity to deduct
 * @returns New quantity (never negative)
 *
 * @example
 * ```ts
 * const newQty = calculateNewInventoryQuantity('100.50', 25)
 * // Returns: 75.5
 * ```
 */
export function calculateNewInventoryQuantity(
    existing: string,
    deducted: number,
): number {
    const current = parseFloat(existing)
    const newQuantity = current - deducted
    return Math.max(0, newQuantity)
}

/**
 * Validate feed record data before creation
 *
 * @param data - Feed record data to validate
 * @param batchId - Optional batch ID to validate
 * @returns Validation error message, or null if valid
 *
 * @example
 * ```ts
 * const error = validateFeedRecord({
 *   batchId: 'batch-1',
 *   feedType: 'starter',
 *   quantityKg: 25,
 *   cost: 15000,
 *   date: new Date()
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateFeedRecord({
 *   ...sameData,
 *   quantityKg: 0
 * })
 * // Returns: "Quantity must be greater than 0"
 * ```
 */
export function validateFeedRecord(
    data: CreateFeedRecordInput,
    batchId?: string,
): string | null {
    if (batchId === '' || batchId?.trim() === '') {
        return 'Batch ID is required'
    }

    if (data.batchId === '' || data.batchId.trim() === '') {
        return 'Batch ID is required'
    }

    if (data.quantityKg <= 0) {
        return 'Quantity must be greater than 0'
    }

    if (data.cost < 0) {
        return 'Cost cannot be negative'
    }

    if (isNaN(data.date.getTime())) {
        return 'Date is required'
    }

    const validFeedTypes = [
        'starter',
        'grower',
        'finisher',
        'layer_mash',
        'fish_feed',
        'cattle_feed',
        'goat_feed',
        'sheep_feed',
        'hay',
        'silage',
        'bee_feed',
    ] as const

    if (!validFeedTypes.includes(data.feedType as any)) {
        return 'Invalid feed type'
    }

    return null
}

/**
 * Build feed summary from raw records
 *
 * @param records - Array of feed records with quantityKg and cost
 * @returns Feed summary object
 *
 * @example
 * ```ts
 * const summary = buildFeedSummary([
 *   { feedType: 'starter', quantityKg: '25', cost: '15000' },
 *   { feedType: 'starter', quantityKg: '30', cost: '18000' }
 * ])
 * // Returns: {
 * //   totalQuantityKg: 55,
 * //   totalCost: 33000,
 * //   byType: { starter: { quantityKg: 55, cost: 33000 } },
 * //   recordCount: 2
 * // }
 * ```
 */
export function buildFeedSummary(
    records: Array<{ feedType: string; quantityKg: string; cost: string }>,
): FeedSummary {
    const totalQuantityKg = records.reduce(
        (sum, r) => sum + parseFloat(r.quantityKg),
        0,
    )
    const totalCost = records.reduce((sum, r) => sum + parseFloat(r.cost), 0)

    const byType: Record<string, FeedSummaryByType> = {}
    for (const record of records) {
        const key = record.feedType
        if (!(key in byType)) {
            byType[key] = {
                quantityKg: parseFloat(record.quantityKg),
                cost: parseFloat(record.cost),
            }
        } else {
            const entry = byType[key]
            entry.quantityKg += parseFloat(record.quantityKg)
            entry.cost += parseFloat(record.cost)
        }
    }

    return {
        totalQuantityKg,
        totalCost,
        byType,
        recordCount: records.length,
    }
}

/**
 * Calculate Feed Conversion Ratio (FCR)
 * FCR = Total Feed Consumed (kg) / Total Weight Gain (kg)
 * Lower FCR indicates better feed efficiency
 *
 * @param totalFeedKg - Total feed consumed in kilograms
 * @param weightGainKg - Total weight gain in kilograms
 * @param initialQuantity - Initial batch quantity (for validation)
 * @returns FCR as number rounded to 2 decimals, or null if calculation is not possible
 *
 * @example
 * ```ts
 * const fcr = calculateFCR(150, 100, 100)
 * // Returns: 1.5 (1.5 kg feed per 1 kg weight gain)
 *
 * const invalidFcr = calculateFCR(100, 0, 100)
 * // Returns: null (no weight gain)
 * ```
 */
export function calculateFCR(
    totalFeedKg: number,
    weightGainKg: number,
    initialQuantity: number,
): number | null {
    if (totalFeedKg <= 0 || weightGainKg <= 0 || initialQuantity <= 0) {
        return null
    }
    const fcr = totalFeedKg / weightGainKg
    return Math.round(fcr * 100) / 100
}

/**
 * Build feed statistics from raw records
 *
 * @param records - Array of feed records with quantityKg and cost
 * @returns Feed stats object
 *
 * @example
 * ```ts
 * const stats = buildFeedStats([
 *   { quantityKg: '25', cost: '15000' },
 *   { quantityKg: '30', cost: '18000' }
 * ])
 * // Returns: {
 * //   totalQuantityKg: 55,
 * //   totalCost: 33000,
 * //   recordCount: 2
 * // }
 * ```
 */
export function buildFeedStats(
    records: Array<{ quantityKg: string; cost: string }>,
): FeedStats {
    // Use integer arithmetic to avoid floating-point precision issues
    // Multiply by 100, sum, then divide by 100
    const totalQuantityCents = records.reduce(
        (sum, r) => sum + Math.round(parseFloat(r.quantityKg) * 100),
        0,
    )
    const totalCostCents = records.reduce(
        (sum, r) => sum + Math.round(parseFloat(r.cost) * 100),
        0,
    )

    return {
        totalQuantityKg: totalQuantityCents / 100,
        totalCost: totalCostCents / 100,
        recordCount: records.length,
    }
}

/**
 * Map sort column from UI to database column
 *
 * @param sortBy - Sort column from UI
 * @returns Database column name
 *
 * @example
 * ```ts
 * mapSortColumnToDbColumn('date')
 * // Returns: 'feed_records.date'
 *
 * mapSortColumnToDbColumn('cost')
 * // Returns: 'feed_records.cost'
 * ```
 */
export function mapSortColumnToDbColumn(sortBy: string): string {
    const sortMap: Record<string, string> = {
        date: 'feed_records.date',
        cost: 'feed_records.cost',
        quantityKg: 'feed_records.quantityKg',
        feedType: 'feed_records.feedType',
    }
    return sortMap[sortBy] || `feed_records.${sortBy}`
}

/**
 * Validate feed record update data
 *
 * @param data - Partial feed record data to validate
 * @returns Validation error message, or null if valid
 *
 * @example
 * ```ts
 * const error = validateUpdateData({
 *   quantityKg: 30,
 *   cost: 18000
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateUpdateData({
 *   quantityKg: -5
 * })
 * // Returns: "Quantity must be greater than 0"
 * ```
 */
export function validateUpdateData(
    data: Partial<CreateFeedRecordInput>,
): string | null {
    if (data.quantityKg !== undefined && data.quantityKg <= 0) {
        return 'Quantity must be greater than 0'
    }

    if (data.cost !== undefined && data.cost < 0) {
        return 'Cost cannot be negative'
    }

    if (data.date !== undefined && isNaN(data.date.getTime())) {
        return 'Date is invalid'
    }

    const validFeedTypes = [
        'starter',
        'grower',
        'finisher',
        'layer_mash',
        'fish_feed',
        'cattle_feed',
        'goat_feed',
        'sheep_feed',
        'hay',
        'silage',
        'bee_feed',
    ] as const

    if (
        data.feedType !== undefined &&
        !validFeedTypes.includes(data.feedType as any)
    ) {
        return 'Invalid feed type'
    }

    return null
}
