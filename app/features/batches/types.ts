/**
 * Batches feature types
 */

export interface BatchSearchParams {
    farmId?: string
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    q?: string
    status?: 'active' | 'depleted' | 'sold'
    livestockType?: 'poultry' | 'fish'
    breedId?: string
}

export interface InventorySummary {
    poultry: { batches: number; quantity: number; investment: number }
    fish: { batches: number; quantity: number; investment: number }
    overall: {
        totalBatches?: number
        activeBatches: number
        depletedBatches: number
        totalQuantity: number
        totalInvestment: number
    }
}

export interface GetBatchesForFarmInput {
    farmId?: string | null
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: 'active' | 'depleted' | 'sold'
    livestockType?: 'poultry' | 'fish'
    breedId?: string
}

// Batch detail page types
export interface FeedRecord {
    id: string
    batchId: string
    feedType: string
    brandName: string | null
    quantityKg: string
    cost: string
    date: Date
    notes: string | null
}

export interface MortalityRecord {
    id: string
    batchId: string
    quantity: number
    date: Date
    cause: string
    notes: string | null
}

export interface SaleRecord {
    id: string
    quantity: number
    totalAmount: string
    date: Date
    livestockType: string
    unitType?: string | null
    ageWeeks?: number | null
    paymentStatus?: string | null
    customerName?: string | null
}

export interface ExpenseRecord {
    id: string
    category: string
    amount: string
    date: Date
    description: string
}

export interface BatchMetrics {
    currentQuantity: number
    initialQuantity: number
    mortalityCount: number
    mortalityRate: number
    feedTotalKg: number
    feedFcr: number | null
    totalInvestment: number
    costPerUnit: number
    totalRevenue: number
    totalSold: number
    avgSalesPrice: number
    netProfit: number
    roi: number
}
