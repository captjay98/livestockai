import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  deleteUser,
  selectAllUsers,
  selectUserByEmail,
  selectUserById,
  selectUserFarmAssignments,
  selectUserOwnedFarms,
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
export const listUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireAdmin } = await import('../auth/server-middleware')
  const { db } = await import('~/lib/db')

  try {
    await requireAdmin()
    return await selectAllUsers(db)
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
export const getUser = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { db } = await import('~/lib/db')

    try {
      await requireAdmin()

      const user = await selectUserById(db, data.userId)

      if (!user) {
        throw new AppError('USER_NOT_FOUND', {
          metadata: { resource: 'User', id: data.userId },
        })
      }

      const farmAssignments = await selectUserFarmAssignments(db, data.userId)

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
export const createUser = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof createUserSchema>) =>
    createUserSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { auth } = await import('../auth/config')
    const { db } = await import('~/lib/db')

    try {
      await requireAdmin()

      const validation = validateCreateUserInput(data)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', {
          message: validation.message,
        })
      }

      const existing = await selectUserByEmail(db, data.email)

      if (existing) {
        throw new AppError('ALREADY_EXISTS', {
          message: 'Email already exists',
          metadata: { resource: 'User', field: 'email', value: data.email },
        })
      }

      const result = await auth.api.createUser({
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
        },
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
export const setUserPassword = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof setPasswordSchema>) =>
    setPasswordSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { auth } = await import('../auth/config')

    try {
      await requireAdmin()

      const validation = validateSetPasswordInput(data)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', {
          message: validation.message,
        })
      }

      await auth.api.setUserPassword({
        body: {
          userId: data.userId,
          newPassword: data.newPassword,
        },
      })

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
export const banUser = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof banUserSchema>) =>
    banUserSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { db } = await import('~/lib/db')

    try {
      const { session } = await requireAdmin()

      const validation = validateBanUserInput(data)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', {
          message: validation.message,
        })
      }

      const user = await selectUserById(db, data.userId)

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
export const unbanUser = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string }) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { db } = await import('~/lib/db')

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
export const removeUser = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string }) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { db } = await import('~/lib/db')

    try {
      const { session } = await requireAdmin()

      const validation = validateRemoveUserInput(data)
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', {
          message: validation.message,
        })
      }

      const user = await selectUserById(db, data.userId)

      if (!user) {
        throw new AppError('USER_NOT_FOUND', {
          metadata: { resource: 'User', id: data.userId },
        })
      }

      const ownedFarms = await selectUserOwnedFarms(db, data.userId)

      const deleteCheck = canDeleteUser(session.user.id, user, ownedFarms.length)
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
export const updateUserRole = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof updateRoleSchema>) =>
    updateRoleSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { db } = await import('~/lib/db')

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

// Export server function wrappers with 'Fn' suffix for consistency
export const listUsersFn = listUsers
export const getUserFn = getUser
export const createUserFn = createUser
export const setUserPasswordFn = setUserPassword
export const banUserFn = banUser
export const unbanUserFn = unbanUser
export const removeUserFn = removeUser
export const updateUserRoleFn = updateUserRole
