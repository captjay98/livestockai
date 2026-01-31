import {
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import type { User } from '~/features/auth/types'
import { checkAuthFn } from '~/features/auth/server'
import { checkNeedsOnboardingFn } from '~/features/onboarding/server'
import { AppShell } from '~/components/layout/shell'
import { useFarm } from '~/features/farms/context'
import { ModuleProvider } from '~/features/modules/context'

// Cache expiry time: 7 days (matches session expiry)
const USER_CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

// Type for cached user with timestamp
interface CachedUser {
  user: User
  cachedAt: number
}

// Type for Better Auth user with custom fields
interface BetterAuthUser {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'user'
  banned: boolean
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
  updatedAt: Date
}

// Type guard to check if user has custom fields
function hasCustomFields(user: unknown): user is BetterAuthUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'role' in user &&
    'banned' in user
  )
}

// Map Better Auth user to our User type with safe defaults
function mapAuthUser(authUser: BetterAuthUser) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
    role: authUser.role,
    banned: authUser.banned,
    banReason: authUser.banReason,
    banExpires: authUser.banExpires,
    createdAt: authUser.createdAt,
    updatedAt: authUser.updatedAt,
  }
}

export const Route = createFileRoute('/_auth')({
  // Disable caching for this loader since onboarding status can change
  staleTime: 0,
  gcTime: 0,
  beforeLoad: async ({ location }) => {
    // Check if offline (only in browser)
    if (typeof window !== 'undefined' && !navigator.onLine) {
      // Try to get cached user from localStorage
      const cachedData = localStorage.getItem('livestockai-cached-user')
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData) as CachedUser | User

          // Handle both old format (just User) and new format (CachedUser with timestamp)
          let user: User
          let isExpired = false

          if ('cachedAt' in parsed) {
            // New format with timestamp
            user = parsed.user
            isExpired = Date.now() - parsed.cachedAt > USER_CACHE_EXPIRY_MS
          } else {
            // Old format (just User) - treat as not expired but migrate on next online
            user = parsed
          }

          if (isExpired) {
            console.log('[Auth] Offline - cached user expired')
            localStorage.removeItem('livestockai-cached-user')
            throw redirect({ to: '/offline' })
          }

          console.log('[Auth] Offline - using cached user')
          return { user, needsOnboarding: false }
        } catch (e) {
          // Invalid cache or redirect, handle appropriately
          if (e && typeof e === 'object' && 'to' in e) {
            throw e // Re-throw redirect
          }
          localStorage.removeItem('livestockai-cached-user')
          throw redirect({ to: '/offline' })
        }
      }
      // No cached user, redirect to offline page
      throw redirect({ to: '/offline' })
    }

    try {
      // Fetch auth and onboarding status in parallel
      const [authResult, onboardingResult] = await Promise.all([
        checkAuthFn({ data: {} }),
        location.pathname.startsWith('/onboarding')
          ? Promise.resolve({ needsOnboarding: false })
          : checkNeedsOnboardingFn({ data: {} }),
      ])

      const { user: authUser } = authResult || { user: null }
      const { needsOnboarding } = onboardingResult

      if (!authUser) {
        throw redirect({ to: '/login' })
      }

      // Safely map user with type guard
      const user = hasCustomFields(authUser)
        ? mapAuthUser(authUser)
        : {
            id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            role: 'user' as const,
            banned: false,
            banReason: null,
            banExpires: null,
            createdAt: authUser.createdAt,
            updatedAt: authUser.updatedAt,
          }

      // Cache user for offline use (only in browser) with timestamp
      if (typeof window !== 'undefined') {
        const cachedUser: CachedUser = {
          user,
          cachedAt: Date.now(),
        }
        localStorage.setItem(
          'livestockai-cached-user',
          JSON.stringify(cachedUser),
        )
      }

      // Redirect new users to onboarding
      if (needsOnboarding && !location.pathname.startsWith('/onboarding')) {
        throw redirect({ to: '/onboarding' })
      }

      return { user, needsOnboarding }
    } catch (error: unknown) {
      // Handle redirect errors (pass them through)
      if (error && typeof error === 'object' && 'to' in error) {
        throw error
      }
      // Check for AppError with UNAUTHORIZED reason
      if (
        error &&
        typeof error === 'object' &&
        'reason' in error &&
        (error as { reason?: string }).reason === 'UNAUTHORIZED'
      ) {
        throw redirect({ to: '/login' })
      }
      // Fallback: check message for backward compatibility
      const message = error instanceof Error ? error.message : ''
      if (message === 'UNAUTHORIZED' || message === 'Not authenticated') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const context = Route.useRouteContext()
  const location = useLocation()

  // Don't show AppShell on onboarding page
  if (location.pathname === '/onboarding') {
    return <Outlet />
  }

  const { user } = context

  // FarmProvider is already in __root.tsx, so we just need ModuleProvider here
  return (
    <ModuleProviderWrapper>
      <AppShell user={user}>
        <Outlet />
      </AppShell>
    </ModuleProviderWrapper>
  )
}

function ModuleProviderWrapper({ children }: { children: React.ReactNode }) {
  const { selectedFarmId } = useFarm()
  return <ModuleProvider farmId={selectedFarmId}>{children}</ModuleProvider>
}
