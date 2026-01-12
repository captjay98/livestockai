import {
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import { checkAuthFn } from '~/lib/auth/server'
import { checkNeedsOnboardingFn } from '~/lib/onboarding/server'
import { AppShell } from '~/components/layout/shell'
import { FarmProvider, useFarm } from '~/components/farm-context'
import { ModuleProvider } from '~/components/module-context'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    try {
      const { user } = await checkAuthFn()

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
    } catch (error: any) {
      // Handle redirect errors (pass them through)
      if (error?.to) {
        throw error
      }
      // Only redirect on auth errors, not other errors
      if (error?.message === 'UNAUTHORIZED' || !error?.user) {
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
