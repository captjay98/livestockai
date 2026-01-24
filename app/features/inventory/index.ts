import type { FeedType, MedicationUnit } from './service'

export interface FeedInventoryItem {
  id: string
  farmId: string
  feedType: string
  quantityKg: string
  minThresholdKg: string
  updatedAt: Date
  farmName?: string | null
}

export interface MedicationItem {
  id: string
  farmId: string
  medicationName: string
  quantity: number
  unit: string
  expiryDate: Date | null
  minThreshold: number
  updatedAt: Date
  farmName?: string | null
}

export { FEED_TYPES, MEDICATION_UNITS } from './service'
export type { FeedType, MedicationUnit }
