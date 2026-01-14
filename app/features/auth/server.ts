import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { auth } from './config'
import { requireAuth } from './server-middleware'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(LoginSchema)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    try {
      const { email, password } = data
      const res = await auth.api.signInEmail({
        body: { email, password },
        headers,
      })
      return { success: true, user: res.user }
    } catch (e: unknown) {
      console.error('Login Error:', e)
      const message = e instanceof Error ? e.message : 'Login failed'
      return { success: false, error: message }
    }
  })

export const checkAuthFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = await requireAuth()
      return { user: session.user }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Auth check failed'
      console.error('checkAuthFn error:', message)
      throw error
    }
  },
)
