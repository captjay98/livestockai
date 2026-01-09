import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000', // Your app's URL
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
