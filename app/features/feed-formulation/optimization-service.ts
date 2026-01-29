/**
 * HiGHS WASM optimization service for feed formulation
 * Handles linear programming model building and solving
 */

import type { HighsSolution } from 'highs'

export interface OptimizationIngredient {
  id: string
  name: string
  pricePerKg: number
  proteinPercent: number
  energyKcalKg: number
  fatPercent: number
  fiberPercent: number
  calciumPercent: number
  phosphorusPercent: number
  lysinePercent: number
  methioninePercent: number
  maxInclusionPercent?: number
}

export interface NutritionalRequirement {
  minProteinPercent: number
  minEnergyKcalKg: number
  maxFiberPercent: number
  minCalciumPercent: number
  minPhosphorusPercent: number
  minLysinePercent: number
  minMethioninePercent: number
}

export interface OptimizationResult {
  feasible: boolean
  ingredients: Array<{
    id: string
    name: string
    percentage: number
    costPerKg: number
  }>
  totalCostPerKg: number
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
  infeasibilityReport?: string
}

// HiGHS WASM module type (external library)
type HighsModule = {
  solve: (model: any) => any
  [key: string]: any
}

let highsInstance: HighsModule | null = null

/**
 * Lazy load HiGHS WASM module
 */
async function getHiGHS(): Promise<HighsModule> {
  if (!highsInstance) {
    const { default: highs } = await import('highs')
    highsInstance = await highs()
  }
  return highsInstance
}

/**
 * Build linear programming model for feed optimization
 */
export async function buildOptimizationModel(
  ingredients: Array<OptimizationIngredient>,
  requirements: NutritionalRequirement,
  safetyMargin: number = 0,
): Promise<OptimizationResult> {
  const solver = await getHiGHS()

  const numIngredients = ingredients.length

  // Objective: minimize cost
  const costs = ingredients.map((ing) => ing.pricePerKg)

  // Constraint matrix for nutritional requirements
  const constraints: Array<Array<number>> = []
  const bounds: Array<{ lower: number; upper?: number }> = []

  // Protein constraint (with safety margin)
  const minProtein = requirements.minProteinPercent * (1 + safetyMargin / 100)
  constraints.push(ingredients.map((ing) => ing.proteinPercent))
  bounds.push({ lower: minProtein })

  // Energy constraint
  const minEnergy = requirements.minEnergyKcalKg * (1 + safetyMargin / 100)
  constraints.push(ingredients.map((ing) => ing.energyKcalKg))
  bounds.push({ lower: minEnergy })

  // Fiber constraint (maximum)
  const maxFiber = requirements.maxFiberPercent * (1 - safetyMargin / 100)
  constraints.push(ingredients.map((ing) => -ing.fiberPercent)) // Negative for max constraint
  bounds.push({ lower: -maxFiber })

  // Calcium constraint
  const minCalcium = requirements.minCalciumPercent * (1 + safetyMargin / 100)
  constraints.push(ingredients.map((ing) => ing.calciumPercent))
  bounds.push({ lower: minCalcium })

  // Phosphorus constraint
  const minPhosphorus =
    requirements.minPhosphorusPercent * (1 + safetyMargin / 100)
  constraints.push(ingredients.map((ing) => ing.phosphorusPercent))
  bounds.push({ lower: minPhosphorus })

  // Lysine constraint
  const minLysine = requirements.minLysinePercent * (1 + safetyMargin / 100)
  constraints.push(ingredients.map((ing) => ing.lysinePercent))
  bounds.push({ lower: minLysine })

  // Methionine constraint
  const minMethionine =
    requirements.minMethioninePercent * (1 + safetyMargin / 100)
  constraints.push(ingredients.map((ing) => ing.methioninePercent))
  bounds.push({ lower: minMethionine })

  // Sum to 100% constraint
  constraints.push(Array(numIngredients).fill(1))
  bounds.push({ lower: 100, upper: 100 })

  // Variable bounds (0-100% for each ingredient, with max inclusion limits)
  const variableBounds = ingredients.map((ing) => ({
    lower: 0,
    upper: ing.maxInclusionPercent || 100,
  }))

  try {
    const solution = solver.solve({
      sense: 'minimize',
      objective: costs,
      constraints: constraints.map((row, i) => ({
        coefficients: row,
        lower: bounds[i].lower,
        upper: bounds[i].upper,
      })),
      variables: variableBounds,
    })

    return parseSolution(solution, ingredients)
  } catch (error) {
    return {
      feasible: false,
      ingredients: [],
      totalCostPerKg: 0,
      nutritionalValues: {
        protein: 0,
        energy: 0,
        fat: 0,
        fiber: 0,
        calcium: 0,
        phosphorus: 0,
        lysine: 0,
        methionine: 0,
      },
      infeasibilityReport: `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Parse HiGHS solution into readable format
 */
function parseSolution(
  solution: HighsSolution,
  ingredients: Array<OptimizationIngredient>,
): OptimizationResult {
  if (solution.Status !== 'Optimal') {
    return {
      feasible: false,
      ingredients: [],
      totalCostPerKg: 0,
      nutritionalValues: {
        protein: 0,
        energy: 0,
        fat: 0,
        fiber: 0,
        calcium: 0,
        phosphorus: 0,
        lysine: 0,
        methionine: 0,
      },
      infeasibilityReport: `Solution status: ${solution.Status}`,
    }
  }

  const percentages = solution.Columns
  const totalCostPerKg = solution.ObjectiveValue

  // Filter out ingredients with negligible amounts
  const resultIngredients = ingredients
    .map((ing, i) => {
      const percentage =
        typeof percentages[i] === 'number'
          ? percentages[i]
          : (percentages[i] as any)?.primal || 0
      return {
        id: ing.id,
        name: ing.name,
        percentage,
        costPerKg: ing.pricePerKg,
      }
    })
    .filter((ing) => ing.percentage > 0.01) // Only include if > 0.01%

  // Calculate nutritional values
  const getPercentage = (i: number) =>
    typeof percentages[i] === 'number'
      ? percentages[i]
      : (percentages[i] as any)?.primal || 0

  const nutritionalValues = {
    protein: ingredients.reduce(
      (sum, ing, i) => sum + (ing.proteinPercent * getPercentage(i)) / 100,
      0,
    ),
    energy: ingredients.reduce(
      (sum, ing, i) => sum + (ing.energyKcalKg * getPercentage(i)) / 100,
      0,
    ),
    fat: ingredients.reduce(
      (sum, ing, i) => sum + (ing.fatPercent * getPercentage(i)) / 100,
      0,
    ),
    fiber: ingredients.reduce(
      (sum, ing, i) => sum + (ing.fiberPercent * getPercentage(i)) / 100,
      0,
    ),
    calcium: ingredients.reduce(
      (sum, ing, i) => sum + (ing.calciumPercent * getPercentage(i)) / 100,
      0,
    ),
    phosphorus: ingredients.reduce(
      (sum, ing, i) => sum + (ing.phosphorusPercent * getPercentage(i)) / 100,
      0,
    ),
    lysine: ingredients.reduce(
      (sum, ing, i) => sum + (ing.lysinePercent * getPercentage(i)) / 100,
      0,
    ),
    methionine: ingredients.reduce(
      (sum, ing, i) => sum + (ing.methioninePercent * getPercentage(i)) / 100,
      0,
    ),
  }

  return {
    feasible: true,
    ingredients: resultIngredients,
    totalCostPerKg,
    nutritionalValues,
  }
}
