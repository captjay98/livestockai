/**
 * Pure business logic for marketplace listings.
 * All functions are side-effect-free and easily unit testable.
 */

import type { ListingStatus, MarketplaceLivestockType } from '~/lib/db/types'

export interface ListingLocation {
    state: string
    lga: string
    address: string
}

export interface CreateListingInput {
    livestockType: MarketplaceLivestockType
    species: string
    quantity: number
    minPrice: number
    maxPrice: number
    location: ListingLocation
    expirationDays?: 7 | 14 | 30 | 60
}

/**
 * Validate listing input data
 */
export function validateListingInput(input: CreateListingInput): {
    valid: boolean
    errors: Array<string>
} {
    const errors: Array<string> = []

    // Validate required fields
    if (!input.species || !input.species.trim()) errors.push('Species is required')
    if (!input.quantity || input.quantity <= 0)
        errors.push('Quantity must be greater than 0')
    if (input.minPrice < 0) errors.push('Minimum price cannot be negative')
    if (input.maxPrice < input.minPrice)
        errors.push(
            'Maximum price must be greater than or equal to minimum price',
        )
    if (!input.location.state || !input.location.state.trim()) errors.push('State is required')
    if (!input.location.lga || !input.location.lga.trim()) errors.push('LGA is required')
    if (!input.location.address || !input.location.address.trim()) errors.push('Address is required')

    return { valid: errors.length === 0, errors }
}

/**
 * Calculate expiration date by adding days to creation date
 */
export function calculateExpirationDate(
    createdAt: Date,
    expirationDays: 7 | 14 | 30 | 60,
): Date {
    const expiresAt = new Date(createdAt)
    expiresAt.setDate(expiresAt.getDate() + expirationDays)
    return expiresAt
}

/**
 * Check if listing has expired
 */
export function isListingExpired(
    expiresAt: Date,
    now: Date = new Date(),
): boolean {
    return now > expiresAt
}

/**
 * Check if listing expiration notification should be sent (within 3 days and not expired)
 */
export function shouldNotifyExpiration(
    expiresAt: Date,
    now: Date = new Date(),
): boolean {
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    return expiresAt <= threeDaysFromNow && !isListingExpired(expiresAt, now)
}

/**
 * Validate status transition rules
 */
export function validateStatusTransition(
    currentStatus: ListingStatus,
    newStatus: ListingStatus,
): boolean {
    const validTransitions: Record<ListingStatus, Array<ListingStatus>> = {
        active: ['paused', 'sold', 'expired'],
        paused: ['active', 'sold'],
        expired: ['active'],
        sold: [],
    }

    return validTransitions[currentStatus].includes(newStatus)
}

/**
 * Generate listing data from batch information
 */
export function generateListingFromBatch(
    batch: { species: string; currentQuantity: number; livestockType: string },
    marketPrice?: { price_per_unit: string } | null,
): Partial<CreateListingInput> {
    const baseData: Partial<CreateListingInput> = {
        species: batch.species,
        quantity: batch.currentQuantity,
        livestockType: batch.livestockType as MarketplaceLivestockType,
    }

    if (marketPrice) {
        const price = parseFloat(marketPrice.price_per_unit)
        const minPrice = price * 0.9
        const maxPrice = price * 1.1

        return {
            ...baseData,
            minPrice,
            maxPrice,
        }
    }

    return baseData
}
