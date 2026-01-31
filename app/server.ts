import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { getAuth } from '~/features/auth/config'
import {
  shouldApplySecurityHeaders,
  withSecurityHeaders,
} from '~/lib/middleware/security-headers'
import { initSentryServer } from '~/lib/sentry-server'

// Initialize Sentry for server-side error tracking
initSentryServer()

// Validate environment variables at startup (Node.js/Bun only)
if (typeof process !== 'undefined') {
  try {
    const { validateEnv } = await import('~/lib/env-validation')
    validateEnv()
  } catch (error) {
    console.error('Failed to validate environment:', error)
    // Don't exit in production - let Cloudflare handle it
    if (process.env.NODE_ENV === 'development') {
      process.exit(1)
    }
  }
}

const handler = createStartHandler(defaultStreamHandler)

export default {
  async fetch(request: Request, ...args: Array<any>) {
    const url = new URL(request.url)

    // Handle Better Auth API routes
    if (url.pathname.startsWith('/api/auth')) {
      const auth = await getAuth()
      return auth.handler(request)
    }

    // Handle all other routes with TanStack Start
    const response = await handler(request, ...args)

    // Apply security headers globally
    if (shouldApplySecurityHeaders(url)) {
      return withSecurityHeaders(response)
    }

    return response
  },
}
