/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup
 * Only runs in Node.js/Bun (dev, migrations, tests)
 * Cloudflare Workers uses env bindings validated by Cloudflare
 */

import { z } from 'zod'

const envSchema = z.object({
  // Required
  DATABASE_URL: z
    .string()
    .url()
    .describe('PostgreSQL connection string (Neon)'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .describe('Better Auth secret key (min 32 chars)'),
  BETTER_AUTH_URL: z.string().url().describe('Better Auth callback URL'),

  // Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Optional - Error Tracking
  BETTERSTACK_SOURCE_TOKEN: z
    .string()
    .optional()
    .describe('BetterStack Logtail source token'),

  // Optional - Test Database
  DATABASE_URL_TEST: z
    .string()
    .url()
    .optional()
    .describe('Test database connection string'),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables
 * Call this at app startup (server.ts)
 */
export function validateEnv(): Env {
  // Only validate in Node.js/Bun environments
  if (typeof process === 'undefined') {
    throw new Error('validateEnv() should only be called in Node.js/Bun')
  }

  try {
    const env = envSchema.parse(process.env)
    console.log('✅ Environment variables validated successfully')
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:\n')
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      console.error('\nRequired environment variables:')
      console.error('  DATABASE_URL - PostgreSQL connection string')
      console.error('  BETTER_AUTH_SECRET - Min 32 characters')
      console.error('  BETTER_AUTH_URL - Callback URL')
      console.error('\nOptional environment variables:')
      console.error('  BETTERSTACK_SOURCE_TOKEN - Error tracking')
      console.error('  DATABASE_URL_TEST - Test database')
      console.error('\nSee .env.example for reference')
    }
    throw error
  }
}

/**
 * Get validated environment variables
 * Safe to call after validateEnv()
 */
export function getEnv(): Env {
  if (typeof process === 'undefined') {
    throw new Error('getEnv() should only be called in Node.js/Bun')
  }
  return process.env as unknown as Env
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV === 'production'
  }
  return false
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV === 'development'
  }
  return true // Default to development in Workers
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV === 'test'
  }
  return false
}
