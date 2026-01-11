import { MODULE_METADATA } from '../modules/constants'
import type { LivestockType } from '../modules/types'

/**
 * Get species options for a livestock type
 */
export function getSpeciesOptions(
  livestockType: LivestockType,
): Array<{ value: string; label: string }> {
  // Find the module that handles this livestock type
  const moduleEntry = Object.entries(MODULE_METADATA).find(([_, metadata]) =>
    metadata.livestockTypes.includes(livestockType)
  )

  if (!moduleEntry) {
    return []
  }

  return moduleEntry[1].speciesOptions
}
