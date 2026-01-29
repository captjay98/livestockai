import type { Generated } from 'kysely'

// Livestock Breeds
export interface BreedTable {
  id: Generated<string>
  moduleKey: 'poultry' | 'aquaculture' | 'cattle' | 'goats' | 'sheep' | 'bees'
  speciesKey: string
  breedName: string
  displayName: string
  typicalMarketWeightG: number
  typicalDaysToMarket: number
  typicalFcr: string // DECIMAL(4,2)
  sourceSizes: Array<string> // JSONB
  regions: Array<string> // JSONB
  isDefault: Generated<boolean>
  isActive: Generated<boolean>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

// Breed Requests
export interface BreedRequestTable {
  id: Generated<string>
  userId: string
  moduleKey: string
  speciesKey: string
  breedName: string
  typicalMarketWeightG: number | null
  typicalDaysToMarket: number | null
  typicalFcr: string | null // DECIMAL(4,2)
  source: string | null
  userEmail: string | null
  notes: string | null
  photoUrl: string | null // PUBLIC storage - reference photo
  status: string // 'pending' | 'approved' | 'rejected'
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

// Livestock
// Note: PostgreSQL DECIMAL columns are returned as strings by the pg driver
// to preserve precision. Use toDecimal() from currency.ts to work with them.
export interface BatchTable {
  id: Generated<string>
  farmId: string
  batchName: string | null // "Batch A", "NOV-2024-BR-01"
  livestockType: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
  species: string // broiler, layer, catfish, tilapia, angus, boer, merino, etc.
  breedId: string | null // NEW: Reference to breeds table for breed-specific forecasting
  sourceSize: string | null // "day-old", "point-of-lay", "fingerling", "jumbo", "calf", "kid", "lamb", "nuc"
  initialQuantity: number
  currentQuantity: number
  acquisitionDate: Date
  costPerUnit: string // DECIMAL(19,2) - returned as string from pg
  totalCost: string // DECIMAL(19,2) - returned as string from pg
  status: 'active' | 'depleted' | 'sold'
  supplierId: string | null // Where purchased from
  structureId: string | null // Which house/pond/barn/pasture/hive
  targetHarvestDate: Date | null // Planned sale date
  target_weight_g: number | null // Forecasting
  targetPricePerUnit: string | null // DECIMAL(19,2) - User's expected sale price
  notes: string | null
  photos: Array<{ url: string; capturedAt: string; notes?: string }> | null // PUBLIC storage - growth tracking photos
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  deletedAt: Date | null
}

export interface EggTable {
  id: Generated<string>
  batchId: string
  date: Date
  quantityCollected: number
  quantityBroken: number
  quantitySold: number
  createdAt: Generated<Date>
}

export interface WeightTable {
  id: Generated<string>
  batchId: string
  date: Date
  sampleSize: number
  averageWeightKg: string // DECIMAL(8,3) - returned as string from pg
  minWeightKg: string | null // DECIMAL(8,3) - Smallest in sample
  maxWeightKg: string | null // DECIMAL(8,3) - Largest in sample
  notes: string | null
  createdAt: Generated<Date>
}
