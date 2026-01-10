import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Pool, neonConfig } from '@neondatabase/serverless'

// Enable WebSocket for serverless environments
neonConfig.webSocketConstructor = globalThis.WebSocket

// Create a separate pool for better-auth using Neon serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Web Crypto API compatible password hashing (works on Cloudflare Workers)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  const hashArray = new Uint8Array(hash)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)
  return btoa(String.fromCharCode(...combined))
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const combined = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const storedHash = combined.slice(16)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const newHash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  const newHashArray = new Uint8Array(newHash)
  if (storedHash.length !== newHashArray.length) return false
  return storedHash.every((byte, i) => byte === newHashArray[i])
}

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }) => verifyPassword(hash, password),
    },
  },
  session: {
    modelName: 'sessions',
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    modelName: 'users',
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'staff',
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
    'http://localhost:5173',
    'https://jayfarms.captjay98.workers.dev',
  ],
  plugins: [tanstackStartCookies()],
})
