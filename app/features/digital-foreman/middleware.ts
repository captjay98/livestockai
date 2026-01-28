import { AppError } from '~/lib/errors'

/**
 * Check if worker has permission for a specific module
 */
export async function requireModulePermission(
  userId: string,
  farmId: string,
  moduleKey: string,
): Promise<void> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  // Get worker profile
  const profile = await db
    .selectFrom('worker_profiles')
    .select(['permissions'])
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (!profile) {
    throw new AppError('ACCESS_DENIED', {
      message: 'Worker profile not found',
      metadata: { userId, farmId },
    })
  }

  // Check if required permission is in profile.permissions array
  const permissions = profile.permissions as Array<string>
  if (!permissions.includes(moduleKey)) {
    throw new AppError('ACCESS_DENIED', {
      message: 'Insufficient module permissions',
      metadata: { userId, farmId, moduleKey, permissions },
    })
  }
}