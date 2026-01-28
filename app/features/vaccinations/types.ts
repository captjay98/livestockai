export interface Batch {
    id: string
    species: string
    livestockType: string
    currentQuantity: number
    status: string
}

export interface VaccinationAlert {
    id: string
    batchId: string
    vaccineName: string
    species: string | null
    livestockType: string | null
    nextDueDate: Date | null
    farmName: string | null
}

export interface AlertData {
    upcoming: Array<VaccinationAlert>
    overdue: Array<VaccinationAlert>
    totalAlerts: number
}

export interface PaginatedQuery {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    type?: 'all' | 'vaccination' | 'treatment'
}
