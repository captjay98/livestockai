/**
 * Business logic for feed formulation
 * Pure functions - no side effects, easily testable
 */

import type {
    NutritionalRequirement,
    OptimizationIngredient,
} from './optimization-service'
import type { IngredientWithPrice } from './repository'
import { toNumber } from '~/features/settings/currency'

export interface FormulationIngredient {
    id: string
    name: string
    percentage: number
    weightKg: number
    costPerKg: number
    totalCost: number
}

export interface NutritionalAnalysis {
    protein: number
    energy: number
    fat: number
    fiber: number
    calcium: number
    phosphorus: number
    lysine: number
    methionine: number
}

export interface MixingInstruction {
    step: number
    ingredient: string
    weightKg: number
    percentage: number
    notes?: string
}

/**
 * Build optimization model from database ingredients and user prices
 */
export function buildOptimizationModel(
    ingredients: Array<IngredientWithPrice>,
    userPrices: Array<{
        ingredientId: string
        pricePerKg: string
        isAvailable: boolean
    }>,
    requirements: NutritionalRequirement,
    batchSize: number,
    safetyMargin: number = 0,
): Array<OptimizationIngredient> {
    const mapped = ingredients.map((ing) => {
        const userPrice = userPrices.find((p) => p.ingredientId === ing.id)

        // Skip unavailable ingredients
        if (userPrice && !userPrice.isAvailable) {
            return null
        }

        return {
            id: ing.id,
            name: ing.name,
            pricePerKg: userPrice ? toNumber(userPrice.pricePerKg) : 0,
            proteinPercent: toNumber(ing.proteinPercent),
            energyKcalKg: ing.energyKcalKg,
            fatPercent: toNumber(ing.fatPercent),
            fiberPercent: toNumber(ing.fiberPercent),
            calciumPercent: toNumber(ing.calciumPercent),
            phosphorusPercent: toNumber(ing.phosphorusPercent),
            lysinePercent: toNumber(ing.lysinePercent),
            methioninePercent: toNumber(ing.methioninePercent),
            maxInclusionPercent: toNumber(ing.maxInclusionPercent),
        }
    })

    return mapped.filter((ing): ing is NonNullable<typeof ing> => ing !== null)
}

/**
 * Calculate nutritional values from ingredients and quantities
 */
export function calculateNutritionalValues(
    ingredients: Array<{ ingredient: IngredientWithPrice; percentage: number }>,
): NutritionalAnalysis {
    return ingredients.reduce(
        (totals, { ingredient, percentage }) => ({
            protein:
                totals.protein +
                (toNumber(ingredient.proteinPercent) * percentage) / 100,
            energy:
                totals.energy + (ingredient.energyKcalKg * percentage) / 100,
            fat:
                totals.fat +
                (toNumber(ingredient.fatPercent) * percentage) / 100,
            fiber:
                totals.fiber +
                (toNumber(ingredient.fiberPercent) * percentage) / 100,
            calcium:
                totals.calcium +
                (toNumber(ingredient.calciumPercent) * percentage) / 100,
            phosphorus:
                totals.phosphorus +
                (toNumber(ingredient.phosphorusPercent) * percentage) / 100,
            lysine:
                totals.lysine +
                (toNumber(ingredient.lysinePercent) * percentage) / 100,
            methionine:
                totals.methionine +
                (toNumber(ingredient.methioninePercent) * percentage) / 100,
        }),
        {
            protein: 0,
            energy: 0,
            fat: 0,
            fiber: 0,
            calcium: 0,
            phosphorus: 0,
            lysine: 0,
            methionine: 0,
        },
    )
}

/**
 * Apply safety margin to nutritional requirements
 */
export function applySafetyMargin(
    requirements: NutritionalRequirement,
    marginPercent: number,
): NutritionalRequirement {
    const margin = marginPercent / 100

    return {
        minProteinPercent: requirements.minProteinPercent * (1 + margin),
        minEnergyKcalKg: requirements.minEnergyKcalKg * (1 + margin),
        maxFiberPercent: requirements.maxFiberPercent * (1 - margin), // Reduce max for safety
        minCalciumPercent: requirements.minCalciumPercent * (1 + margin),
        minPhosphorusPercent: requirements.minPhosphorusPercent * (1 + margin),
        minLysinePercent: requirements.minLysinePercent * (1 + margin),
        minMethioninePercent: requirements.minMethioninePercent * (1 + margin),
    }
}

/**
 * Scale ingredient quantities to target batch size
 */
export function scaleToBatchSize(
    ingredients: Array<{
        id: string
        name: string
        percentage: number
        costPerKg: number
    }>,
    targetSizeKg: number,
): Array<FormulationIngredient> {
    return ingredients.map((ing) => {
        const weightKg = (ing.percentage / 100) * targetSizeKg
        const totalCost = weightKg * ing.costPerKg

        return {
            id: ing.id,
            name: ing.name,
            percentage: ing.percentage,
            weightKg,
            costPerKg: ing.costPerKg,
            totalCost,
        }
    })
}

/**
 * Suggest ingredient substitutions for infeasible formulations
 */
export function suggestSubstitutions(
    infeasibilityReport: string,
): Array<string> {
    const suggestions: Array<string> = []

    if (infeasibilityReport.includes('protein')) {
        suggestions.push(
            'Consider adding higher protein ingredients like soybean meal or fish meal',
        )
    }

    if (infeasibilityReport.includes('energy')) {
        suggestions.push('Add energy-rich ingredients like corn or wheat')
    }

    if (infeasibilityReport.includes('fiber')) {
        suggestions.push(
            'Reduce high-fiber ingredients or increase fiber limits',
        )
    }

    if (
        infeasibilityReport.includes('cost') ||
        infeasibilityReport.includes('price')
    ) {
        suggestions.push(
            'Check ingredient prices or consider alternative ingredients',
        )
    }

    if (suggestions.length === 0) {
        suggestions.push(
            'Review ingredient availability and nutritional requirements',
        )
    }

    return suggestions
}

/**
 * Generate step-by-step mixing instructions
 */
export function generateMixingInstructions(
    ingredients: Array<FormulationIngredient>,
): Array<MixingInstruction> {
    // Sort by mixing order: cereals first, then proteins, then minerals/vitamins
    const sortedIngredients = [...ingredients].sort((a, b) => {
        const orderA = getMixingOrder(a.name)
        const orderB = getMixingOrder(b.name)
        return orderA - orderB
    })

    return sortedIngredients.map((ing, index) => ({
        step: index + 1,
        ingredient: ing.name,
        weightKg: ing.weightKg,
        percentage: ing.percentage,
        notes: getMixingNotes(ing.name, ing.percentage),
    }))
}

/**
 * Get maximum inclusion limit based on ingredient category
 */
function getMaxInclusionLimit(category: string): number {
    const limits: Record<string, number> = {
        cereal: 70, // Corn, wheat can be up to 70%
        protein: 40, // Soybean meal, fish meal up to 40%
        fat: 10, // Oils up to 10%
        mineral: 5, // Mineral premixes up to 5%
        vitamin: 1, // Vitamin premixes up to 1%
        additive: 0.5, // Additives very limited
    }

    return limits[category] || 50 // Default 50% if category unknown
}

/**
 * Get mixing order priority (lower = mix first)
 */
function getMixingOrder(ingredientName: string): number {
    const name = ingredientName.toLowerCase()

    if (
        name.includes('corn') ||
        name.includes('wheat') ||
        name.includes('rice')
    )
        return 1
    if (
        name.includes('soybean') ||
        name.includes('fish meal') ||
        name.includes('protein')
    )
        return 2
    if (name.includes('oil') || name.includes('fat')) return 3
    if (
        name.includes('mineral') ||
        name.includes('limestone') ||
        name.includes('phosphate')
    )
        return 4
    if (name.includes('vitamin') || name.includes('premix')) return 5

    return 3 // Default middle order
}

/**
 * Get mixing notes for specific ingredients
 */
function getMixingNotes(
    ingredientName: string,
    percentage: number,
): string | undefined {
    const name = ingredientName.toLowerCase()

    if (name.includes('oil') && percentage > 5) {
        return 'Add gradually while mixing to ensure even distribution'
    }

    if (name.includes('vitamin') || name.includes('premix')) {
        return 'Mix thoroughly to ensure even distribution of micronutrients'
    }

    if (name.includes('limestone') || name.includes('mineral')) {
        return 'Ensure complete mixing to avoid segregation'
    }

    return undefined
}
