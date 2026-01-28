import { createAuthClient } from 'better-auth/react'
import { adminClient } from 'better-auth/client/plugins'

// Use relative URL so it works in both dev and production
export const authClient = createAuthClient({
    baseURL: typeof window !== 'undefined' ? window.location.origin : '',
    plugins: [adminClient()],
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient

// Export admin namespace for admin operations
export const { admin } = authClient
