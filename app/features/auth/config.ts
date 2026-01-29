import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { admin } from 'better-auth/plugins'
import { neon } from '@neondatabase/serverless'
import { NeonDialect } from 'kysely-neon'

// Environment variables cache (populated on first access)
let envCache: {
  DATABASE_URL?: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
} | null = null

/**
 * Get environment variables from the appropriate source.
 * - Cloudflare Workers: uses dynamic import of 'cloudflare:workers'
 * - Node.js/Bun: uses process.env
 */
async function getEnv() {
  if (envCache) return envCache

  // Try Cloudflare Workers env first
  try {
    const { env } = await import('cloudflare:workers')
    envCache = {
      DATABASE_URL: env.DATABASE_URL,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    }
  } catch {
    // Fallback to process.env for Node.js/Bun
    envCache = {
      DATABASE_URL: process.env.DATABASE_URL,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    }
  }
  return envCache
}

// Web Crypto API compatible password hashing (works on Cloudflare Workers)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  const hashArray = new Uint8Array(hash)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)
  return btoa(String.fromCharCode(...combined))
}

async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  const encoder = new TextEncoder()
  const combined = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const storedHash = combined.slice(16)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const newHash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  const newHashArray = new Uint8Array(newHash)
  if (storedHash.length !== newHashArray.length) return false
  return storedHash.every((byte, i) => byte === newHashArray[i])
}

// Lazy-initialized auth instance for Cloudflare Workers compatibility
// Environment variables aren't available at module load time in workerd
let authInstance: ReturnType<typeof betterAuth> | undefined
let authInitPromise: Promise<ReturnType<typeof betterAuth>> | undefined

async function createAuth() {
  const env = await getEnv()
  const { debug, error } = await import('~/lib/logger')

  await debug('[AUTH CONFIG] Creating auth instance...')
  await debug('[AUTH CONFIG] env.DATABASE_URL exists:', !!env.DATABASE_URL)
  await debug(
    '[AUTH CONFIG] env.BETTER_AUTH_SECRET exists:',
    !!env.BETTER_AUTH_SECRET,
  )
  await debug('[AUTH CONFIG] env.BETTER_AUTH_URL:', env.BETTER_AUTH_URL)

  if (!env.DATABASE_URL) {
    await error('[AUTH CONFIG] DATABASE_URL is missing!')
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return betterAuth({
    database: {
      dialect: new NeonDialect({
        neon: neon(env.DATABASE_URL),
      }),
      type: 'postgres',
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    // Generate UUIDs instead of nanoid (matches our database schema)
    advanced: {
      generateId: () => crypto.randomUUID(),
      cookiePrefix: 'livestockai',
      useSecureCookies: true,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: process.env.NODE_ENV === 'production',
      password: {
        hash: hashPassword,
        verify: async ({ hash, password }) => verifyPassword(hash, password),
      },
    },
    session: {
      modelName: 'sessions',
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    user: {
      modelName: 'users',
      additionalFields: {
        role: {
          type: 'string',
          required: true,
          defaultValue: 'user',
        },
        banned: {
          type: 'boolean',
          required: false,
          defaultValue: false,
        },
        banReason: {
          type: 'string',
          required: false,
        },
        banExpires: {
          type: 'date',
          required: false,
        },
        userType: {
          type: 'string',
          required: false,
          defaultValue: 'farmer',
          input: true, // Allow users to set this during registration
        },
      },
    },
    account: {
      modelName: 'account',
    },
    verification: {
      modelName: 'verification',
    },
    trustedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ],
    plugins: [
      tanstackStartCookies(),
      admin({
        defaultRole: 'user',
        adminRoles: ['admin'],
      }),
    ],
  })
}

/**
 * Get the auth instance (async initialization).
 * Use this in server functions: const auth = await getAuth()
 */
export async function getAuth(): Promise<ReturnType<typeof betterAuth>> {
  if (authInstance) return authInstance

  if (!authInitPromise) {
    authInitPromise = createAuth().then((instance) => {
      authInstance = instance
      return instance
    })
  }

  return authInitPromise
}

// Export a proxy for backward compatibility (will initialize on first use)
// Note: This only works for sync property access after async initialization
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    if (!authInstance) {
      // Trigger async initialization
      getAuth()
      throw new Error(
        'Auth not initialized yet. Use `const auth = await getAuth()` in server functions.',
      )
    }
    // Type-safe property access
    return authInstance[prop as keyof typeof authInstance]
  },
})
