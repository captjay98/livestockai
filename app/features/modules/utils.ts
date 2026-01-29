/**
 * Module Utility Functions
 *
 * Utilities for mapping between farm types, modules, and livestock types.
 * Uses MODULE_METADATA for livestock type lookups.
 */

import { DEFAULT_MODULES_BY_FARM_TYPE, MODULE_METADATA } from './constants'
import type { LivestockType, ModuleKey, ModuleMetadata } from './types'

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

/**
 * Get module metadata for enabled modules.
 * Returns metadata in the same order as the input modules array.
 */
export function getEnabledModuleMetadata(
  enabledModules: Array<ModuleKey>,
): Array<ModuleMetadata> {
  return enabledModules.map((key) => MODULE_METADATA[key])
}

/**
 * Get feed types for a set of enabled modules.
 * Returns unique feed types from all enabled modules.
 */
export function getFeedTypesForModules(
  enabledModules: Array<ModuleKey>,
): Array<string> {
  const feedTypes = new Set<string>()
  for (const key of enabledModules) {
    for (const feedType of MODULE_METADATA[key].feedTypes) {
      feedTypes.add(feedType)
    }
  }
  return Array.from(feedTypes)
}

/**
 * Get source size options for a livestock type.
 * Finds the module that contains this livestock type and returns its source sizes.
 */
export function getSourceSizeForLivestockType(
  livestockType: LivestockType,
): Array<{ value: string; label: string }> {
  const moduleEntry = Object.values(MODULE_METADATA).find((metadata) =>
    metadata.livestockTypes.includes(livestockType),
  )
  return moduleEntry?.sourceSizeOptions ?? []
}

/**
 * Get structure types for a set of enabled modules.
 * Returns unique structure types from all enabled modules.
 */
export function getStructureTypesForModules(
  enabledModules: Array<ModuleKey>,
): Array<string> {
  const structureTypes = new Set<string>()
  for (const key of enabledModules) {
    for (const structureType of MODULE_METADATA[key].structureTypes) {
      structureTypes.add(structureType)
    }
  }
  return Array.from(structureTypes)
}
