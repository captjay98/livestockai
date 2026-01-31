import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getAuth } from './config'
import { AppError } from '~/lib/errors'
import { requireAuth } from '~/features/auth/server-middleware'
import { logAndThrow } from '~/lib/logger'

/**
 * @module Authentication
 *
 * Server components for user authentication and session management.
 * Wraps Better Auth functionality for server-side usage.
 */

const LoginSchema = z.object({
  email: z.string().email('validation.email'),
  password: z.string().min(8, 'validation.password'),
})

/**
 * Server function for user login using email and password.
 * Utilizes Better Auth for session management.
 *
 * @param data - User credentials (email and password)
 * @returns Promise resolving to a success indicator and user data, or an error message
 */
export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(LoginSchema)
  .handler(async ({ data }) => {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    try {
      const { email, password } = data
      const { debug } = await import('~/lib/logger')
      await debug('[AUTH DEBUG] Login attempt for:', email)
      await debug('[AUTH DEBUG] Password length:', password.length)

      const auth = await getAuth()
      const res = await auth.api.signInEmail({
        body: { email, password },
        headers,
      })

      await debug('[AUTH DEBUG] Login successful for:', email)
      await debug('[AUTH DEBUG] User:', res.user)
      return { success: true, user: res.user }
    } catch (e: unknown) {
      const { error } = await import('~/lib/logger')
      await error('[AUTH DEBUG] Login failed', e)

      // Re-throw database/config errors as server error (don't expose DB details)
      if (e instanceof Error && e.message.includes('neon()')) {
        throw new AppError('DATABASE_ERROR', { cause: e })
      }
      throw new AppError('UNAUTHORIZED', {
        message: 'Invalid email or password',
        cause: e,
      })
    }
  })

/**
 * Server function to check the current user's authentication status.
 * Returns the session user if authenticated.
 *
 * @returns Promise resolving to the current user object
 * @throws {Error} If the user is not authenticated
 */
export const checkAuthFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({}))
  .handler(async () => {
    try {
      const session = await requireAuth()
      return { user: session.user }
    } catch (error: unknown) {
      if (error instanceof AppError) throw error
      logAndThrow('checkAuthFn', error, 'UNAUTHORIZED')
    }
  })

const RegisterSchema = z.object({
  name: z.string().min(2, 'validation.name'),
  email: z.string().email('validation.email'),
  password: z.string().min(8, 'validation.password'),
  userType: z.enum(['farmer', 'buyer', 'both']).optional().default('farmer'),
})

/**
 * Server function for user registration.
 */
export const registerFn = createServerFn({ method: 'POST' })
  .inputValidator(RegisterSchema)
  .handler(async ({ data }) => {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    try {
      const { email, password, name, userType } = data
      const auth = await getAuth()

      // Register user with Better Auth
      const res = await auth.api.signUpEmail({
        body: { email, password, name },
        headers,
      })

      // Create user_settings and update userType in a transaction
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { DEFAULT_SETTINGS } =
        await import('~/features/settings/currency-presets')

      const updatedUser = await db.transaction().execute(async (trx) => {
        // Update userType if not default
        if (userType !== 'farmer') {
          await trx
            .updateTable('users')
            .set({ userType })
            .where('id', '=', res.user.id)
            .execute()
        }

        // Create user_settings with proper defaults
        await trx
          .insertInto('user_settings')
          .values({
            userId: res.user.id,
            onboardingCompleted: false,
            onboardingStep: 0,
            ...DEFAULT_SETTINGS,
          })
          .execute()

        // Fetch updated user INSIDE transaction to prevent race condition
        return await trx
          .selectFrom('users')
          .select(['id', 'email', 'name', 'userType'])
          .where('id', '=', res.user.id)
          .executeTakeFirst()
      })

      return { success: true, user: updatedUser || { ...res.user, userType } }
    } catch (e: unknown) {
      // Check for duplicate email error (Better Auth or Database)
      const errorMessage = e instanceof Error ? e.message.toLowerCase() : ''
      if (
        errorMessage.includes('duplicate') ||
        errorMessage.includes('exists') ||
        errorMessage.includes('already in use')
      ) {
        throw new AppError('ALREADY_EXISTS', {
          message: 'register.errors.email_exists',
          cause: e,
        })
      }
      throw new AppError('VALIDATION_ERROR', {
        message: 'register.errors.default', // Use translation key
        cause: e,
      })
    }
  })
