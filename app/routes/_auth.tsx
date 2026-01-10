import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { checkAuthFn } from '~/lib/auth/server'
import { AppShell } from '~/components/layout/shell'

export const Route = createFileRoute('/_auth')({
    loader: async () => {
        try {
            const { user } = await checkAuthFn()
            if (!user) {
                throw redirect({ to: '/login' })
            }
            return { user }
        } catch (_) {
            throw redirect({ to: '/login' })
        }
    },
    component: AuthLayout,
})

function AuthLayout() {
    const { user } = Route.useLoaderData()

    return (
        <AppShell user={user}>
            <Outlet />
        </AppShell>
    )
}
