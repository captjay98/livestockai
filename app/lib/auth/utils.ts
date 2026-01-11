import { db } from '../db'

/**
 * Check if user has access to a specific farm
 */
export async function checkFarmAccess(
  userId: string,
  farmId: string,
): Promise<boolean> {
  try {
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
    console.error('Error checking farm access:', error)
    return false
  }
}

/**
 * Get all farms accessible to a user
 */
export async function getUserFarms(userId: string): Promise<Array<string>> {
  try {
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
    console.error('Error getting user farms:', error)
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
): Promise<boolean> {
  try {
    // Check if admin user is actually an admin
    const adminUser = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', adminUserId)
      .executeTakeFirst()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can assign users to farms')
    }

    // Check if staff user exists and is staff
    const staffUser = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', staffUserId)
      .executeTakeFirst()

    if (!staffUser) {
      throw new Error('Staff user not found')
    }

    // Insert assignment (ignore if already exists)
    await db
      .insertInto('user_farms')
      .values({
        userId: staffUserId,
        farmId: farmId,
      })
      .onConflict((oc) => oc.doNothing())
      .execute()

    return true
  } catch (error) {
    console.error('Error assigning user to farm:', error)
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
    // Check if admin user is actually an admin
    const adminUser = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', adminUserId)
      .executeTakeFirst()

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admins can remove users from farms')
    }

    // Remove assignment
    await db
      .deleteFrom('user_farms')
      .where('userId', '=', staffUserId)
      .where('farmId', '=', farmId)
      .execute()

    return true
  } catch (error) {
    console.error('Error removing user from farm:', error)
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
    const user = await db
      .selectFrom('users')
      .select(['role'])
      .where('id', '=', userId)
      .executeTakeFirst()

    return user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}
