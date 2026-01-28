/**
 * Weight feature types
 */

export interface WeightSearchParams {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    q?: string
    batchId?: string
    farmId?: string
}

export interface WeightSample {
    id: string
    batchId: string
    date: Date
    sampleSize: number
    averageWeightKg: string
    batchSpecies?: string
    livestockType?: string
    farmName?: string
}

export interface Batch {
    id: string
    species: string
    livestockType: string
    currentQuantity: number
    status: string
}

export interface GetWeightRecordsInput {
    farmId?: string | null
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
}
