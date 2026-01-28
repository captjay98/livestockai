/**
 * Feed feature types
 */

export interface FeedSearchParams {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    q?: string
    feedType?: string
    farmId?: string
}

export interface FeedInventory {
    feedType: string
    quantityKg: string
    minThresholdKg: string
}

export interface Batch {
    id: string
    species: string
    livestockType: string
    currentQuantity: number
    status: string
    farmId: string
    farmName?: string | null
    createdAt?: Date
    updatedAt?: Date
}

export interface GetFeedDataForFarmInput {
    farmId?: string | null
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    feedType?: string
}
