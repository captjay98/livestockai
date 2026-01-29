/**
 * Module Utility Functions
 *
 * Utilities for mapping between farm types, modules, and livestock types.
 * Uses MODULE_METADATA for livestock type lookups.
 */

import { DEFAULT_MODULES_BY_FARM_TYPE, MODULE_METADATA } from './constants'
import type { ModuleKey } from './types'

/**
 * Get default modules for a farm type.
 * Single-species types return their corresponding module.
 * 'mixed' returns poultry + aquaculture.
 * 'multi' returns empty array (user selects manually).
 */
export function getDefaultModulesForFarmType(
  farmType: string,
): Array<ModuleKey> {
  return DEFAULT_MODULES_BY_FARM_TYPE[farmType] ?? []
}

/**
 * Get livestock types for a set of enabled modules.
 * Uses MODULE_METADATA[moduleKey].livestockTypes[0] for mapping.
 * Example: ['poultry', 'aquaculture'] → ['poultry', 'fish']
 */
export function getLivestockTypesForModules(
  modules: Array<ModuleKey>,
): Array<string> {
  return modules.map((m) => MODULE_METADATA[m].livestockTypes[0])
}

/**
 * Filter livestock type options based on enabled modules.
 * Used in BatchDialog to show only relevant livestock types.
 */
export function filterLivestockTypesByModules(
  allTypes: Array<{ value: string; label: string }>,
  enabledModules: Array<ModuleKey>,
): Array<{ value: string; label: string }> {
  // If no modules specified, return all types
  if (enabledModules.length === 0) {
    return allTypes
  }
  const allowedTypes = getLivestockTypesForModules(enabledModules)
  return allTypes.filter((t) => allowedTypes.includes(t.value))
}
