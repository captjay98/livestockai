/**
 * Error Tracking with BetterStack (Logtail)
 *
 * Setup:
 * 1. Sign up at https://betterstack.com/logs
 * 2. Create a source and get your source token
 * 3. Add BETTERSTACK_SOURCE_TOKEN to .dev.vars (local) or wrangler secrets (production)
 * 4. Install: bun add @logtail/edge
 *
 * Cloudflare Workers compatible - uses fetch API
 */

interface ErrorContext {
  userId?: string
  farmId?: string
  action?: string
  [key: string]: any
}

/**
 * Track error to BetterStack
 * Works in both Node.js and Cloudflare Workers
 */
export async function trackError(
  error: Error,
  context?: ErrorContext,
): Promise<void> {
  const sourceToken = getSourceToken()

  if (!sourceToken) {
    // Fallback to console in development
    console.error('[Error Tracking Disabled]', error, context)
    return
  }

  try {
    await fetch('https://in.logs.betterstack.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sourceToken}`,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        level: 'error',
        message: error.message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context: context || {},
      }),
    })
  } catch (trackingError) {
    // Don't let error tracking break the app
    console.error('Failed to track error:', trackingError)
  }
}

/**
 * Track warning to BetterStack
 */
export async function trackWarning(
  message: string,
  context?: ErrorContext,
): Promise<void> {
  const sourceToken = getSourceToken()

  if (!sourceToken) {
    console.warn('[Warning Tracking Disabled]', message, context)
    return
  }

  try {
    await fetch('https://in.logs.betterstack.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sourceToken}`,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        level: 'warn',
        message,
        context: context || {},
      }),
    })
  } catch (trackingError) {
    console.error('Failed to track warning:', trackingError)
  }
}

/**
 * Track info event to BetterStack
 */
export async function trackInfo(
  message: string,
  context?: Record<string, any>,
): Promise<void> {
  const sourceToken = getSourceToken()

  if (!sourceToken) {
    return // Don't log info in development
  }

  try {
    await fetch('https://in.logs.betterstack.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sourceToken}`,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        level: 'info',
        message,
        context: context || {},
      }),
    })
  } catch (trackingError) {
    console.error('Failed to track info:', trackingError)
  }
}

/**
 * Get source token from environment
 * Works in both Node.js and Cloudflare Workers
 */
function getSourceToken(): string | undefined {
  // Try process.env first (Node.js/Bun)
  if (typeof process !== 'undefined' && process.env.BETTERSTACK_SOURCE_TOKEN) {
    return process.env.BETTERSTACK_SOURCE_TOKEN
  }

  // Try Cloudflare Workers env (runtime)
  // Note: This will be undefined at module load time
  // Must be called within request context
  try {
    // Use globalThis to access Cloudflare Workers env safely
    const globalEnv = globalThis as any
    if (typeof globalEnv.BETTERSTACK_SOURCE_TOKEN !== 'undefined') {
      return globalEnv.BETTERSTACK_SOURCE_TOKEN as string
    }
  } catch {
    // Not in Cloudflare Workers context
  }

  return undefined
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<
  T extends (...args: Array<any>) => Promise<any>,
>(fn: T, context?: ErrorContext): T {
  return (async (...args: Array<any>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof Error) {
        await trackError(error, context)
      }
      throw error
    }
  }) as T
}
