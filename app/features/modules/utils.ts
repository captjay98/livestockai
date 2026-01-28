import { MODULE_METADATA } from './constants'

import type {
    FeedType,
    LivestockType,
    ModuleKey,
    ModuleMetadata,
    StructureType,
} from './types'

/**
 * Get metadata for enabled modules
 */
export function getEnabledModuleMetadata(
    enabledModules: Array<ModuleKey>,
): Array<ModuleMetadata> {
    return enabledModules.map((key) => MODULE_METADATA[key])
}

/**
 * Get all livestock types for enabled modules
 */
export function getLivestockTypesForModules(
    enabledModules: Array<ModuleKey>,
): Array<LivestockType> {
    const metadata = getEnabledModuleMetadata(enabledModules)
    const allTypes = metadata.flatMap((m) => m.livestockTypes)

    // Remove duplicates
    return Array.from(new Set(allTypes))
}

/**
 * Get all feed types for enabled modules
 */
export function getFeedTypesForModules(
    enabledModules: Array<ModuleKey>,
): Array<FeedType> {
    const metadata = getEnabledModuleMetadata(enabledModules)
    const allFeedTypes = metadata.flatMap((m) => m.feedTypes)

    // Remove duplicates
    return Array.from(new Set(allFeedTypes))
}

/**
 * Get all structure types for enabled modules
 */
export function getStructureTypesForModules(
    enabledModules: Array<ModuleKey>,
): Array<StructureType> {
    const metadata = getEnabledModuleMetadata(enabledModules)
    const allStructureTypes = metadata.flatMap((m) => m.structureTypes)

    // Remove duplicates
    return Array.from(new Set(allStructureTypes))
}

/**
 * Get source size options for a specific livestock type
 */
export function getSourceSizeForLivestockType(
    livestockType: LivestockType,
): Array<{ value: string; label: string }> {
    // Find the module that handles this livestock type
    const moduleEntry = Object.entries(MODULE_METADATA).find(([_, metadata]) =>
        metadata.livestockTypes.includes(livestockType),
    )

    return moduleEntry ? moduleEntry[1].sourceSizeOptions : []
}

/**
 * Get module key for a livestock type
 */
export function getModuleKeyForLivestockType(
    livestockType: LivestockType,
): ModuleKey | undefined {
    const moduleEntry = Object.entries(MODULE_METADATA).find(([_, metadata]) =>
        metadata.livestockTypes.includes(livestockType),
    )

    return moduleEntry ? (moduleEntry[0] as ModuleKey) : undefined
}
