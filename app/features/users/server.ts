import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  deleteUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  getUserFarmAssignments,
  getUserOwnedFarms,
  updateUserBan,
  updateUserRoleById,
} from './repository'
import {
  canBanUser,
  canChangeRole,
  canDeleteUser,
  validateBanUserInput,
  validateCreateUserInput,
  validateRemoveUserInput,
  validateSetPasswordInput,
  validateUpdateRoleInput,
} from './service'
import { AppError } from '~/lib/errors'

// Zod schemas for input validation
const createUserSchema = z.object({
  email: z.string().email('validation.email'),
  password: z.string().min(8, 'validation.min'),
  name: z.string().min(1, 'validation.required'),
  role: z.enum(['user', 'admin']).default('user'),
})

const banUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

const setPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8, 'validation.min'),
})

const userIdSchema = z.object({
  userId: z.string().uuid(),
})

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['user', 'admin']),
})

/**
 * List all users (admin only).
 *
 * @internal Restricted to administrative context.
 * @returns A promise resolving to a list of users with their details and ban status.
 */
export const listUsersFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({}))
  .handler(async () => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      await requireAdmin()
      return await getAllUsers(db)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to list users',
        cause: error,
      })
    }
  })

/**
 * Get a single user by ID (admin only).
 *
 * @param data - Object containing `userId`.
 * @returns A promise resolving to the user details and farm assignments.
 * @throws {Error} If the user is not found.
 */
export const getUserFn = createServerFn({ method: 'GET' })
  .inputValidator(userIdSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      await requireAdmin()

      const user = await getUserById(db, data.userId)

      if (!user) {
        throw new AppError('USER_NOT_FOUND', {
          metadata: { resource: 'User', id: data.userId },
        })
      }

      const farmAssignments = await getUserFarmAssignments(db, data.userId)

      return { ...user, farmAssignments }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to fetch user details',
        cause: error,
      })
    }
  })

/**
 * Create a new user (admin only).
 *
 * @param data - User credentials and initial profile.
 * @returns A promise resolving to the created user result.
 * @throws {Error} If the email already exists.
 */
export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(createUserSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      await requireAdmin()

      const validation = validateCreateUserInput(data)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', {
          message: validation.message,
        })
      }

      const existing = await getUserByEmail(db, data.email)

      if (existing) {
        throw new AppError('ALREADY_EXISTS', {
          message: 'Email already exists',
          metadata: {
            resource: 'User',
            field: 'email',
            value: data.email,
          },
        })
      }

      // Use database helper to create user with auth
      const { createUserWithAuth } = await import('~/lib/db/seeds/helpers')
      const result = await createUserWithAuth(db, {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      })

      return result
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to create user',
        cause: error,
      })
    }
  })

/**
 * Set a new password for a user (admin only).
 *
 * @param data - Object containing userId and newPassword.
 * @returns A promise resolving to a success indicator.
 */
export const setUserPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator(setPasswordSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')

    try {
      await requireAdmin()

      const validation = validateSetPasswordInput(data)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', {
          message: validation.message,
        })
      }

      // Update password in account table
      const { hashPassword } = await import('~/lib/db/seeds/helpers')
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const passwordHash = await hashPassword(data.newPassword)

      await db
        .updateTable('account')
        .set({ password: passwordHash })
        .where('userId', '=', data.userId)
        .where('providerId', '=', 'credential')
        .execute()

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', {
        message: 'Failed to set password',
        cause: error,
      })
    }
  })

/**
 * Ban a user from the platform (admin only).
 *
 * @param data - Object containing userId, reason, and optional expiration.
 * @returns A promise resolving to a success indicator.
 * @throws {Error} If attempting to ban self or another admin.
 */
export const banUserFn = createServerFn({ method: 'POST' })
  .inputValidator(banUserSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      const { session } = await requireAdmin()

      const validation = validateBanUserInput(data)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', {
          message: validation.message,
        })
      }

      const user = await getUserById(db, data.userId)

      if (!user) {
        throw new AppError('USER_NOT_FOUND', {
          metadata: { resource: 'User', id: data.userId },
        })
      }

      const banCheck = canBanUser(session.user.id, user)
      if (!banCheck.allowed) {
        throw new AppError('VALIDATION_ERROR', {
          message: banCheck.reason,
        })
      }

      await updateUserBan(
        db,
        data.userId,
        true,
        data.reason || null,
        data.expiresAt ? new Date(data.expiresAt) : null,
      )

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to ban user',
        cause: error,
      })
    }
  })

/**
 * Unban a previously banned user (admin only).
 *
 * @param data - Object containing userId.
 * @returns A promise resolving to a success indicator.
 */
export const unbanUserFn = createServerFn({ method: 'POST' })
  .inputValidator(userIdSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      await requireAdmin()

      await updateUserBan(db, data.userId, false, null, null)

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to unban user',
        cause: error,
      })
    }
  })

/**
 * Permanently remove a user account (admin only).
 *
 * @param data - Object containing userId.
 * @returns A promise resolving to a success indicator.
 * @throws {Error} If attempting to delete self, another admin, or a sole farm owner.
 */
export const removeUserFn = createServerFn({ method: 'POST' })
  .inputValidator(userIdSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      const { session } = await requireAdmin()

      const validation = validateRemoveUserInput(data)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', {
          message: validation.message,
        })
      }

      const user = await getUserById(db, data.userId)

      if (!user) {
        throw new AppError('USER_NOT_FOUND', {
          metadata: { resource: 'User', id: data.userId },
        })
      }

      const ownedFarms = await getUserOwnedFarms(db, data.userId)

      const deleteCheck = canDeleteUser(
        session.user.id,
        user,
        ownedFarms.length,
      )
      if (!deleteCheck.allowed) {
        throw new AppError('VALIDATION_ERROR', {
          message: deleteCheck.reason,
        })
      }

      await deleteUser(db, data.userId)

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to remove user',
        cause: error,
      })
    }
  })

/**
 * Update a user's role (admin only).
 *
 * @param data - Object containing userId and the new role.
 * @returns A promise resolving to a success indicator.
 * @throws {Error} If attempting to change own role.
 */
export const updateUserRoleFn = createServerFn({ method: 'POST' })
  .inputValidator(updateRoleSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    try {
      const { session } = await requireAdmin()

      const validation = validateUpdateRoleInput(data)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', {
          message: validation.message,
        })
      }

      const roleCheck = canChangeRole(session.user.id, data.userId)
      if (!roleCheck.allowed) {
        throw new AppError('VALIDATION_ERROR', {
          message: roleCheck.reason,
        })
      }

      await updateUserRoleById(db, data.userId, data.role)

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to update user role',
        cause: error,
      })
    }
  })

// All server functions are already exported above with 'Fn' suffix
