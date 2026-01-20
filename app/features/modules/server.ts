import { createServerFn } from '@tanstack/react-start'

import { DEFAULT_MODULES_BY_FARM_TYPE } from './constants'

import type { FarmModule, ModuleKey } from './types'
import { AppError } from '~/lib/errors'

/**
 * Fetches all module state records for a farm.
 *
 * @param farmId - ID of the target farm
 * @returns Array of module configuration records
 */
export async function getFarmModules(
  farmId: string,
): Promise<Array<FarmModule>> {
  const { db } = await import('~/lib/db')

  try {
    const modules = await db
      .selectFrom('farm_modules')
      .selectAll()
      .where('farmId', '=', farmId)
      .execute()

    return modules.map((m) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }))
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch farm modules',
      cause: error,
    })
  }
}

/**
 * Get enabled module keys for a farm
 */
export async function getEnabledModules(
  farmId: string,
): Promise<Array<ModuleKey>> {
  const modules = await getFarmModules(farmId)
  return modules.filter((m) => m.enabled).map((m) => m.moduleKey)
}

/**
 * Initializes a new farm with a set of active modules based on its primary type.
 *
 * @param farmId - Target farm
 * @param farmType - Category (e.g., 'poultry', 'fish')
 */
export async function createDefaultModules(
  farmId: string,
  farmType: string,
): Promise<void> {
  const { db } = await import('~/lib/db')

  try {
    // Get default modules for this farm type (empty array for unknown types)
    const defaultModules = DEFAULT_MODULES_BY_FARM_TYPE[farmType] ?? []

    // For 'multi' type or empty defaults, don't create any defaults
    if (defaultModules.length === 0) {
      return
    }

    // Create all module records (enabled by default)
    const allModules: Array<ModuleKey> = [
      'poultry',
      'aquaculture',
      'cattle',
      'goats',
      'sheep',
      'bees',
    ]

    const moduleRecords = allModules.map((moduleKey) => ({
      farmId,
      moduleKey,
      enabled: defaultModules.includes(moduleKey),
    }))

    await db.insertInto('farm_modules').values(moduleRecords).execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create default modules',
      cause: error,
    })
  }
}

/**
 * Enables or disables a specific subsystem (e.g., 'bees') for a farm.
 * Handles both new module enabling and updating existing states.
 *
 * @param farmId - Target farm
 * @param moduleKey - Logic identifier
 * @param enabled - Target state
 */
export async function toggleModule(
  farmId: string,
  moduleKey: ModuleKey,
  enabled: boolean,
): Promise<void> {
  const { db } = await import('~/lib/db')
  try {
    // Check if module record exists
    const existing = await db
      .selectFrom('farm_modules')
      .selectAll()
      .where('farmId', '=', farmId)
      .where('moduleKey', '=', moduleKey)
      .executeTakeFirst()

    if (existing) {
      // Update existing record
      await db
        .updateTable('farm_modules')
        .set({ enabled })
        .where('farmId', '=', farmId)
        .where('moduleKey', '=', moduleKey)
        .execute()
    } else {
      // Create new record
      await db
        .insertInto('farm_modules')
        .values({
          farmId,
          moduleKey,
          enabled,
        })
        .execute()
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to toggle module',
      cause: error,
    })
  }
}

/**
 * Check if a module can be disabled (no active batches)
 */
export async function canDisableModule(
  farmId: string,
  moduleKey: ModuleKey,
): Promise<boolean> {
  const { db } = await import('~/lib/db')
  const { MODULE_METADATA } = await import('./constants')

  try {
    // Get livestock types for this module
    const metadata = MODULE_METADATA[moduleKey]
    const livestockTypes = metadata.livestockTypes

    // Check for active batches with these livestock types
    const activeBatches = await db
      .selectFrom('batches')
      .select('id')
      .where('farmId', '=', farmId)
      .where('status', '=', 'active')
      .where('livestockType', 'in', livestockTypes)
      .limit(1)
      .execute()

    // Can disable if no active batches found
    return activeBatches.length === 0
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to checking disable status',
      cause: error,
    })
  }
}

// Server functions for client-side calls

/**
 * Server function to get farm modules (with auth).
 */
export const getFarmModulesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { checkFarmAccess } = await import('../auth/utils')

    const session = await requireAuth()
    const hasAccess = await checkFarmAccess(session.user.id, data.farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: data.farmId } })
    }

    return getFarmModules(data.farmId)
  })

/**
 * Server function to toggle a module (with auth and validation).
 */
export const toggleModuleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { farmId: string; moduleKey: ModuleKey; enabled: boolean }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { checkFarmAccess } = await import('../auth/utils')

    const session = await requireAuth()
    const hasAccess = await checkFarmAccess(session.user.id, data.farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: data.farmId } })
    }

    // If disabling, check for active batches
    if (!data.enabled) {
      const canDisable = await canDisableModule(data.farmId, data.moduleKey)
      if (!canDisable) {
        throw new AppError('VALIDATION_ERROR', {
          message:
            'Cannot disable module with active batches. Please complete or sell all batches first.',
        })
      }
    }

    await toggleModule(data.farmId, data.moduleKey, data.enabled)

    // Log audit
    const { logAudit } = await import('../logging/audit')
    await logAudit({
      userId: session.user.id,
      action: data.enabled ? 'enable_module' : 'disable_module',
      entityType: 'farm_module',
      entityId: data.farmId,
      details: { moduleKey: data.moduleKey, enabled: data.enabled },
    })

    return { success: true }
  })

/**
 * Server function to check if a module can be disabled (with auth).
 */
export const canDisableModuleFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string; moduleKey: ModuleKey }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { checkFarmAccess } = await import('../auth/utils')

    const session = await requireAuth()
    const hasAccess = await checkFarmAccess(session.user.id, data.farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: data.farmId } })
    }

    return canDisableModule(data.farmId, data.moduleKey)
  })
