/**
 * TypeScript interfaces for feed formulation feature
 */

export type {
    OptimizationIngredient,
    NutritionalRequirement,
    OptimizationResult,
} from './optimization-service'
export type { IngredientWithPrice, FormulationInsert } from './repository'
export type {
    FormulationIngredient,
    NutritionalAnalysis,
    MixingInstruction,
} from './service'

export interface FeedFormulationRequest {
    species: string
    stage: string
    batchSizeKg: number
    safetyMargin: number
    ingredientPrices?: Array<{
        ingredientId: string
        pricePerKg: number
        isAvailable: boolean
    }>
}

export interface SavedFormulation {
    id: string
    name: string
    species: string
    productionStage: string
    batchSizeKg: string
    totalCostPerKg: string
    ingredients: Array<{ ingredientId: string; percentage: number }>
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
    createdAt: Date
}
