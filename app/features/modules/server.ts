/**
 * Server functions for module management.
 * Orchestrates repository and service layers.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { DEFAULT_MODULES_BY_FARM_TYPE, MODULE_METADATA } from './constants'
import {
  countActiveBatchesByLivestockTypes,
  insertFarmModules,
  selectFarmModules,
  upsertFarmModule,
} from './repository'
import {
  ALL_MODULE_KEYS,
  validateCanDisable,
  validateFarmType,
  validateModuleKey,
  validateToggleInput,
} from './service'
import type { FarmModule, LivestockType, ModuleKey } from './types'
import { AppError } from '~/lib/errors'

// Zod validation schemas
const getFarmModulesSchema = z.object({
  farmId: z.string().uuid(),
})

const toggleModuleSchema = z.object({
  farmId: z.string().uuid(),
  moduleKey: z.enum([
    'poultry',
    'aquaculture',
    'cattle',
    'goats',
    'sheep',
    'bees',
  ]),
  enabled: z.boolean(),
})

const canDisableModuleSchema = z.object({
  farmId: z.string().uuid(),
  moduleKey: z.enum([
    'poultry',
    'aquaculture',
    'cattle',
    'goats',
    'sheep',
    'bees',
  ]),
})

// Repository layer

// Service layer

/**
 * Fetches all module state records for a farm.
 *
 * @param farmId - ID of the target farm
 * @returns Array of module configuration records
 */
export async function getFarmModules(
  farmId: string,
): Promise<Array<FarmModule>> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    return await selectFarmModules(db, farmId)
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
  // Validate farm type
  const validationError = validateFarmType(farmType)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', { message: validationError })
  }

  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    // Get default modules for this farm type (empty array for unknown types)
    const defaultModules = DEFAULT_MODULES_BY_FARM_TYPE[farmType] ?? []

    // For 'multi' type or empty defaults, don't create any defaults
    if (defaultModules.length === 0) {
      return
    }

    // Create all module records (enabled by default)
    const moduleRecords = ALL_MODULE_KEYS.map((moduleKey) => ({
      farmId,
      moduleKey,
      enabled: defaultModules.includes(moduleKey),
    }))

    await insertFarmModules(db, moduleRecords)
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
  // Validate module key
  const validationError = validateModuleKey(moduleKey)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', { message: validationError })
  }

  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    await upsertFarmModule(db, farmId, moduleKey, enabled)
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
  // Validate module key
  const validationError = validateModuleKey(moduleKey)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', { message: validationError })
  }

  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    // Get livestock types for this module
    const metadata = MODULE_METADATA[moduleKey]
    const livestockTypes: ReadonlyArray<LivestockType> = metadata.livestockTypes

    // Check for active batches with these livestock types
    const count = await countActiveBatchesByLivestockTypes(
      db,
      farmId,
      livestockTypes,
    )

    // Can disable if no active batches found
    return count === 0
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to check disable status',
      cause: error,
    })
  }
}

// Server functions for client-side calls

/**
 * Server function to get farm modules (with auth).
 */
export const getFarmModulesFn = createServerFn({ method: 'GET' })
  .inputValidator(getFarmModulesSchema)
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
  .inputValidator(toggleModuleSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { checkFarmAccess } = await import('../auth/utils')

    const session = await requireAuth()
    const hasAccess = await checkFarmAccess(session.user.id, data.farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: data.farmId } })
    }

    // Validate toggle input
    const validationError = validateToggleInput({
      farmId: data.farmId,
      moduleKey: data.moduleKey,
      enabled: data.enabled,
    })
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', { message: validationError })
    }

    // If disabling, check for active batches
    if (!data.enabled) {
      const canDisable = await canDisableModule(data.farmId, data.moduleKey)
      const disableError = validateCanDisable(!canDisable, data.moduleKey)
      if (disableError) {
        throw new AppError('VALIDATION_ERROR', { message: disableError })
      }
    }

    await toggleModule(data.farmId, data.moduleKey, data.enabled)

    // Log audit
    const { logAudit } = await import('~/lib/logging/audit')
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
  .inputValidator(canDisableModuleSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { checkFarmAccess } = await import('../auth/utils')

    const session = await requireAuth()
    const hasAccess = await checkFarmAccess(session.user.id, data.farmId)

    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: data.farmId } })
    }

    // Validate module key
    const validationError = validateModuleKey(data.moduleKey)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', { message: validationError })
    }

    return canDisableModule(data.farmId, data.moduleKey)
  })
