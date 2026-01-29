/**
 * Security headers middleware for enhanced protection
 * Adds CSP, X-Frame-Options, and other security headers
 */

interface SecurityHeadersOptions {
  isDevelopment?: boolean
  allowInlineStyles?: boolean
  allowInlineScripts?: boolean
}

/**
 * Get security headers for responses
 */
export function getSecurityHeaders(
  options: SecurityHeadersOptions = {},
): Record<string, string> {
  const {
    isDevelopment = false,
    allowInlineStyles = true,
    allowInlineScripts = false,
  } = options

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'" +
      (allowInlineScripts || isDevelopment ? " 'unsafe-inline'" : ''),
    "style-src 'self'" + (allowInlineStyles ? " 'unsafe-inline'" : ''),
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.neon.tech wss://api.neon.tech",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    isDevelopment ? 'upgrade-insecure-requests' : '',
  ]
    .filter(Boolean)
    .join('; ')

  return {
    // Content Security Policy
    'Content-Security-Policy': cspDirectives,

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy (restrict dangerous features)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'payment=()',
      'usb=()',
    ].join(', '),

    // Strict Transport Security (only for HTTPS)
    ...(isDevelopment
      ? {}
      : {
          'Strict-Transport-Security':
            'max-age=31536000; includeSubDomains; preload',
        }),

    // Cross-Origin policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  }
}

/**
 * Apply security headers to a Response
 */
export function applySecurityHeaders(
  response: Response,
  options?: SecurityHeadersOptions,
): Response {
  const headers = getSecurityHeaders(options)

  // Create new response with security headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  })

  // Add security headers
  Object.entries(headers).forEach(([key, value]) => {
    newResponse.headers.set(key, value)
  })

  return newResponse
}

/**
 * Middleware function for TanStack Start
 */
export async function securityHeaders(
  options?: SecurityHeadersOptions,
): Promise<Record<string, string>> {
  // Determine if in development
  const isDevelopment = await getIsDevelopment()

  return getSecurityHeaders({
    isDevelopment,
    ...options,
  })
}

/**
 * Get environment - works in both Node.js and Cloudflare Workers
 */
async function getIsDevelopment(): Promise<boolean> {
  try {
    const { env } = await import('cloudflare:workers')
    return env.NODE_ENV === 'development'
  } catch {
    return process.env.NODE_ENV === 'development'
  }
}
