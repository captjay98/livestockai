/**
 * Pure business logic for farm operations.
 * All functions are side-effect-free and easily unit testable.
 */

export interface CreateFarmData {
  name: string
  location: string
  type:
    | 'poultry'
    | 'aquaculture'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'
}

export interface UpdateFarmData {
  name?: string
  location?: string
  type?:
    | 'poultry'
    | 'aquaculture'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'
}

/**
 * Check if a farm can be deleted based on dependent records.
 * A farm can only be deleted if it has no related batches, sales, or expenses.
 *
 * @param hasDependents - Object indicating presence of dependent records
 * @returns True if farm can be deleted, false otherwise
 *
 * @example
 * ```ts
 * const canDelete = canDeleteFarm({
 *   hasBatches: false,
 *   hasSales: false,
 *   hasExpenses: true
 * })
 * // Returns: false (cannot delete with expenses)
 * ```
 */
export function canDeleteFarm(hasDependents: {
  hasBatches: boolean
  hasSales: boolean
  hasExpenses: boolean
}): boolean {
  return !(
    hasDependents.hasBatches ||
    hasDependents.hasSales ||
    hasDependents.hasExpenses
  )
}

/**
 * Check if a user is the last owner of a farm.
 * The last owner cannot be removed or demoted to prevent orphaned farms.
 *
 * @param otherOwnersCount - Number of other owners (excluding the current user)
 * @returns True if the user is the last owner, false otherwise
 *
 * @example
 * ```ts
 * isLastOwner(0)  // Returns: true (is the last owner)
 * isLastOwner(1)  // Returns: false (there are other owners)
 * isLastOwner(5)  // Returns: false
 * ```
 */
export function isLastOwner(otherOwnersCount: number): boolean {
  return otherOwnersCount === 0
}

/**
 * Determine if admin users should see all farms in the system.
 * Admin users get unrestricted access to all farms for oversight purposes.
 *
 * @param userRole - The user's global role
 * @returns True if user should see all farms, false otherwise
 *
 * @example
 * ```ts
 * shouldReturnAllFarmsForAdmin('admin')   // Returns: true
 * shouldReturnAllFarmsForAdmin('user')    // Returns: false
 * ```
 */
export function shouldReturnAllFarmsForAdmin(userRole: string): boolean {
  return userRole === 'admin'
}

/**
 * Validate farm data before creation.
 * Returns validation error message or null if valid.
 *
 * @param data - Farm creation data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateFarmData({
 *   name: 'Green Acres',
 *   location: 'Nigeria',
 *   type: 'poultry'
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateFarmData({
 *   name: '',
 *   location: 'Nigeria',
 *   type: 'poultry'
 * })
 * // Returns: "Farm name is required"
 * ```
 */
export function validateFarmData(data: CreateFarmData): string | null {
  if (!data.name || data.name.trim() === '') {
    return 'Farm name is required'
  }

  if (!data.location || data.location.trim() === '') {
    return 'Farm location is required'
  }

  const validTypes = [
    'poultry',
    'aquaculture',
    'mixed',
    'cattle',
    'goats',
    'sheep',
    'bees',
    'multi',
  ]

  if (!validTypes.includes(data.type)) {
    return 'Farm type is required and must be valid'
  }

  return null
}

/**
 * Validate farm update data.
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if valid
 */
export function validateUpdateData(data: UpdateFarmData): string | null {
  if (data.name !== undefined && data.name.trim() === '') {
    return 'Farm name cannot be empty'
  }

  if (data.location !== undefined && data.location.trim() === '') {
    return 'Farm location cannot be empty'
  }

  const validTypes = [
    'poultry',
    'aquaculture',
    'mixed',
    'cattle',
    'goats',
    'sheep',
    'bees',
    'multi',
  ]

  if (data.type !== undefined && !validTypes.includes(data.type)) {
    return 'Farm type must be valid'
  }

  return null
}

/**
 * Check if a user can be removed from a farm.
 * Users can only be removed if they are not the last owner.
 *
 * @param isOwner - Whether the user is an owner
 * @param otherOwnersCount - Number of other owners
 * @returns Object with canRemove flag and error message if applicable
 */
export function canRemoveUserFromFarm(
  isOwner: boolean,
  otherOwnersCount: number,
): { canRemove: boolean; error?: string } {
  if (isOwner && isLastOwner(otherOwnersCount)) {
    return {
      canRemove: false,
      error: 'Cannot remove the last owner of a farm',
    }
  }
  return { canRemove: true }
}

/**
 * Check if a user's role can be changed.
 * Owners can only be demoted if there are other owners.
 *
 * @param currentRole - User's current role
 * @param newRole - The role to change to
 * @param otherOwnersCount - Number of other owners
 * @returns Object with canChange flag and error message if applicable
 */
export function canChangeUserRole(
  currentRole: string,
  newRole: string,
  otherOwnersCount: number,
): { canChange: boolean; error?: string } {
  if (currentRole === 'owner' && newRole !== 'owner') {
    if (isLastOwner(otherOwnersCount)) {
      return {
        canChange: false,
        error: 'Cannot demote the last owner of a farm',
      }
    }
  }
  return { canChange: true }
}

/**
 * Validate farm role assignment.
 *
 * @param role - The role to validate
 * @returns Validation error message, or null if valid
 */
export function validateFarmRole(role: string): string | null {
  const validRoles = ['owner', 'manager', 'viewer', 'worker', 'observer']

  if (!validRoles.includes(role)) {
    return `Role must be one of: ${validRoles.join(', ')}`
  }

  return null
}
