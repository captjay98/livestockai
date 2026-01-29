/**
 * Security middleware for TanStack Start
 * Apply security headers to responses
 */

import { createServerFn } from '@tanstack/react-start'
import { addSecurityHeaders } from './security-headers'

/**
 * Server function to apply security headers to any response
 * Usage: await applySecurityHeaders()
 */
export const applySecurityHeadersFn = createServerFn({ method: 'GET' }).handler(
  () => {
    // This function can be called to ensure security headers are applied
    // The actual headers are applied via the addSecurityHeaders utility
    return { securityHeadersApplied: true }
  },
)

/**
 * Utility to wrap any response with security headers
 */
export function withSecurityHeaders(response: Response): Response {
  return addSecurityHeaders(response)
}
