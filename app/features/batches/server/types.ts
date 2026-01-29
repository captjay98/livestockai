import type { PaginatedResult } from '~/lib/types'
import type { LivestockType } from '~/features/modules/types'
import { MODULE_METADATA } from '~/features/modules/constants'

export type { PaginatedResult }
export type { InventorySummary } from '../types'

/**
 * Data required to create a new livestock batch
 */
export interface CreateBatchData {
  /** The ID of the farm where the batch will be located */
  farmId: string
  /** The type of livestock (poultry, fish, etc.) */
  livestockType: LivestockType
  /** The specific species or breed (e.g., 'Broiler', 'Catfish') */
  species: string
  /** Optional breed ID for breed-specific forecasting */
  breedId?: string | null
  /** Initial number of units in the batch */
  initialQuantity: number
  /** Date when the batch was acquired or started */
  acquisitionDate: Date
  /** Cost per unit/animal in the system's currency */
  costPerUnit: number
  /** Optional custom name for the batch */
  batchName?: string | null
  /** Optional starting size/age description */
  sourceSize?: string | null
  /** Optional reference to the structure where the batch is housed */
  structureId?: string | null
  /** Optional expected harvest or depletion date */
  targetHarvestDate?: Date | null
  /** Optional target weight in grams for harvest */
  target_weight_g?: number | null
  /** Optional expected sale price per unit for revenue forecasting */
  targetPricePerUnit?: number | null
  /** Optional ID of the supplier */
  supplierId?: string | null
  /** Optional additional notes */
  notes?: string | null
}

/**
 * Data available for updating an existing livestock batch.
 * All fields are optional to allow partial updates.
 */
export interface UpdateBatchData {
  /** Updated species or breed name (e.g., 'Broiler', 'Catfish') */
  species?: string
  /**
   * Updated batch status.
   * 'active' - currently growing
   * 'depleted' - all animals died or removed without sale
   * 'sold' - all animals sold
   */
  status?: 'active' | 'depleted' | 'sold'
  /** Updated custom batch name or reference identifier */
  batchName?: string | null
  /** Updated source size description (e.g., 'day-old') */
  sourceSize?: string | null
  /** Updated reference to the structure where the batch is housed */
  structureId?: string | null
  /** Updated target harvest or depletion date */
  targetHarvestDate?: Date | null
  /** Updated target weight in grams for harvest forecasting */
  target_weight_g?: number | null
  /** Updated additional notes or observations */
  notes?: string | null
  /** Expected updatedAt timestamp for conflict detection (offline sync) */
  expectedUpdatedAt?: Date
}

/**
 * Paginated batches query with sorting and search
 */
export interface PaginatedQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  farmId?: string
  status?: string
  livestockType?: string
  breedId?: string
}

/**
 * Get source size options for a livestock type based on module metadata
 *
 * @param livestockType - The type of livestock (e.g., 'poultry', 'fish')
 * @returns Array of value/label pairs for source size options
 */
export function getSourceSizeOptions(
  livestockType: LivestockType,
): Array<{ value: string; label: string }> {
  // Find the module that handles this livestock type
  const moduleEntry = Object.entries(MODULE_METADATA).find(([_, metadata]) =>
    metadata.livestockTypes.includes(livestockType),
  )

  if (!moduleEntry) {
    return []
  }

  return moduleEntry[1].sourceSizeOptions
}

/**
 * Pre-computed source size options organized by livestock type.
 * Useful for populating dropdowns and selection menus.
 */
export const SOURCE_SIZE_OPTIONS = {
  poultry: getSourceSizeOptions('poultry'),
  fish: getSourceSizeOptions('fish'),
  cattle: getSourceSizeOptions('cattle'),
  goats: getSourceSizeOptions('goats'),
  sheep: getSourceSizeOptions('sheep'),
  bees: getSourceSizeOptions('bees'),
}
