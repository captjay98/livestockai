/**
 * Server functions for feed formulation with Zod validation
 * Follows LivestockAI patterns: Server → Service → Repository
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { buildOptimizationModel as buildOptModel } from './optimization-service'
import {
  applySafetyMargin,
  buildOptimizationModel,
  generateMixingInstructions,
  scaleToBatchSize,
  suggestSubstitutions,
} from './service'
import {
  getFormulationById,
  getFormulations,
  getIngredients,
  getNutritionalRequirements,
  getUserIngredientPrices,
  saveFormulation,
  updateIngredientPrice,
} from './repository'
import { AppError } from '~/lib/errors'
import { toDbString } from '~/features/settings/currency'

// Zod validation schemas
const runOptimizationSchema = z.object({
  species: z.string().min(1),
  stage: z.string().min(1),
  batchSizeKg: z.number().positive().default(100),
  safetyMargin: z.number().min(0).max(20).default(0),
  ingredientPrices: z
    .array(
      z.object({
        ingredientId: z.string().uuid(),
        pricePerKg: z.number().nonnegative(),
        isAvailable: z.boolean().default(true),
      }),
    )
    .optional(),
})

const saveFormulationSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().min(1),
  stage: z.string().min(1),
  batchSizeKg: z.number().positive(),
  ingredients: z.array(
    z.object({
      ingredientId: z.string().uuid(),
      percentage: z.number().min(0).max(100),
    }),
  ),
  totalCostPerKg: z.number().nonnegative(),
  nutritionalValues: z.object({
    protein: z.number(),
    energy: z.number(),
    fat: z.number(),
    fiber: z.number(),
    calcium: z.number(),
    phosphorus: z.number(),
    lysine: z.number(),
    methionine: z.number(),
  }),
  mixingInstructions: z.string().max(1000).nullish(),
})

const updateIngredientPriceSchema = z.object({
  ingredientId: z.string().uuid(),
  pricePerKg: z.number().nonnegative(),
  isAvailable: z.boolean().default(true),
})

const getPriceHistorySchema = z.object({
  ingredientId: z.string().uuid(),
})

const linkFormulationToBatchSchema = z.object({
  formulationId: z.string().uuid(),
  batchId: z.string().uuid(),
})

/**
 * Run feed optimization for given species and stage
 */
export const runOptimizationFn = createServerFn({ method: 'POST' })
  .inputValidator(runOptimizationSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Get ingredients and requirements
      const [ingredients, requirements] = await Promise.all([
        getIngredients(db),
        getNutritionalRequirements(db, data.species, data.stage),
      ])

      if (!requirements) {
        throw new AppError('VALIDATION_ERROR', {
          message: `No nutritional requirements found for ${data.species} ${data.stage}`,
        })
      }

      // Get user prices or use provided prices
      let userPrices = data.ingredientPrices || []
      if (userPrices.length === 0) {
        const dbPrices = await getUserIngredientPrices(db, session.user.id)
        userPrices = dbPrices.map((p) => ({
          ingredientId: p.ingredientId,
          pricePerKg: parseFloat(p.pricePerKg),
          isAvailable: p.isAvailable,
        }))
      }

      // Build optimization model
      const optimizationIngredients = buildOptimizationModel(
        ingredients,
        userPrices.map((p) => ({
          ingredientId: p.ingredientId,
          pricePerKg: toDbString(p.pricePerKg),
          isAvailable: p.isAvailable,
        })),
      )

      if (optimizationIngredients.length === 0) {
        throw new AppError('VALIDATION_ERROR', {
          message: 'No ingredients available with prices',
        })
      }

      // Run optimization
      const result = await buildOptModel(
        optimizationIngredients,
        applySafetyMargin(
          {
            minProteinPercent: parseFloat(requirements.minProteinPercent),
            minEnergyKcalKg: requirements.minEnergyKcalKg,
            maxFiberPercent: parseFloat(requirements.maxFiberPercent),
            minCalciumPercent: parseFloat(requirements.minCalciumPercent),
            minPhosphorusPercent: parseFloat(requirements.minPhosphorusPercent),
            minLysinePercent: parseFloat(requirements.minLysinePercent),
            minMethioninePercent: parseFloat(requirements.minMethioninePercent),
          },
          data.safetyMargin,
        ),
      )

      if (!result.feasible) {
        return {
          ...result,
          suggestions: suggestSubstitutions(
            result.infeasibilityReport || 'Unknown error',
          ),
        }
      }

      // Scale to batch size and generate mixing instructions
      const scaledIngredients = scaleToBatchSize(
        result.ingredients,
        data.batchSizeKg,
      )
      const mixingInstructions = generateMixingInstructions(scaledIngredients)

      return {
        ...result,
        scaledIngredients,
        mixingInstructions,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to run optimization',
        cause: error,
      })
    }
  })

/**
 * Save formulation for future use
 */
export const saveFormulationFn = createServerFn({ method: 'POST' })
  .inputValidator(saveFormulationSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      const formulationId = await saveFormulation(db, {
        userId: session.user.id,
        name: data.name,
        species: data.species,
        productionStage: data.stage,
        batchSizeKg: toDbString(data.batchSizeKg),
        ingredients: data.ingredients,
        totalCostPerKg: toDbString(data.totalCostPerKg),
        nutritionalValues: data.nutritionalValues,
        mixingInstructions: data.mixingInstructions || null,
      })

      return { id: formulationId }
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to save formulation',
        cause: error,
      })
    }
  })

/**
 * Get user's saved formulations
 */
export const getFormulationsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      return await getFormulations(db, session.user.id)
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to get formulations',
        cause: error,
      })
    }
  },
)

/**
 * Update ingredient price for user
 */
export const updateIngredientPriceFn = createServerFn({ method: 'POST' })
  .inputValidator(updateIngredientPriceSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      await updateIngredientPrice(
        db,
        session.user.id,
        data.ingredientId,
        toDbString(data.pricePerKg),
        data.isAvailable,
      )

      return { success: true }
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to update ingredient price',
        cause: error,
      })
    }
  })

/**
 * Get price history for ingredient
 */
export const getPriceHistoryFn = createServerFn({ method: 'GET' })
  .inputValidator(getPriceHistorySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      const priceData = await db
        .selectFrom('user_ingredient_prices')
        .select(['priceHistory', 'lastUpdated'])
        .where('userId', '=', session.user.id)
        .where('ingredientId', '=', data.ingredientId)
        .executeTakeFirst()

      return priceData || { priceHistory: [], lastUpdated: null }
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to get price history',
        cause: error,
      })
    }
  })

/**
 * Link formulation to batch (for tracking usage)
 */
export const linkFormulationToBatchFn = createServerFn({ method: 'POST' })
  .inputValidator(linkFormulationToBatchSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { recordFormulationUsage } = await import('./repository')
      const { toNumber } = await import('~/features/settings/currency')

      // Verify user owns both formulation and batch
      const [formulation, batch] = await Promise.all([
        getFormulationById(db, data.formulationId, session.user.id),
        db
          .selectFrom('batches')
          .innerJoin('user_farms', 'user_farms.farmId', 'batches.farmId')
          .select(['batches.id', 'batches.initialQuantity'])
          .where('batches.id', '=', data.batchId)
          .where('user_farms.userId', '=', session.user.id)
          .executeTakeFirst(),
      ])

      if (!formulation || !batch) {
        throw new AppError('ACCESS_DENIED', {
          message: 'Formulation or batch not found',
        })
      }

      // Calculate total cost for the batch
      const batchSizeKg = toNumber(formulation.batchSizeKg)
      const costPerKg = toNumber(formulation.totalCostPerKg)
      const totalCost = batchSizeKg * costPerKg

      // Record usage
      await recordFormulationUsage(db, {
        formulationId: data.formulationId,
        batchId: data.batchId,
        userId: session.user.id,
        batchSizeKg: batchSizeKg.toFixed(2),
        totalCost: totalCost.toFixed(2),
        notes: `Linked to batch with ${batch.initialQuantity} animals`,
      })

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to link formulation to batch',
        cause: error,
      })
    }
  })

/**
 * Get all feed ingredients
 */
export const getFeedIngredientsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      return getIngredients(db)
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch ingredients',
        cause: error,
      })
    }
  },
)

/**
 * Get user ingredient prices
 */
export const getUserIngredientPricesFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { requireAuth } = await import('../auth/server-middleware')
  const session = await requireAuth()

  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    return getUserIngredientPrices(db, session.user.id)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch user prices',
      cause: error,
    })
  }
})

/**
 * Get ingredients with user prices
 */
export const getIngredientsWithPricesFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { requireAuth } = await import('../auth/server-middleware')
  const session = await requireAuth()

  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const [ingredients, prices] = await Promise.all([
      getIngredients(db),
      getUserIngredientPrices(db, session.user.id),
    ])

    return ingredients.map((ing) => ({
      ...ing,
      userPrice: prices.find((p) => p.ingredientId === ing.id),
    }))
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch ingredients with prices',
      cause: error,
    })
  }
})

/**
 * Compare multiple formulations (stub)
 */
export const compareFormulationsFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ formulationIds: z.array(z.string().uuid()) }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      const formulations = await Promise.all(
        data.formulationIds.map((id) =>
          getFormulationById(db, id, session.user.id),
        ),
      )

      return formulations.filter(Boolean)
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to compare formulations',
        cause: error,
      })
    }
  })

/**
 * Export comparison as PDF (stub)
 */
export const exportComparisonPdfFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ comparisonData: z.any() }))
  .handler(() => {
    throw new AppError('VALIDATION_ERROR', {
      message: 'PDF export not yet implemented',
    })
  })

/**
 * Generate share code for formulation
 */
export const generateShareCodeFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ formulationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      const formulation = await getFormulationById(
        db,
        data.formulationId,
        session.user.id,
      )
      if (!formulation) {
        throw new AppError('FORMULATION_NOT_FOUND')
      }

      const shareCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()

      await db
        .updateTable('saved_formulations')
        .set({ shareCode })
        .where('id', '=', data.formulationId)
        .execute()

      return { shareCode }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to generate share code',
        cause: error,
      })
    }
  })

/**
 * Delete formulation (stub)
 */
export const deleteFormulationFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ formulationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      await db
        .deleteFrom('saved_formulations')
        .where('id', '=', data.formulationId)
        .where('userId', '=', session.user.id)
        .execute()

      return { success: true }
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to delete formulation',
        cause: error,
      })
    }
  })

/**
 * Get formulation detail (alias for getFormulationById)
 */
export const getFormulationDetailFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ formulationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      return getFormulationById(db, data.formulationId, session.user.id)
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch formulation',
        cause: error,
      })
    }
  })

/**
 * Re-optimize formulation with current prices (stub)
 */
export const reOptimizeFormulationFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ formulationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      const formulation = await getFormulationById(
        db,
        data.formulationId,
        session.user.id,
      )
      if (!formulation) {
        throw new AppError('FORMULATION_NOT_FOUND')
      }

      // Get current prices and requirements
      const [ingredients, requirements, prices] = await Promise.all([
        getIngredients(db),
        getNutritionalRequirements(
          db,
          formulation.species,
          formulation.productionStage,
        ),
        getUserIngredientPrices(db, session.user.id),
      ])

      if (!requirements) {
        throw new AppError('REQUIREMENT_NOT_FOUND')
      }

      // Run optimization with current prices
      const pricedIngredients: Array<any> = ingredients.map((ing) => {
        const price = prices.find((p) => p.ingredientId === ing.id)
        return {
          id: ing.id,
          name: ing.name,
          pricePerKg: price ? parseFloat(price.pricePerKg) : 0,
          proteinPercent: parseFloat(ing.proteinPercent),
          energyKcalKg: ing.energyKcalKg,
          fatPercent: parseFloat(ing.fatPercent),
          fiberPercent: parseFloat(ing.fiberPercent),
          calciumPercent: parseFloat(ing.calciumPercent),
          phosphorusPercent: parseFloat(ing.phosphorusPercent),
          lysinePercent: parseFloat(ing.lysinePercent),
          methioninePercent: parseFloat(ing.methioninePercent),
          maxInclusionPercent: parseFloat(ing.maxInclusionPercent),
        }
      })

      const result = await buildOptModel(pricedIngredients, {
        minProteinPercent: parseFloat(requirements.minProteinPercent),
        minEnergyKcalKg: requirements.minEnergyKcalKg,
        maxFiberPercent: parseFloat(requirements.maxFiberPercent),
        minCalciumPercent: parseFloat(requirements.minCalciumPercent),
        minPhosphorusPercent: parseFloat(requirements.minPhosphorusPercent),
        minLysinePercent: parseFloat(requirements.minLysinePercent),
        minMethioninePercent: parseFloat(requirements.minMethioninePercent),
      })

      // Scale and generate mixing instructions
      const scaledIngredients = scaleToBatchSize(
        result.ingredients,
        Number(formulation.batchSizeKg),
      )
      const mixingInstructions = generateMixingInstructions(scaledIngredients)

      return {
        ...result,
        scaledIngredients,
        mixingInstructions,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to re-optimize formulation',
        cause: error,
      })
    }
  })

/**
 * Record formulation usage
 */
export const recordFormulationUsageFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      formulationId: z.string().uuid(),
      batchId: z.string().uuid().optional(),
      batchSizeKg: z.number().positive(),
      totalCost: z.number().nonnegative(),
      notes: z.string().max(500).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { recordFormulationUsage } = await import('./repository')

      return await recordFormulationUsage(db, {
        formulationId: data.formulationId,
        batchId: data.batchId,
        userId: session.user.id,
        batchSizeKg: data.batchSizeKg.toFixed(2),
        totalCost: data.totalCost.toFixed(2),
        notes: data.notes,
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to record formulation usage',
        cause: error,
      })
    }
  })

/**
 * Get formulation usage history
 */
export const getFormulationUsageHistoryFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ formulationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { getFormulationUsageHistory } = await import('./repository')

      return await getFormulationUsageHistory(db, data.formulationId)
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to get usage history',
        cause: error,
      })
    }
  })

/**
 * Get formulation usage statistics
 */
export const getFormulationUsageStatsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ formulationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { getFormulationUsageStats } = await import('./repository')

      return await getFormulationUsageStats(db, data.formulationId)
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to get usage stats',
        cause: error,
      })
    }
  })

/**
 * Import ingredient prices from CSV
 */
export const importIngredientPricesCsvFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ csvContent: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    try {
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { getIngredients: fetchIngredients, bulkUpdateIngredientPrices } =
        await import('./repository')

      // Parse CSV
      const lines = data.csvContent.trim().split('\n')
      if (lines.length < 2) {
        throw new AppError('VALIDATION_ERROR', {
          metadata: {
            error: 'CSV must have at least a header and one data row',
          },
        })
      }

      // Get all ingredients for name matching
      const ingredients = await fetchIngredients(db)
      const ingredientMap = new Map(
        ingredients.map((ing) => [ing.name.toLowerCase(), ing.id]),
      )

      // Parse prices
      const updates: Array<{ ingredientId: string; pricePerKg: string }> = []
      const errors: Array<string> = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [name, price] = line.split(',').map((s) => s.trim())
        if (!name || !price) {
          errors.push(`Line ${i + 1}: Invalid format`)
          continue
        }

        const ingredientId = ingredientMap.get(name.toLowerCase())
        if (!ingredientId) {
          errors.push(`Line ${i + 1}: Ingredient "${name}" not found`)
          continue
        }

        const priceNum = parseFloat(price)
        if (isNaN(priceNum) || priceNum < 0) {
          errors.push(`Line ${i + 1}: Invalid price "${price}"`)
          continue
        }

        updates.push({
          ingredientId,
          pricePerKg: toDbString(priceNum),
        })
      }

      // Bulk update
      if (updates.length > 0) {
        await bulkUpdateIngredientPrices(db, session.user.id, updates)
      }

      return {
        success: updates.length,
        errors: errors.length,
        errorMessages: errors,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to import prices',
        cause: error,
      })
    }
  })
