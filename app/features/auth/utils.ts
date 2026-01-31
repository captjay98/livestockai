import { AppError } from '~/lib/errors'
import { logAndThrow } from '~/lib/logger'

/**
 * Check if user has access to a specific farm
 */
export async function checkFarmAccess(
  userId: string,
  farmId: string,
): Promise<boolean> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    // Get user role
    const user = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user) return false

    // Admin has access to all farms
    if (user.role === 'admin') return true

    // Staff only has access to assigned farms
    const assignment = await db
      .selectFrom('user_farms')
      .select(['farmId'])
      .where('userId', '=', userId)
      .where('farmId', '=', farmId)
      .executeTakeFirst()

    return !!assignment
  } catch (error) {
    logAndThrow('checkFarmAccess', error, 'DATABASE_ERROR')
    return false
  }
}

/**
 * Check if user has access to multiple farms (batch operation)
 * Returns map of farmId -> hasAccess
 */
export async function checkMultipleFarmAccess(
  userId: string,
  farmIds: Array<string>,
): Promise<Record<string, boolean>> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Get user role
    const user = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user) {
      return Object.fromEntries(farmIds.map((id) => [id, false]))
    }

    // Admin has access to all farms
    if (user.role === 'admin') {
      return Object.fromEntries(farmIds.map((id) => [id, true]))
    }

    // Staff - check assignments in single query
    const assignments = await db
      .selectFrom('user_farms')
      .select(['farmId'])
      .where('userId', '=', userId)
      .where('farmId', 'in', farmIds)
      .execute()

    const accessibleSet = new Set(assignments.map((a) => a.farmId))
    return Object.fromEntries(farmIds.map((id) => [id, accessibleSet.has(id)]))
  } catch (error) {
    logAndThrow('checkMultipleFarmAccess', error, 'DATABASE_ERROR')
    return {}
  }
}

/**
 * Get all farms accessible to a user
 */
export async function getUserFarms(userId: string): Promise<Array<string>> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    // Get user role
    const user = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user) return []

    // Admin has access to all farms
    if (user.role === 'admin') {
      const farms = await db.selectFrom('farms').select(['id']).execute()
      return farms.map((f) => f.id)
    }

    // Staff only has access to assigned farms
    const assignments = await db
      .selectFrom('user_farms')
      .select(['farmId'])
      .where('userId', '=', userId)
      .execute()

    return assignments.map((a) => a.farmId)
  } catch (error) {
    logAndThrow('getUserFarms', error, 'DATABASE_ERROR')
    return []
  }
}

/**
 * Assign a staff user to a farm (admin only)
 */
export async function assignUserToFarm(
  adminUserId: string,
  staffUserId: string,
  farmId: string,
  role: 'owner' | 'manager' | 'viewer' = 'viewer',
): Promise<boolean> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    // Check if admin user is actually an admin
    const adminUser = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', adminUserId)
      .executeTakeFirst()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new AppError('ACCESS_DENIED', {
        message: 'Only admins can assign users to farms',
      })
    }

    // Check if staff user exists
    const staffUser = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', staffUserId)
      .executeTakeFirst()

    if (!staffUser) {
      throw new AppError('NOT_FOUND', {
        message: 'User not found',
        metadata: { userId: staffUserId },
      })
    }

    // Insert assignment (update role if already exists)
    await db
      .insertInto('user_farms')
      .values({
        userId: staffUserId,
        farmId: farmId,
        role: role,
      })
      .onConflict((oc) =>
        oc.columns(['userId', 'farmId']).doUpdateSet({ role }),
      )
      .execute()

    return true
  } catch (error) {
    if (error instanceof AppError) throw error
    logAndThrow('assignUserToFarm', error, 'DATABASE_ERROR')
    return false
  }
}

/**
 * Remove a staff user from a farm (admin only)
 */
export async function removeUserFromFarm(
  adminUserId: string,
  staffUserId: string,
  farmId: string,
): Promise<boolean> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    // Check if admin user is actually an admin
    const adminUser = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', adminUserId)
      .executeTakeFirst()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new AppError('ACCESS_DENIED', {
        message: 'Only admins can remove users from farms',
      })
    }

    // Remove assignment
    await db
      .deleteFrom('user_farms')
      .where('userId', '=', staffUserId)
      .where('farmId', '=', farmId)
      .execute()

    return true
  } catch (error) {
    if (error instanceof AppError) throw error
    logAndThrow('removeUserFromFarm', error, 'DATABASE_ERROR')
    return false
  }
}

// Alias for backward compatibility
export const verifyFarmAccess = checkFarmAccess

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const user = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', userId)
      .executeTakeFirst()

    return user?.role === 'admin'
  } catch (error) {
    logAndThrow('isAdmin', error, 'DATABASE_ERROR')
    return false
  }
}

/**
 * Get user's role for a specific farm
 */
export async function getUserFarmRole(
  userId: string,
  farmId: string,
): Promise<'owner' | 'manager' | 'viewer' | null> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const assignment = await db
      .selectFrom('user_farms')
      .select(['role'])
      .where('userId', '=', userId)
      .where('farmId', '=', farmId)
      .executeTakeFirst()

    return (
      (assignment?.role as 'owner' | 'manager' | 'viewer' | undefined) ?? null
    )
  } catch (error) {
    logAndThrow('getUserFarmRole', error, 'DATABASE_ERROR')
    return null
  }
}

/**
 * Get all farms with roles for a user
 */
export async function getUserFarmsWithRoles(
  userId: string,
): Promise<Array<{ farmId: string; role: 'owner' | 'manager' | 'viewer' }>> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const user = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user) return []

    // Admin has access to all farms as 'owner'
    if (user.role === 'admin') {
      const farms = await db.selectFrom('farms').select(['id']).execute()
      return farms.map((f) => ({ farmId: f.id, role: 'owner' as const }))
    }

    // Regular users get their assigned farms with roles
    const assignments = await db
      .selectFrom('user_farms')
      .select(['farmId', 'role'])
      .where('userId', '=', userId)
      .execute()

    return assignments.map((a) => ({
      farmId: a.farmId,
      role: a.role as 'owner' | 'manager' | 'viewer',
    }))
  } catch (error) {
    logAndThrow('getUserFarmsWithRoles', error, 'DATABASE_ERROR')
    return []
  }
}

// ============================================
// Permission Types and Constants
// ============================================

export type FarmRole = 'owner' | 'manager' | 'viewer' | 'worker' | 'observer'

export type Permission =
  | 'farm:read'
  | 'farm:update'
  | 'farm:delete'
  | 'batch:create'
  | 'batch:read'
  | 'batch:update'
  | 'batch:delete'
  | 'member:read'
  | 'member:invite'
  | 'member:remove'
  | 'member:update_role'
  | 'finance:read'
  | 'finance:create'
  | 'finance:update'
  | 'finance:delete'

/**
 * Permission matrix for farm roles
 * owner: full access
 * manager: can create/update data, but not delete or manage members
 * viewer: read-only access
 */
const ROLE_PERMISSIONS: Record<FarmRole, Array<Permission>> = {
  owner: [
    'farm:read',
    'farm:update',
    'farm:delete',
    'batch:create',
    'batch:read',
    'batch:update',
    'batch:delete',
    'member:read',
    'member:invite',
    'member:remove',
    'member:update_role',
    'finance:read',
    'finance:create',
    'finance:update',
    'finance:delete',
  ],
  manager: [
    'farm:read',
    'farm:update',
    'batch:create',
    'batch:read',
    'batch:update',
    'member:read',
    'finance:read',
    'finance:create',
    'finance:update',
  ],
  viewer: ['farm:read', 'batch:read', 'member:read', 'finance:read'],
  worker: ['batch:read', 'finance:read'],
  // Observer: Extension workers - NO finance:read by default (controlled by financialVisibility grant)
  observer: ['batch:read', 'farm:read'],
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(
  role: FarmRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Check if a user has a specific permission for a farm
 */
export async function hasPermission(
  userId: string,
  farmId: string,
  permission: Permission,
): Promise<boolean> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    // Check if user is admin (admins have all permissions)
    const user = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user) return false
    if (user.role === 'admin') return true

    // Get user's role for this farm
    const farmRole = await getUserFarmRole(userId, farmId)
    if (!farmRole) return false

    return roleHasPermission(farmRole, permission)
  } catch (error) {
    logAndThrow('hasPermission', error, 'DATABASE_ERROR')
    return false
  }
}

/**
 * Check if user can write to a farm (owner or manager)
 */
export async function canWriteToFarm(
  userId: string,
  farmId: string,
): Promise<boolean> {
  return hasPermission(userId, farmId, 'batch:create')
}

/**
 * Check if user can manage farm members (owner only)
 */
export async function canManageMembers(
  userId: string,
  farmId: string,
): Promise<boolean> {
  return hasPermission(userId, farmId, 'member:invite')
}

/**
 * Check if user can delete farm data (owner only)
 */
export async function canDeleteFarmData(
  userId: string,
  farmId: string,
): Promise<boolean> {
  return hasPermission(userId, farmId, 'batch:delete')
}

/**
 * Get all permissions for a user on a farm
 * Checks both user_farms (owner/manager/viewer/worker) AND access_grants (observer)
 */
export async function getUserPermissions(
  userId: string,
  farmId: string,
): Promise<Array<Permission>> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    // Check if user is admin
    const user = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user) return []
    if (user.role === 'admin') return ROLE_PERMISSIONS.owner

    // Check user_farms first (owner, manager, viewer, worker)
    const farmRole = await getUserFarmRole(userId, farmId)
    if (farmRole) {
      return ROLE_PERMISSIONS[farmRole]
    }

    // Check access_grants for observer role
    const grant = await db
      .selectFrom('access_grants')
      .select(['financialVisibility'])
      .where('userId', '=', userId)
      .where('farmId', '=', farmId)
      .where('expiresAt', '>', new Date())
      .where('revokedAt', 'is', null)
      .executeTakeFirst()

    if (grant) {
      const permissions = [...ROLE_PERMISSIONS.observer]
      if (grant.financialVisibility) {
        permissions.push('finance:read')
      }
      return permissions
    }

    return []
  } catch (error) {
    logAndThrow('getUserPermissions', error, 'DATABASE_ERROR')
    return []
  }
}

/**
 * Check if user has observer access to a farm via access_grants.
 * This is SEPARATE from checkFarmAccess which uses user_farms.
 */
export async function checkObserverAccess(
  userId: string,
  farmId: string,
): Promise<{ hasAccess: boolean; financialVisibility: boolean }> {
  try {
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const grant = await db
      .selectFrom('access_grants')
      .select(['financialVisibility'])
      .where('userId', '=', userId)
      .where('farmId', '=', farmId)
      .where('expiresAt', '>', new Date())
      .where('revokedAt', 'is', null)
      .executeTakeFirst()

    return {
      hasAccess: !!grant,
      financialVisibility: grant?.financialVisibility ?? false,
    }
  } catch {
    return { hasAccess: false, financialVisibility: false }
  }
}
