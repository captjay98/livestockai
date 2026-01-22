/**
 * Business logic for module operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { ModuleKey } from './types'

/**
 * Valid module keys for validation.
 */
const VALID_MODULE_KEYS: Array<ModuleKey> = [
  'poultry',
  'aquaculture',
  'cattle',
  'goats',
  'sheep',
  'bees',
]

/**
 * All available module keys.
 */
export const ALL_MODULE_KEYS: Array<ModuleKey> = [
  'poultry',
  'aquaculture',
  'cattle',
  'goats',
  'sheep',
  'bees',
]

/**
 * Validate that a module key is valid.
 * Returns validation error message or null if valid.
 */
export function validateModuleKey(moduleKey: string): string | null {
  if (!moduleKey || moduleKey.trim() === '') {
    return 'Module key is required'
  }

  if (!VALID_MODULE_KEYS.includes(moduleKey as ModuleKey)) {
    return `Invalid module key: ${moduleKey}. Valid keys are: ${VALID_MODULE_KEYS.join(', ')}`
  }

  return null
}

/**
 * Validate farm type for default module initialization.
 * Returns validation error message or null if valid.
 */
export function validateFarmType(farmType: string): string | null {
  if (!farmType || farmType.trim() === '') {
    return 'Farm type is required'
  }

  const validFarmTypes = [
    'poultry',
    'fishery',
    'cattle',
    'goats',
    'sheep',
    'bees',
    'mixed',
    'multi',
  ]

  if (!validFarmTypes.includes(farmType.toLowerCase())) {
    return `Invalid farm type: ${farmType}. Valid types are: ${validFarmTypes.join(', ')}`
  }

  return null
}

/**
 * Validate that module toggle input is valid.
 * Returns validation error message or null if valid.
 */
export function validateToggleInput(data: {
  farmId: string
  moduleKey: string
  enabled: boolean
}): string | null {
  if (!data.farmId || data.farmId.trim() === '') {
    return 'Farm ID is required'
  }

  const moduleKeyError = validateModuleKey(data.moduleKey)
  if (moduleKeyError) {
    return moduleKeyError
  }

  if (typeof data.enabled !== 'boolean') {
    return 'Enabled status must be a boolean'
  }

  return null
}

/**
 * Determine if a module can be disabled based on active batches.
 * Returns error message if cannot disable, null if safe to disable.
 */
export function validateCanDisable(
  hasActiveBatches: boolean,
  moduleKey: ModuleKey,
): string | null {
  if (hasActiveBatches) {
    return `Cannot disable ${moduleKey} module with active batches. Please complete or sell all batches first.`
  }

  return null
}
