import { createServerFn } from '@tanstack/react-start'

import { DEFAULT_MODULES_BY_FARM_TYPE } from './constants'

import type { FarmModule, ModuleKey } from './types'

/**
 * Get all modules for a farm
 */
export async function getFarmModules(
  farmId: string,
): Promise<Array<FarmModule>> {
  const { db } = await import('~/lib/db')

  const modules = await db
    .selectFrom('farm_modules')
    .selectAll()
    .where('farmId', '=', farmId)
    .execute()

  return modules.map((m) => ({
    ...m,
    createdAt: new Date(m.createdAt),
  }))
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
 * Create default modules for a new farm based on farm type
 */
export async function createDefaultModules(
  farmId: string,
  farmType: string,
): Promise<void> {
  const { db } = await import('~/lib/db')

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
}

/**
 * Toggle a module on or off
 */
export async function toggleModule(
  farmId: string,
  moduleKey: ModuleKey,
  enabled: boolean,
): Promise<void> {
  const { db } = await import('~/lib/db')

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
}

// Server functions for client-side calls

/**
 * Get farm modules (with auth)
 */
export const getFarmModulesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { checkFarmAccess } = await import('../auth/utils')

    const session = await requireAuth()
    const hasAccess = await checkFarmAccess(session.user.id, data.farmId)

    if (!hasAccess) {
      throw new Error('Access denied to this farm')
    }

    return getFarmModules(data.farmId)
  })

/**
 * Toggle module (with auth and validation)
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
      throw new Error('Access denied to this farm')
    }

    // If disabling, check for active batches
    if (!data.enabled) {
      const canDisable = await canDisableModule(data.farmId, data.moduleKey)
      if (!canDisable) {
        throw new Error(
          'Cannot disable module with active batches. Please complete or sell all batches first.',
        )
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
 * Check if module can be disabled (with auth)
 */
export const canDisableModuleFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId: string; moduleKey: ModuleKey }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const { checkFarmAccess } = await import('../auth/utils')

    const session = await requireAuth()
    const hasAccess = await checkFarmAccess(session.user.id, data.farmId)

    if (!hasAccess) {
      throw new Error('Access denied to this farm')
    }

    return canDisableModule(data.farmId, data.moduleKey)
  })
