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
import { FarmProvider, useFarm } from '~/features/farms/context'
import { ModuleProvider } from '~/features/modules/context'

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

  return (
    <FarmProvider>
      <ModuleProviderWrapper>
        <AppShell user={user as User}>
          <Outlet />
        </AppShell>
      </ModuleProviderWrapper>
    </FarmProvider>
  )
}

function ModuleProviderWrapper({ children }: { children: React.ReactNode }) {
  const { selectedFarmId } = useFarm()
  return <ModuleProvider farmId={selectedFarmId}>{children}</ModuleProvider>
}
