import type { Generated } from 'kysely'

// User & Auth - Better Auth tables use camelCase
// Note: Passwords are stored in the 'account' table, not here (Better Auth pattern)
export interface UserTable {
  id: Generated<string>
  email: string
  // password field removed - Better Auth stores passwords in account table
  name: string
  role: 'admin' | 'user'
  emailVerified: Generated<boolean>
  image: string | null // PRIVATE storage - user avatar URL
  // Admin plugin fields
  banned: Generated<boolean>
  banReason: string | null
  banExpires: Date | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface SessionTable {
  id: string
  userId: string
  expiresAt: Date
  token: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface AccountTable {
  id: string
  userId: string
  accountId: string
  providerId: string
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: Date | null
  refreshTokenExpiresAt: Date | null
  scope: string | null
  idToken: string | null
  password: string | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface VerificationTable {
  id: string
  identifier: string
  value: string
  expiresAt: Date
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}
