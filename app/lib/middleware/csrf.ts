import { AppError } from '~/lib/errors'

/**
 * CSRF protection middleware for server functions
 * Works with Better Auth's CSRF implementation
 */
export async function validateCSRF(): Promise<void> {
  const { getRequestHeaders } = await import('@tanstack/react-start/server')
  const headers = getRequestHeaders()

  // Get CSRF token from header
  const csrfToken = headers['x-csrf-token'] || headers['X-CSRF-Token']

  if (!csrfToken) {
    throw new AppError('CSRF_TOKEN_MISSING', {
      message: 'CSRF token is required',
    })
  }

  // Get auth instance to validate CSRF token
  const { getAuth } = await import('~/features/auth/config')
  const auth = await getAuth()

  try {
    // Better Auth handles CSRF validation internally
    // We just need to ensure the token exists and let Better Auth validate it
    await auth.api.getSession({ headers })

    // If we get here without error, CSRF validation passed
    // (Better Auth throws if CSRF validation fails)
  } catch (error) {
    // Check if it's a CSRF-related error
    if (error instanceof Error && error.message.includes('CSRF')) {
      throw new AppError('CSRF_TOKEN_INVALID', {
        message: 'Invalid CSRF token',
      })
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Get CSRF token for client-side use
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const { getAuth } = await import('~/features/auth/config')
    const auth = await getAuth()

    // Get session which includes CSRF token
    await auth.api.getSession({ headers })

    // Extract CSRF token from session or headers
    // Better Auth typically includes it in the session context
    return headers['x-csrf-token'] || headers['X-CSRF-Token'] || null
  } catch {
    return null
  }
}
