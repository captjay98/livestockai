/**
 * Mortality feature types
 */

export interface MortalitySearchParams {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    q?: string
    cause?: string
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

export interface GetMortalityRecordsInput {
    farmId?: string | null
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    cause?: string
}
