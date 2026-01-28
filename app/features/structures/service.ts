/**
 * Pure business logic for structure operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateStructureInput, UpdateStructureInput } from './server'

/**
 * Validate structure data before creation.
 * Returns validation error message or null if valid.
 *
 * @param data - Structure creation data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateStructureData({
 *   farmId: 'farm-1',
 *   name: 'House A',
 *   type: 'house',
 *   capacity: 1000,
 *   status: 'active'
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateStructureData({
 *   ...sameData,
 *   name: ''
 * })
 * // Returns: 'Structure name is required'
 * ```
 */
export function validateStructureData(
    data: CreateStructureInput,
): string | null {
    if (data.farmId === '' || data.farmId.trim() === '') {
        return 'Farm ID is required'
    }

    if (data.name.trim() === '') {
        return 'Structure name is required'
    }

    if ((data.type as string) === '') {
        return 'Structure type is required'
    }

    if ((data.status as string) === '') {
        return 'Structure status is required'
    }

    if (
        data.capacity !== undefined &&
        data.capacity !== null &&
        data.capacity < 0
    ) {
        return 'Capacity cannot be negative'
    }

    if (
        data.areaSqm !== undefined &&
        data.areaSqm !== null &&
        data.areaSqm < 0
    ) {
        return 'Area cannot be negative'
    }

    return null
}

/**
 * Calculate structure capacity based on type and dimensions.
 * Pure function - no side effects.
 *
 * @param type - Type of structure
 * @param dimensions - Object with length and width in meters
 * @returns Calculated capacity (animals) or null if calculation not applicable
 *
 * @example
 * ```ts
 * const capacity = calculateStructureCapacity('house', { length: 20, width: 10 })
 * // Returns: estimated capacity based on area
 * ```
 */
export function calculateStructureCapacity(
    type: string,
    dimensions: { length: number; width: number } | null,
): number | null {
    if (!dimensions) {
        return null
    }

    const { length, width } = dimensions

    if (length <= 0 || width <= 0) {
        return null
    }

    const areaSqm = length * width

    // Industry standard stocking densities (animals per sqm by type)
    const stockingDensities: Record<string, number> = {
        house: 10, // Broiler house: ~10 birds/sqm
        pond: 0.5, // Fish pond: ~0.5 fish/sqm
        pen: 2, // General pen: ~2 animals/sqm
        cage: 20, // Caged birds: ~20/sqm
        barn: 1.5, // Cattle barn: ~1.5/sqm
        pasture: 0.1, // Pasture: extensive
        hive: 1, // Hive: 1 colony per unit
        milking_parlor: 0.5,
        shearing_shed: 1,
        tank: 5, // Fish tanks: higher density
        tarpaulin: 3,
        raceway: 3,
        feedlot: 2,
        kraal: 1,
    }

    const density = stockingDensities[type] || 2 // Default to 2 if unknown
    return Math.floor(areaSqm * density)
}

/**
 * Determine structure status based on occupancy and active state.
 *
 * @param isActive - Whether the structure is in active use
 * @param currentOccupancy - Current number of animals in the structure
 * @param maxCapacity - Maximum capacity of the structure
 * @returns 'active', 'inactive', or 'full'
 *
 * @example
 * ```ts
 * determineStructureStatus(true, 500, 1000)  // Returns: 'active'
 * determineStructureStatus(true, 1000, 1000) // Returns: 'full'
 * determineStructureStatus(false, 0, 1000)   // Returns: 'inactive'
 * ```
 */
export function determineStructureStatus(
    isActive: boolean,
    currentOccupancy: number,
    maxCapacity: number | null,
): 'active' | 'inactive' | 'full' {
    if (!isActive) {
        return 'inactive'
    }

    if (maxCapacity !== null && currentOccupancy >= maxCapacity) {
        return 'full'
    }

    return 'active'
}

/**
 * Build a summary of structure statistics.
 *
 * @param structures - Array of structure objects
 * @returns Summary object with counts by type and status
 *
 * @example
 * ```ts
 * const summary = buildStructuresSummary([
 *   { type: 'house', status: 'active' },
 *   { type: 'pond', status: 'active' },
 *   { type: 'house', status: 'inactive' }
 * ])
 * // Returns: { total: 3, byType: { house: 2, pond: 1 }, byStatus: { active: 2, inactive: 1 } }
 * ```
 */
export function buildStructuresSummary(
    structures: Array<{
        type: string
        status: string
        capacity: number | null
    }>,
): {
    total: number
    byType: Record<string, number>
    byStatus: Record<string, number>
    totalCapacity: number | null
    activeCapacity: number | null
} {
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    let totalCapacity = 0
    let activeCapacity = 0

    for (const structure of structures) {
        // Count by type
        byType[structure.type] = (byType[structure.type] || 0) + 1

        // Count by status
        byStatus[structure.status] = (byStatus[structure.status] || 0) + 1

        // Sum capacities
        if (structure.capacity !== null) {
            totalCapacity += structure.capacity
            if (structure.status === 'active') {
                activeCapacity += structure.capacity
            }
        }
    }

    return {
        total: structures.length,
        byType,
        byStatus,
        totalCapacity: totalCapacity > 0 ? totalCapacity : null,
        activeCapacity: activeCapacity > 0 ? activeCapacity : null,
    }
}

/**
 * Validate update structure data.
 * Returns validation error message or null if valid.
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateUpdateData({ name: 'New Name' })
 * // Returns: null (valid)
 *
 * const invalidError = validateUpdateData({ name: '' })
 * // Returns: 'Structure name cannot be empty'
 * ```
 */
export function validateUpdateData(data: UpdateStructureInput): string | null {
    if (data.name !== undefined && data.name.trim() === '') {
        return 'Structure name cannot be empty'
    }

    if (data.type !== undefined && (data.type as string) === '') {
        return 'Structure type cannot be empty'
    }

    if (data.status !== undefined && (data.status as string) === '') {
        return 'Structure status cannot be empty'
    }

    if (
        data.capacity !== undefined &&
        data.capacity !== null &&
        data.capacity < 0
    ) {
        return 'Capacity cannot be negative'
    }

    if (
        data.areaSqm !== undefined &&
        data.areaSqm !== null &&
        data.areaSqm < 0
    ) {
        return 'Area cannot be negative'
    }

    return null
}

/**
 * Calculate occupancy percentage for a structure.
 *
 * @param currentOccupancy - Current number of animals
 * @param maxCapacity - Maximum capacity of the structure
 * @returns Occupancy percentage (0-100), or null if no capacity set
 *
 * @example
 * ```ts
 * calculateOccupancyPercentage(500, 1000)  // Returns: 50
 * calculateOccupancyPercentage(0, 1000)    // Returns: 0
 * calculateOccupancyPercentage(500, null)  // Returns: null
 * ```
 */
export function calculateOccupancyPercentage(
    currentOccupancy: number,
    maxCapacity: number | null,
): number | null {
    if (maxCapacity === null || maxCapacity <= 0) {
        return null
    }

    const percentage = Math.floor((currentOccupancy / maxCapacity) * 100)
    return Math.min(100, Math.max(0, percentage))
}

/**
 * Check if a structure can be deleted.
 * A structure can only be deleted if it has no active batches assigned.
 *
 * @param activeBatchesCount - Number of active batches assigned
 * @returns True if structure can be deleted, false otherwise
 *
 * @example
 * ```ts
 * canDeleteStructure(0)  // Returns: true
 * canDeleteStructure(2)  // Returns: false
 * ```
 */
export function canDeleteStructure(activeBatchesCount: number): boolean {
    return activeBatchesCount === 0
}
