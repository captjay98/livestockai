import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { auth } from './config'
import { requireAuth } from './server-middleware'
import { AppError } from '~/lib/errors'

/**
 * @module Authentication
 *
 * Server components for user authentication and session management.
 * Wraps Better Auth functionality for server-side usage.
 */

const LoginSchema = z.object({
  email: z.string().email('validation.email'),
  password: z.string().min(1, 'validation.required'),
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
    const headers = getRequestHeaders()
    try {
      const { email, password } = data
      const res = await auth.api.signInEmail({
        body: { email, password },
        headers,
      })
      return { success: true, user: res.user }
    } catch (e: unknown) {
      console.error('Login Error:', e)
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
    const headers = getRequestHeaders()
    try {
      const { email, password, name } = data
      const res = await auth.api.signUpEmail({
        body: { email, password, name },
        headers,
      })
      return { success: true, user: res.user }
    } catch (e: unknown) {
      console.error('Register Error:', e)
      throw new AppError('VALIDATION_ERROR', {
        message: 'Registration failed',
        cause: e,
      })
    }
  })

export const checkAuthFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await requireAuth()
      return { user: session.user }
    } catch (error: unknown) {
      if (error instanceof AppError) throw error
      console.error('checkAuthFn error:', error)
      throw new AppError('UNAUTHORIZED', { cause: error })
    }
  },
)
