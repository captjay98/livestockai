/**
 * Types for egg production management
 */

import type { BasePaginatedQuery } from '~/lib/types'

/**
 * Search parameters for eggs route
 */
export interface EggSearchParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

/**
 * Batch data for egg production
 */
export interface EggBatch {
  id: string
  species: string
  livestockType: string
  currentQuantity: number
  status: string
}

/**
 * Egg production summary metrics
 */
export interface EggSummary {
  totalCollected: number
  totalBroken: number
  totalSold: number
  currentInventory: number
  recordCount: number
}

/**
 * Filter parameters for paginated egg record queries
 */
export interface EggQuery extends BasePaginatedQuery {
  /** Optional filter by specific poultry batch */
  batchId?: string
}

/**
 * Input for recording egg collection and wastage
 */
export interface CreateEggRecordInput {
  /** ID of the layer poultry batch */
  batchId: string
  /** Collection date */
  date: Date
  /** Total quantity of good eggs collected */
  quantityCollected: number
  /** Number of eggs broken or discarded during collection */
  quantityBroken: number
  /** Number of eggs from this batch sold specifically on this date */
  quantitySold: number
}

/**
 * Data structure for updating an egg production record
 */
export interface UpdateEggRecordInput {
  /** Updated date */
  date?: Date
  /** Updated collection count */
  quantityCollected?: number
  /** Updated breakage count */
  quantityBroken?: number
  /** Updated sales count */
  quantitySold?: number
}
