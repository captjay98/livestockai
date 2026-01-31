/**
 * Security Headers Middleware
 *
 * Applies security headers to all responses:
 * - Content Security Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Strict-Transport-Security (HSTS)
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 *
 * Usage in TanStack Start:
 * Apply via server.ts fetch handler
 */

import { addSecurityHeaders } from '~/lib/security-headers'

/**
 * Middleware to apply security headers to response
 *
 * Usage in server.ts:
 * ```typescript
 * const response = await handler(request, ...args)
 * return withSecurityHeaders(response)
 * ```
 */
export function withSecurityHeaders(response: Response): Response {
  return addSecurityHeaders(response)
}

/**
 * Check if request needs security headers
 * Skip for certain paths (e.g., API endpoints that set their own headers)
 */
export function shouldApplySecurityHeaders(url: URL): boolean {
  // Skip for Better Auth API routes (they handle their own headers)
  if (url.pathname.startsWith('/api/auth')) {
    return false
  }

  // Skip for health check endpoints
  if (url.pathname === '/health' || url.pathname === '/ping') {
    return false
  }

  // Apply to all other routes
  return true
}

/**
 * Middleware wrapper for server functions
 * Automatically applies security headers to response
 */
export async function withSecurityHeadersMiddleware(
  handler: () => Promise<Response>,
  request: Request,
): Promise<Response> {
  const response = await handler()
  const url = new URL(request.url)

  if (shouldApplySecurityHeaders(url)) {
    return withSecurityHeaders(response)
  }

  return response
}
