import { createAuthClient } from 'better-auth/react'

// Use relative URL so it works in both dev and production
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
