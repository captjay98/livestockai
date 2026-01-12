import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// Schema definitions
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['user', 'admin']).default('user'),
})

const banUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

const setPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8),
})

const userIdSchema = z.object({
  userId: z.string().uuid(),
})

/**
 * List all users (admin only)
 */
export const listUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireAdmin } = await import('../auth/server-middleware')
  await requireAdmin()

  const { db } = await import('../db')
  return db
    .selectFrom('users')
    .select([
      'id',
      'name',
      'email',
      'role',
      'banned',
      'banReason',
      'banExpires',
      'createdAt',
    ])
    .orderBy('createdAt', 'desc')
    .execute()
})

/**
 * Get a single user by ID (admin only)
 */
export const getUser = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('../db')
    const user = await db
      .selectFrom('users')
      .select([
        'id',
        'name',
        'email',
        'role',
        'banned',
        'banReason',
        'banExpires',
        'createdAt',
      ])
      .where('id', '=', data.userId)
      .executeTakeFirst()

    if (!user) {
      throw new Error('User not found')
    }

    // Get user's farm assignments
    const farmAssignments = await db
      .selectFrom('user_farms')
      .innerJoin('farms', 'farms.id', 'user_farms.farmId')
      .select([
        'user_farms.farmId',
        'user_farms.role',
        'farms.name as farmName',
      ])
      .where('user_farms.userId', '=', data.userId)
      .execute()

    return { ...user, farmAssignments }
  })

/**
 * Create a new user (admin only)
 */
export const createUser = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof createUserSchema>) =>
    createUserSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { auth } = await import('../auth/config')

    // Check if email already exists
    const { db } = await import('../db')
    const existing = await db
      .selectFrom('users')
      .select(['id'])
      .where('email', '=', data.email)
      .executeTakeFirst()

    if (existing) {
      throw new Error('Email already exists')
    }

    // Create user via Better Auth admin API
    const result = await auth.api.createUser({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      },
    })

    return result
  })

/**
 * Set user password (admin only)
 */
export const setUserPassword = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof setPasswordSchema>) =>
    setPasswordSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { auth } = await import('../auth/config')

    await auth.api.setUserPassword({
      body: {
        userId: data.userId,
        newPassword: data.newPassword,
      },
    })

    return { success: true }
  })

/**
 * Ban a user (admin only)
 */
export const banUser = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof banUserSchema>) =>
    banUserSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { session } = await requireAdmin()

    // Prevent self-ban
    if (data.userId === session.user.id) {
      throw new Error('Cannot ban yourself')
    }

    const { db } = await import('../db')

    // Check if user exists
    const user = await db
      .selectFrom('users')
      .select(['id', 'role'])
      .where('id', '=', data.userId)
      .executeTakeFirst()

    if (!user) {
      throw new Error('User not found')
    }

    // Prevent banning other admins
    if (user.role === 'admin') {
      throw new Error('Cannot ban admin users')
    }

    await db
      .updateTable('users')
      .set({
        banned: true,
        banReason: data.reason || null,
        banExpires: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .where('id', '=', data.userId)
      .execute()

    return { success: true }
  })

/**
 * Unban a user (admin only)
 */
export const unbanUser = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string }) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    await requireAdmin()

    const { db } = await import('../db')

    await db
      .updateTable('users')
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
      })
      .where('id', '=', data.userId)
      .execute()

    return { success: true }
  })

/**
 * Remove a user (admin only)
 */
export const removeUser = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string }) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { session } = await requireAdmin()

    // Prevent self-deletion
    if (data.userId === session.user.id) {
      throw new Error('Cannot delete yourself')
    }

    const { db } = await import('../db')

    // Check if user exists
    const user = await db
      .selectFrom('users')
      .select(['id', 'role'])
      .where('id', '=', data.userId)
      .executeTakeFirst()

    if (!user) {
      throw new Error('User not found')
    }

    // Prevent deleting other admins
    if (user.role === 'admin') {
      throw new Error('Cannot delete admin users')
    }

    // Check if user is the last owner of any farm
    const ownedFarms = await db
      .selectFrom('user_farms')
      .select(['farmId'])
      .where('userId', '=', data.userId)
      .where('role', '=', 'owner')
      .execute()

    for (const { farmId } of ownedFarms) {
      const otherOwners = await db
        .selectFrom('user_farms')
        .select(['userId'])
        .where('farmId', '=', farmId)
        .where('role', '=', 'owner')
        .where('userId', '!=', data.userId)
        .execute()

      if (otherOwners.length === 0) {
        throw new Error(
          'Cannot delete user who is the last owner of a farm. Transfer ownership first.',
        )
      }
    }

    // Delete user (cascades to user_farms, sessions, etc.)
    await db.deleteFrom('users').where('id', '=', data.userId).execute()

    return { success: true }
  })

/**
 * Update user role (admin only)
 */
export const updateUserRole = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; role: 'user' | 'admin' }) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(['user', 'admin']),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import('../auth/server-middleware')
    const { session } = await requireAdmin()

    // Prevent changing own role
    if (data.userId === session.user.id) {
      throw new Error('Cannot change your own role')
    }

    const { db } = await import('../db')

    await db
      .updateTable('users')
      .set({ role: data.role })
      .where('id', '=', data.userId)
      .execute()

    return { success: true }
  })
