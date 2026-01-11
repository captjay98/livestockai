import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { checkAuthFn } from '~/lib/auth/server'
import { AppShell } from '~/components/layout/shell'

export const Route = createFileRoute('/_auth')({
    beforeLoad: async () => {
        try {
            const { user } = await checkAuthFn()
            if (!user) {
                throw redirect({ to: '/login' })
            }
            return { user }
        } catch (error: any) {
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

    return (
        <AppShell user={user}>
            <Outlet />
        </AppShell>
    )
}
