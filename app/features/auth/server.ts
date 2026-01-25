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
      console.log('[AUTH DEBUG] Login attempt for:', email)
      console.log('[AUTH DEBUG] Password length:', password.length)

      const auth = await getAuth()
      const res = await auth.api.signInEmail({
        body: { email, password },
        headers,
      })

      console.log('[AUTH DEBUG] Login successful for:', email)
      console.log('[AUTH DEBUG] User:', res.user)
      return { success: true, user: res.user }
    } catch (e: unknown) {
      console.error('[AUTH DEBUG] Login failed:', e)
      if (e instanceof Error) {
        console.error('[AUTH DEBUG] Error message:', e.message)
        console.error('[AUTH DEBUG] Error stack:', e.stack)
      }

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
      const { email, password, name } = data
      const auth = await getAuth()
      const res = await auth.api.signUpEmail({
        body: { email, password, name },
        headers,
      })
      return { success: true, user: res.user }
    } catch (e: unknown) {
      // Check for duplicate email error
      if (e instanceof Error && e.message.toLowerCase().includes('duplicate')) {
        throw new AppError('ALREADY_EXISTS', {
          message: 'Email already registered',
          cause: e,
        })
      }
      throw new AppError('VALIDATION_ERROR', {
        message: 'Registration failed',
        cause: e,
      })
    }
  })
