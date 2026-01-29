/**
 * Database operations for feed formulation
 * Pure data access - no business logic
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

export interface IngredientWithPrice {
    id: string
    name: string
    category: string
    proteinPercent: string
    energyKcalKg: number
    fatPercent: string
    fiberPercent: string
    calciumPercent: string
    phosphorusPercent: string
    lysinePercent: string
    methioninePercent: string
    maxInclusionPercent: string
    pricePerKg?: string
    isAvailable?: boolean
    lastUpdated?: Date
}

export interface FormulationInsert {
    userId: string
    name: string
    species: string
    productionStage: string
    batchSizeKg: string
    ingredients: Array<{ ingredientId: string; percentage: number }>
    totalCostPerKg: string
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
    mixingInstructions?: string | null
}

/**
 * Insert a new ingredient (for testing)
 */
export async function insertIngredient(
    db: Kysely<Database>,
    data: {
        name: string
        category: string
        proteinPercent: string
        energyKcalKg: number
        fatPercent: string
        fiberPercent: string
        calciumPercent: string
        phosphorusPercent: string
        lysinePercent: string
        methioninePercent: string
        maxInclusionPercent: string
        isActive: boolean
    },
): Promise<string> {
    const result = await db
        .insertInto('feed_ingredients')
        .values(data as any)
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

/**
 * Insert nutritional requirement (for testing)
 */
export async function insertNutritionalRequirement(
    db: Kysely<Database>,
    data: {
        species: string
        productionStage: string
        minProteinPercent: string
        minEnergyKcalKg: number
        maxFiberPercent: string
        minCalciumPercent: string
        minPhosphorusPercent: string
        minLysinePercent: string
        minMethioninePercent: string
    },
): Promise<string> {
    const result = await db
        .insertInto('nutritional_requirements')
        .values(data as any)
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

/**
 * Insert user ingredient price (for testing)
 */
export async function insertUserIngredientPrice(
    db: Kysely<Database>,
    data: {
        userId: string
        ingredientId: string
        pricePerKg: string
        isAvailable: boolean
    },
): Promise<string> {
    const result = await db
        .insertInto('user_ingredient_prices')
        .values({
            ...data,
            priceHistory: [] as any,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

/**
 * Get all feed ingredients
 */
export async function getIngredients(
    db: Kysely<Database>,
): Promise<Array<IngredientWithPrice>> {
    return await db
        .selectFrom('feed_ingredients')
        .selectAll()
        .orderBy('category')
        .orderBy('name')
        .execute()
}

/**
 * Get ingredient by ID
 */
export async function getIngredientById(
    db: Kysely<Database>,
    ingredientId: string,
): Promise<IngredientWithPrice | null> {
    return (
        (await db
            .selectFrom('feed_ingredients')
            .selectAll()
            .where('id', '=', ingredientId)
            .executeTakeFirst()) || null
    )
}

/**
 * Get nutritional requirements for species and stage
 */
export async function getNutritionalRequirements(
    db: Kysely<Database>,
    species: string,
    stage: string,
) {
    return await db
        .selectFrom('nutritional_requirements')
        .selectAll()
        .where('species', '=', species)
        .where('productionStage', '=', stage)
        .executeTakeFirst()
}

/**
 * Get user's ingredient prices
 */
export async function getUserIngredientPrices(
    db: Kysely<Database>,
    userId: string,
): Promise<
    Array<{
        ingredientId: string
        pricePerKg: string
        isAvailable: boolean
        lastUpdated: Date
    }>
> {
    return await db
        .selectFrom('user_ingredient_prices')
        .select(['ingredientId', 'pricePerKg', 'isAvailable', 'lastUpdated'])
        .where('userId', '=', userId)
        .execute()
}

/**
 * Update ingredient price for user
 */
export async function updateIngredientPrice(
    db: Kysely<Database>,
    userId: string,
    ingredientId: string,
    pricePerKg: string,
    isAvailable: boolean = true,
): Promise<void> {
    const now = new Date()

    // Get current price for history
    const current = await db
        .selectFrom('user_ingredient_prices')
        .select(['pricePerKg', 'priceHistory'])
        .where('userId', '=', userId)
        .where('ingredientId', '=', ingredientId)
        .executeTakeFirst()

    const newHistoryEntry = {
        date: now.toISOString(),
        price: pricePerKg,
    }

    const updatedHistory = current
        ? [...current.priceHistory, newHistoryEntry].slice(-50) // Keep last 50 entries
        : [newHistoryEntry]

    await db
        .insertInto('user_ingredient_prices')
        .values({
            userId,
            ingredientId,
            pricePerKg,
            isAvailable,
            lastUpdated: now,
            priceHistory: updatedHistory,
        })
        .onConflict((oc) =>
            oc.columns(['userId', 'ingredientId']).doUpdateSet({
                pricePerKg,
                isAvailable,
                lastUpdated: now,
                priceHistory: updatedHistory,
            }),
        )
        .execute()
}

/**
 * Save formulation
 */
export async function saveFormulation(
    db: Kysely<Database>,
    data: FormulationInsert,
): Promise<string> {
    const result = await db
        .insertInto('saved_formulations')
        .values(data)
        .returning('id')
        .executeTakeFirstOrThrow()

    return result.id
}

/**
 * Get user's formulations
 */
export async function getFormulations(
    db: Kysely<Database>,
    userId: string,
): Promise<
    Array<{
        id: string
        name: string
        species: string
        productionStage: string
        batchSizeKg: string
        totalCostPerKg: string
        usageCount: number
        createdAt: Date
    }>
> {
    return await db
        .selectFrom('saved_formulations')
        .select([
            'id',
            'name',
            'species',
            'productionStage',
            'batchSizeKg',
            'totalCostPerKg',
            'usageCount',
            'createdAt',
        ])
        .where('userId', '=', userId)
        .orderBy('createdAt', 'desc')
        .execute()
}

/**
 * Record formulation usage
 */
export async function recordFormulationUsage(
    db: Kysely<Database>,
    data: {
        formulationId: string
        batchId?: string | null
        userId: string
        batchSizeKg: string
        totalCost: string
        notes?: string | null
    },
): Promise<string> {
    // Insert usage record
    const result = await db
        .insertInto('formulation_usage')
        .values({
            formulationId: data.formulationId,
            batchId: data.batchId || null,
            userId: data.userId,
            batchSizeKg: data.batchSizeKg,
            totalCost: data.totalCost,
            notes: data.notes || null,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

    // Increment usage count
    await db
        .updateTable('saved_formulations')
        .set((eb) => ({
            usageCount: eb('usageCount', '+', 1),
        }))
        .where('id', '=', data.formulationId)
        .execute()

    return result.id
}

/**
 * Get formulation usage history
 */
export async function getFormulationUsageHistory(
    db: Kysely<Database>,
    formulationId: string,
): Promise<
    Array<{
        id: string
        batchId: string | null
        batchName: string | null
        usedAt: Date
        batchSizeKg: string
        totalCost: string
        notes: string | null
    }>
> {
    return await db
        .selectFrom('formulation_usage')
        .leftJoin('batches', 'batches.id', 'formulation_usage.batchId')
        .select([
            'formulation_usage.id',
            'formulation_usage.batchId',
            'batches.batchName',
            'formulation_usage.usedAt',
            'formulation_usage.batchSizeKg',
            'formulation_usage.totalCost',
            'formulation_usage.notes',
        ])
        .where('formulation_usage.formulationId', '=', formulationId)
        .orderBy('formulation_usage.usedAt', 'desc')
        .execute()
}

/**
 * Get usage statistics for a formulation
 */
export function getFormulationUsageStats(
    db: Kysely<Database>,
    formulationId: string,
): Promise<{
    timesUsed: number
    lastUsed: Date | null
    totalBatchesProduced: string
    totalCost: string
} | null> {
    return db
        .selectFrom('formulation_usage')
        .select([
            db.fn.count('id').as('timesUsed'),
            db.fn.max('usedAt').as('lastUsed'),
            db.fn.sum('batchSizeKg').as('totalBatchesProduced'),
            db.fn.sum('totalCost').as('totalCost'),
        ])
        .where('formulationId', '=', formulationId)
        .executeTakeFirst() as any
}

/**
 * Get formulation by ID
 */
export async function getFormulationById(
    db: Kysely<Database>,
    formulationId: string,
    userId: string,
) {
    return await db
        .selectFrom('saved_formulations')
        .selectAll()
        .where('id', '=', formulationId)
        .where('userId', '=', userId)
        .executeTakeFirst()
}

/**
 * Update price history for ingredient
 */
export async function updatePriceHistory(
    db: Kysely<Database>,
    userId: string,
    ingredientId: string,
    price: string,
): Promise<void> {
    const now = new Date()
    const newEntry = { date: now.toISOString(), price }

    await db
        .updateTable('user_ingredient_prices')
        .set((eb) => ({
            priceHistory: eb.fn('jsonb_insert', [
                'priceHistory',
                '{0}' as any,
                eb.val(JSON.stringify(newEntry)),
            ]),
            lastUpdated: now,
        }))
        .where('userId', '=', userId)
        .where('ingredientId', '=', ingredientId)
        .execute()
}

/**
 * Get formulation usage statistics
 */
export function getFormulationUsage(): {
    timesUsed: number
    lastUsed: Date | null
    totalBatchesProduced: number
} {
    // This would require a formulation_usage table or linking to batches
    // For now, return placeholder data
    return {
        timesUsed: 0,
        lastUsed: null,
        totalBatchesProduced: 0,
    }
}

/**
 * Bulk update ingredient prices
 */
export async function bulkUpdateIngredientPrices(
    db: Kysely<Database>,
    userId: string,
    updates: Array<{ ingredientId: string; pricePerKg: string }>,
): Promise<void> {
    const now = new Date()

    for (const { ingredientId, pricePerKg } of updates) {
        // Get existing price history
        const existing = await db
            .selectFrom('user_ingredient_prices')
            .select(['priceHistory'])
            .where('userId', '=', userId)
            .where('ingredientId', '=', ingredientId)
            .executeTakeFirst()

        const priceHistory = existing?.priceHistory || []
        const updatedHistory = [
            ...priceHistory,
            { date: now.toISOString(), price: pricePerKg },
        ]

        await db
            .insertInto('user_ingredient_prices')
            .values({
                userId,
                ingredientId,
                pricePerKg,
                isAvailable: true,
                lastUpdated: now,
                priceHistory: JSON.stringify(updatedHistory) as any,
            })
            .onConflict((oc) =>
                oc.columns(['userId', 'ingredientId']).doUpdateSet({
                    pricePerKg,
                    isAvailable: true,
                    lastUpdated: now,
                    priceHistory: JSON.stringify(updatedHistory) as any,
                }),
            )
            .execute()
    }
}
