import { getAuth } from './config'
import { AppError } from '~/lib/errors'

/**
 * Middleware to check authentication and authorization
 * Uses getRequestHeaders() to get headers in server functions
 *
 * NOTE: This file should ONLY be imported dynamically in server functions (createServerFn handlers)
 */
export async function requireAuth() {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const auth = await getAuth()
    const session = await auth.api.getSession({ headers })

    if (!session) {
        // Throw a plain error that can be serialized
        throw new AppError('UNAUTHORIZED')
    }

    // Check if user is banned
    const { getDb } = await import('~/lib/db')
    const db = await getDb()
    const user = await db
        .selectFrom('users')
        .select(['banned', 'banExpires'])
        .where('id', '=', session.user.id)
        .executeTakeFirst()

    if (user?.banned) {
        // Check if ban has expired
        if (user.banExpires && new Date(user.banExpires) < new Date()) {
            // Ban expired, unban the user
            await db
                .updateTable('users')
                .set({ banned: false, banReason: null, banExpires: null })
                .where('id', '=', session.user.id)
                .execute()
        } else {
            throw new AppError('BANNED', {
                metadata: { userId: session.user.id },
            })
        }
    }

    return session
}

/**
 * Optional authentication - returns session if available, null otherwise
 */
export async function getOptionalSession() {
  try {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const auth = await getAuth()
    const session = await auth.api.getSession({ headers })
    return session
  } catch {
    return null
  }
}

/**
 * Middleware to check admin role
 */
export async function requireAdmin() {
    const session = await requireAuth()

    // Dynamic import to avoid bundling db in client code
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    const user = await db
        .selectFrom('users')
        .select(['role'])
        .where('id', '=', session.user.id)
        .executeTakeFirst()

    if (!user || user.role !== 'admin') {
        throw new AppError('ACCESS_DENIED', {
            metadata: { userId: session.user.id, role: user?.role },
        })
    }

    return { session, user }
}

/**
 * Middleware to check farm access
 */
export async function requireFarmAccess(farmId: string) {
    const session = await requireAuth()

    // Dynamic import to avoid bundling utils/db in client code
    const { checkFarmAccess } = await import('./utils')

    const hasAccess = await checkFarmAccess(session.user.id, farmId)

    if (!hasAccess) {
        throw new AppError('ACCESS_DENIED', {
            metadata: { userId: session.user.id, farmId },
        })
    }

    return session
}
