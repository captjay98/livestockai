import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'

// Create a separate pool for better-auth
const pool = new Pool({
  database: process.env.DATABASE_NAME || 'jayfarms',
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
})

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for development
    password: {
      hash: async (password) => {
        return bcrypt.hash(password, 10)
      },
      verify: async ({ hash, password }) => {
        return bcrypt.compare(password, hash)
      },
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
  ],
  plugins: [tanstackStartCookies()], // Handle cookies for TanStack Start
})
