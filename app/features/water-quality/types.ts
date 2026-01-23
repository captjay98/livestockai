export interface WaterQualityRecord {
  id: string
  batchId: string
  date: Date
  ph: string
  temperatureCelsius: string
  dissolvedOxygenMgL: string
  ammoniaMgL: string
  notes?: string | null
  species: string
  farmName?: string
}

export interface WaterQualityAlert {
  batchId: string
  species: string
  issues: Array<string>
  severity: 'warning' | 'critical'
}

export interface Batch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

export interface WaterQualitySearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
}

export interface CreateWaterQualityData {
  batchId: string
  date: Date
  ph: number
  temperatureCelsius: number
  dissolvedOxygenMgL: number
  ammoniaMgL: number
  notes?: string
}

export interface UpdateWaterQualityData {
  ph?: number
  temperatureCelsius?: number
  dissolvedOxygenMgL?: number
  ammoniaMgL?: number
  date?: Date
  notes?: string | null
}
