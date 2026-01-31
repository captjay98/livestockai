import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { getAuth } from '~/features/auth/config'
import {
  shouldApplySecurityHeaders,
  withSecurityHeaders,
} from '~/lib/middleware/security-headers'

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
