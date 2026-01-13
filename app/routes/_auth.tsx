import {
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import { checkAuthFn } from '~/features/auth/server'
import { checkNeedsOnboardingFn } from '~/features/onboarding/server'
import { AppShell } from '~/components/layout/shell'
import { FarmProvider, useFarm } from '~/features/farms/context'
import { ModuleProvider } from '~/features/modules/context'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    try {
      const { user: authUser } = await checkAuthFn()

      // Map to our User type
      const user = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role as 'admin' | 'user',
        banned: authUser.banned || false,
        banReason: authUser.banReason || null,
        banExpires: authUser.banExpires || null,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
      }

      // Skip onboarding check if already on onboarding page
      if (location.pathname === '/onboarding') {
        return { user, needsOnboarding: false }
      }

      // Check if user needs onboarding
      const { needsOnboarding } = await checkNeedsOnboardingFn()

      // Redirect new users to onboarding
      if (needsOnboarding) {
        throw redirect({ to: '/onboarding' })
      }

      return { user, needsOnboarding }
    } catch (error: unknown) {
      // Handle redirect errors (pass them through)
      if (error && typeof error === 'object' && 'to' in error) {
        throw error
      }
      // Only redirect on auth errors, not other errors
      const message = error instanceof Error ? error.message : ''
      if (message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw error
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { user } = Route.useRouteContext()
  const location = useLocation()

  // Don't show AppShell on onboarding page
  if (location.pathname === '/onboarding') {
    return <Outlet />
  }

  return (
    <FarmProvider>
      <ModuleProviderWrapper>
        <AppShell user={user}>
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
