import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './config'

/**
 * Middleware to check authentication and authorization
 * Uses getRequestHeaders() to get headers in server functions
 * 
 * NOTE: This file should ONLY be imported in server functions (createServerFn handlers)
 */
export async function requireAuth() {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
        // Throw a plain error that can be serialized
        throw new Error('UNAUTHORIZED')
    }

    return session
}

/**
 * Middleware to check admin role
 */
export async function requireAdmin() {
    const session = await requireAuth()

    // Dynamic import to avoid bundling db in client code
    const { db } = await import('../db')

    const user = await db
        .selectFrom('users')
        .select(['role'])
        .where('id', '=', session.user.id)
        .executeTakeFirst()

    if (!user || user.role !== 'admin') {
        throw new Error('FORBIDDEN')
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
        throw new Error('FORBIDDEN')
    }

    return session
}
