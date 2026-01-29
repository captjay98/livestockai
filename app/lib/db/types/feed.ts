import type { Generated } from 'kysely'

export interface FeedTable {
  id: Generated<string>
  batchId: string
  feedType:
    | 'starter'
    | 'grower'
    | 'finisher'
    | 'layer_mash'
    | 'fish_feed'
    | 'cattle_feed'
    | 'goat_feed'
    | 'sheep_feed'
    | 'hay'
    | 'silage'
    | 'bee_feed'
  brandName: string | null // "Aller Aqua", "Ultima Plus", "Blue Crown"
  bagSizeKg: number | null // 15, 25
  numberOfBags: number | null // How many bags used
  quantityKg: string // DECIMAL(10,2) - returned as string from pg
  cost: string // DECIMAL(19,2) - returned as string from pg
  date: Date
  supplierId: string | null
  inventoryId: string | null // Optional link to feed_inventory for auto-deduction
  notes: string | null
  createdAt: Generated<Date>
}

export interface FeedInventoryTable {
  id: Generated<string>
  farmId: string
  feedType:
    | 'starter'
    | 'grower'
    | 'finisher'
    | 'layer_mash'
    | 'fish_feed'
    | 'cattle_feed'
    | 'goat_feed'
    | 'sheep_feed'
    | 'hay'
    | 'silage'
    | 'bee_feed'
  quantityKg: string // DECIMAL(10,2)
  minThresholdKg: string // DECIMAL(10,2)
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface MedicationInventoryTable {
  id: Generated<string>
  farmId: string
  medicationName: string
  quantity: number
  unit: 'vial' | 'bottle' | 'sachet' | 'ml' | 'g' | 'tablet' | 'kg' | 'liter'
  expiryDate: Date | null
  minThreshold: number
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

// Feed Formulation Tables

/**
 * Master data for feed ingredients with nutritional values.
 */
export interface FeedIngredientTable {
  /** Unique ingredient identifier */
  id: Generated<string>
  /** Ingredient name (e.g., "Corn", "Soybean Meal") */
  name: string
  /** Ingredient category */
  category: 'cereal' | 'protein' | 'fat' | 'mineral' | 'vitamin' | 'additive'
  /** Protein content percentage */
  proteinPercent: string // DECIMAL(5,2)
  /** Energy content in kcal/kg */
  energyKcalKg: number
  /** Fat content percentage */
  fatPercent: string // DECIMAL(5,2)
  /** Fiber content percentage */
  fiberPercent: string // DECIMAL(5,2)
  /** Calcium content percentage */
  calciumPercent: string // DECIMAL(5,2)
  /** Phosphorus content percentage */
  phosphorusPercent: string // DECIMAL(5,2)
  /** Lysine content percentage */
  lysinePercent: string // DECIMAL(5,2)
  /** Methionine content percentage */
  methioninePercent: string // DECIMAL(5,2)
  /** Maximum inclusion percentage in feed */
  maxInclusionPercent: string // DECIMAL(5,2)
  /** Whether ingredient is active/available */
  isActive: Generated<boolean>
  createdAt: Generated<Date>
}

/**
 * Nutritional requirements by species and production stage.
 */
export interface NutritionalRequirementTable {
  /** Unique requirement identifier */
  id: Generated<string>
  /** Species (e.g., "broiler", "layer", "catfish") */
  species: string
  /** Production stage (e.g., "starter", "grower", "finisher") */
  productionStage: string
  /** Minimum protein percentage required */
  minProteinPercent: string // DECIMAL(5,2)
  /** Minimum energy in kcal/kg required */
  minEnergyKcalKg: number
  /** Maximum fiber percentage allowed */
  maxFiberPercent: string // DECIMAL(5,2)
  /** Minimum calcium percentage required */
  minCalciumPercent: string // DECIMAL(5,2)
  /** Minimum phosphorus percentage required */
  minPhosphorusPercent: string // DECIMAL(5,2)
  /** Minimum lysine percentage required */
  minLysinePercent: string // DECIMAL(5,2)
  /** Minimum methionine percentage required */
  minMethioninePercent: string // DECIMAL(5,2)
  createdAt: Generated<Date>
}

/**
 * User-specific ingredient prices with history tracking.
 */
export interface UserIngredientPriceTable {
  /** Unique price record identifier */
  id: Generated<string>
  /** User who owns this price */
  userId: string
  /** Ingredient this price is for */
  ingredientId: string
  /** Current price per kg */
  pricePerKg: string // DECIMAL(19,2)
  /** Whether ingredient is currently available */
  isAvailable: Generated<boolean>
  /** When price was last updated */
  lastUpdated: Generated<Date>
  /** Historical price data as JSON array */
  priceHistory: Array<{ date: string; price: string }>
}

/**
 * Saved feed formulations with ingredients and nutritional analysis.
 */
export interface SavedFormulationTable {
  /** Unique formulation identifier */
  id: Generated<string>
  /** User who created this formulation */
  userId: string
  /** Formulation name */
  name: string
  /** Target species */
  species: string
  /** Target production stage */
  productionStage: string
  /** Batch size in kg */
  batchSizeKg: string // DECIMAL(10,2)
  /** Ingredients with percentages as JSON */
  ingredients: Array<{ ingredientId: string; percentage: number }>
  /** Total cost per kg */
  totalCostPerKg: string // DECIMAL(19,2)
  /** Calculated nutritional values as JSON */
  nutritionalValues: {
    protein: number
    energy: number
    fat: number
    fiber: number
    calcium: number
    phosphorus: number
    lysine: number
    methionine: number
  }
  /** Share code for public formulations */
  shareCode: string | null
  /** Number of times this formulation has been used */
  usageCount: Generated<number>
  /** Mixing instructions for feed preparation */
  mixingInstructions: string | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

/**
 * Formulation usage tracking
 */
export interface FormulationUsageTable {
  /** Unique usage record identifier */
  id: Generated<string>
  /** Formulation that was used */
  formulationId: string
  /** Batch it was used for (optional) */
  batchId: string | null
  /** User who used the formulation */
  userId: string
  /** When it was used */
  usedAt: Generated<Date>
  /** Batch size produced */
  batchSizeKg: string // DECIMAL(10,2)
  /** Total cost of batch */
  totalCost: string // DECIMAL(19,2)
  /** Optional notes */
  notes: string | null
  createdAt: Generated<Date>
}
